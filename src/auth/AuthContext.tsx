import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { clearMeCache } from '../app/hooks/useMe';
import { clearTenantsCache } from '../app/hooks/useTenants';

/**
 * Unified Auth Context — Single source of truth for authentication.
 * 
 * Token storage: single key 'auth_access_token' in localStorage.
 * Tenant isolation: 'selectedTenantId' set immediately on login.
 * Session expiry: auto-logout after 24h (configurable).
 * Refresh: auto-refresh 5min before expiry.
 */

interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    merchant_id?: string;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
}

interface AuthSession {
    token: string;
    refreshToken: string | null;
    user: User;
    tenant: Tenant | null;
    expiresAt: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    tenant: Tenant | null;
    session: { user: User | null; token: string | null };
    login: (data: LoginData) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

interface LoginData {
    access: string;
    refresh?: string;
    user: User;
    tenant?: Tenant | null;
    expires_in?: number;
}

const AuthContext = createContext<AuthContextType>(null!);

const SESSION_KEY = 'auth_session';
const TOKEN_KEY = 'auth_access_token';
const TENANT_KEY = 'selectedTenantId';
const DEFAULT_EXPIRY_HOURS = 24;
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 min before expiry

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

    // ── Helpers ──────────────────────────────────────────────────────────

    const clearAllAuth = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TENANT_KEY);
        // Clear legacy keys
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const saveSession = useCallback((session: AuthSession) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, session.token);
        if (session.tenant?.id) {
            localStorage.setItem(TENANT_KEY, session.tenant.id.toString());
        }
    }, []);

    const scheduleRefresh = useCallback((expiresAt: number, refreshTokenValue: string | null) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        const timeUntilRefresh = expiresAt - Date.now() - REFRESH_BUFFER_MS;

        if (timeUntilRefresh <= 0) {
            // Already past refresh window — try immediately or logout
            if (refreshTokenValue) {
                performRefresh(refreshTokenValue);
            } else {
                // No refresh token, just check if fully expired
                if (Date.now() >= expiresAt) {
                    clearAllAuth();
                    setUser(null);
                    setToken(null);
                    setTenant(null);
                }
            }
            return;
        }

        refreshTimerRef.current = setTimeout(() => {
            if (refreshTokenValue) {
                performRefresh(refreshTokenValue);
            }
        }, timeUntilRefresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearAllAuth]);

    const performRefresh = useCallback(async (refreshTokenValue: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send both for backend compatibility
                body: JSON.stringify({ refresh: refreshTokenValue, refreshToken: refreshTokenValue }),
            });

            if (!res.ok) {
                throw new Error('Refresh failed');
            }

            const data = await res.json();
            const newToken = data.accessToken || data.access;
            const expiresIn = data.expiresIn || data.expires_in || DEFAULT_EXPIRY_HOURS * 3600;
            const expiresAt = Date.now() + (expiresIn * 1000);

            setToken(newToken);

            const currentSession = loadSession();
            if (currentSession) {
                const updatedSession: AuthSession = {
                    ...currentSession,
                    token: newToken,
                    refreshToken: data.refreshToken || data.refresh || currentSession.refreshToken,
                    expiresAt,
                };
                saveSession(updatedSession);
                scheduleRefresh(expiresAt, updatedSession.refreshToken);
            }
        } catch (err) {
            // Refresh failed — force logout
            clearAllAuth();
            setUser(null);
            setToken(null);
            setTenant(null);
            navigate('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_BASE, clearAllAuth, navigate, saveSession]);

    function loadSession(): AuthSession | null {
        try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {
            // Corrupted session
        }
        return null;
    }

    // ── Initialize ──────────────────────────────────────────────────────

    useEffect(() => {
        const initAuth = async () => {
            const session = loadSession();

            if (!session) {
                // Check for existing token (single source of truth)
                const existingToken = localStorage.getItem(TOKEN_KEY);

                if (existingToken) {
                    // Migrate: verify with backend and create proper session
                    try {
                        const res = await fetch(`${API_BASE}/api/auth/me/`, {
                            headers: { Authorization: `Token ${existingToken}` },
                        });
                        if (res.ok) {
                            const userData = await res.json();
                            const expiresAt = Date.now() + (DEFAULT_EXPIRY_HOURS * 3600 * 1000);
                            // Handle both flat { id, email, ... } and nested { user: { id, ... } } formats
                            const u = userData.user || userData;
                            const newSession: AuthSession = {
                                token: existingToken,
                                refreshToken: localStorage.getItem('auth_refresh_token'),
                                user: {
                                    id: u.id || '',
                                    email: u.email || '',
                                    username: u.username || '',
                                    role: u.role || 'member',
                                    merchant_id: u.merchant_id,
                                },
                                tenant: userData.tenant || null,
                                expiresAt,
                            };
                            saveSession(newSession);
                            setToken(existingToken);
                            setUser(newSession.user);
                            setTenant(newSession.tenant);
                            scheduleRefresh(expiresAt, newSession.refreshToken);
                        } else {
                            clearAllAuth();
                        }
                    } catch {
                        clearAllAuth();
                    }
                }
                setLoading(false);
                return;
            }

            // Check expiry
            if (Date.now() >= session.expiresAt) {
                // Expired — try refresh
                if (session.refreshToken) {
                    await performRefresh(session.refreshToken);
                } else {
                    clearAllAuth();
                }
                setLoading(false);
                return;
            }

            // Valid session — restore
            setToken(session.token);
            setUser(session.user);
            setTenant(session.tenant);
            scheduleRefresh(session.expiresAt, session.refreshToken);
            setLoading(false);
        };

        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Public API ──────────────────────────────────────────────────────

    const login = useCallback((data: LoginData) => {
        const expiresIn = data.expires_in || DEFAULT_EXPIRY_HOURS * 3600;
        const expiresAt = Date.now() + (expiresIn * 1000);

        const session: AuthSession = {
            token: data.access,
            refreshToken: data.refresh || null,
            user: data.user,
            tenant: data.tenant || null,
            expiresAt,
        };

        setToken(data.access);
        setUser(data.user);
        setTenant(data.tenant || null);

        saveSession(session);
        scheduleRefresh(expiresAt, session.refreshToken);

        navigate('/bot/heute');
    }, [navigate, saveSession, scheduleRefresh]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setTenant(null);
        clearAllAuth();
        // Clear module-level caches so next login gets fresh data
        clearMeCache();
        clearTenantsCache();
        navigate('/');
    }, [clearAllAuth, navigate]);

    const isAuthenticated = !!user && !!token;
    const session = { user, token };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            tenant,
            session,
            login,
            logout,
            isAuthenticated,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: JSX.Element }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <div className="h-3 w-24 bg-muted rounded animate-shimmer" />
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}
