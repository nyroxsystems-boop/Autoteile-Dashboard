import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    merchant_id?: string;
}

interface AuthSession {
    token: string;
    user: User;
    expiresAt: number | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    session: { user: User | null; token: string | null };
    login: (token: string, user: User, expiresIn?: number) => void;
    logout: () => void;
    refreshToken: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

const SESSION_STORAGE_KEY = 'auth_session';
const DEFAULT_EXPIRY_HOURS = 24;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';

    // Helper: Check if token is expired
    const isTokenExpired = (expiresAt: number | null): boolean => {
        if (!expiresAt) return false;
        return Date.now() >= expiresAt;
    };

    // Helper: Save session to localStorage
    const saveSession = (sessionData: AuthSession) => {
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
            // Keep legacy token for backwards compatibility
            localStorage.setItem('token', sessionData.token);
        } catch (err) {
            console.error('Failed to save session', err);
        }
    };

    // Helper: Load session from localStorage
    const loadSession = (): AuthSession | null => {
        try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }

            // Fallback to legacy token-only storage
            const legacyToken = localStorage.getItem('token');
            if (legacyToken) {
                return {
                    token: legacyToken,
                    user: null as any,
                    expiresAt: null
                };
            }
        } catch (err) {
            console.error('Failed to load session', err);
        }
        return null;
    };

    // Helper: Clear all auth data
    const clearSession = () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedTenantId');
        sessionStorage.clear();
    };

    // Verify token with backend
    const verifyToken = async (authToken: string): Promise<User | null> => {
        try {
            const res = await axios.get(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Token ${authToken}` }
            });
            return res.data;
        } catch (err) {
            console.error('Token verification failed', err);
            return null;
        }
    };

    // Initialize auth on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedSession = loadSession();

            if (storedSession) {
                // Check if token is expired
                if (storedSession.expiresAt && isTokenExpired(storedSession.expiresAt)) {
                    console.log('Token expired, logging out');
                    clearSession();
                    setLoading(false);
                    return;
                }

                // Restore session
                setToken(storedSession.token);

                // If user data is missing, fetch from backend
                if (storedSession.user) {
                    setUser(storedSession.user);
                } else {
                    const userData = await verifyToken(storedSession.token);
                    if (userData) {
                        setUser(userData);
                        // Update stored session with user data
                        saveSession({ ...storedSession, user: userData });
                    } else {
                        clearSession();
                    }
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User, expiresIn?: number) => {
        const expiresAt = expiresIn
            ? Date.now() + (expiresIn * 1000)
            : Date.now() + (DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

        setToken(newToken);
        setUser(newUser);

        saveSession({
            token: newToken,
            user: newUser,
            expiresAt
        });

        navigate('/overview');
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        clearSession();
        navigate('/auth');
    };

    const refreshToken = async () => {
        if (!token) return;

        try {
            const res = await axios.post(`${API_BASE}/api/auth/refresh`, {}, {
                headers: { Authorization: `Token ${token}` }
            });

            const { access, user: refreshedUser, expires_in } = res.data;
            login(access, refreshedUser || user!, expires_in);
        } catch (err) {
            console.error('Token refresh failed', err);
            logout();
        }
    };

    const isAuthenticated = !!user && !!token;

    // Session getter for compatibility
    const session = { user, token };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            session,
            login,
            logout,
            refreshToken,
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
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return children;
}

