/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** Centralized token access — single point for all auth token reads */
export function getAuthToken(): string | null {
    return localStorage.getItem('auth_access_token');
}

/** Centralized tenant ID access — single point for all tenant ID reads */
export function getTenantId(): string | null {
    return localStorage.getItem('selectedTenantId');
}

// Validate API_BASE_URL at module load
if (!API_BASE_URL || API_BASE_URL.startsWith('/')) {
    // console.error('[API Client] Invalid API_BASE_URL:', API_BASE_URL);
    // console.error('[API Client] Environment:', import.meta.env);
} else {
    // API_BASE_URL configured via env
}

export function getDeviceId() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Multi-tenancy support (centralized via helpers above)
    const tenantId = getTenantId();
    const token = getAuthToken();
    const deviceId = getDeviceId();

    // Read CSRF token from cookie for Double-Submit pattern
    const csrfToken = document.cookie.split('; ')
        .find(c => c.startsWith('csrf_token='))?.split('=')[1] || '';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        'X-CSRF-Token': csrfToken,
        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        // Keep Authorization header for backwards compat — remove once all clients use cookies
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',  // Send httpOnly cookies with every request
        });

        // 429 Too Many Requests — fail immediately, retrying just makes it worse
        if (response.status === 429) {
            throw new ApiError(`Rate limited on ${endpoint}`, 429);
        }

        // Retry only on 5xx Server Errors with exponential backoff
        if (response.status >= 500 && response.status < 600) {
            lastError = new ApiError(`Server error ${response.status} on ${endpoint}`, response.status);
            const waitMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue;
        }

        // 401 Unauthorized — session expired or token invalid, force re-login
        if (response.status === 401) {
            localStorage.removeItem('auth_session');
            localStorage.removeItem('auth_access_token');
            localStorage.removeItem('selectedTenantId');
            sessionStorage.clear();
            // Reload triggers the auth check and shows LoginView
            window.location.reload();
            throw new ApiError('Session expired', 401);
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new ApiError(error.detail || `Request failed with status ${response.status}`, response.status);
        }

        // Some endpoints might return 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // All retries exhausted (only reachable for 5xx errors)
    throw lastError || new ApiError(`Server error after ${MAX_RETRIES} retries: ${endpoint}`, 500);
}
