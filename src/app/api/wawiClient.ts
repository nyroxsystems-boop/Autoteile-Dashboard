/// <reference types="vite/client" />

/**
 * Dedicated API client for the WaWi backend (Django/InvenTree).
 * Separate from the Bot Service client — points to the WaWi deployment.
 *
 * Auth: Bearer JWT (not Token) — matches Django REST SimpleJWT.
 */

const WAWI_BASE_URL = import.meta.env.VITE_WAWI_BASE_URL || 'https://wawi-production.up.railway.app';

if (!WAWI_BASE_URL || WAWI_BASE_URL === '/') {
    console.error('[WaWi Client] Invalid WAWI_BASE_URL:', WAWI_BASE_URL);
} else {
    console.log('[WaWi Client] Using WAWI_BASE_URL:', WAWI_BASE_URL);
}

function getDeviceId(): string {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

/**
 * Returns the best available auth token.
 * Priority: auth_access_token > token > authToken
 */
function getAuthToken(): string | null {
    return localStorage.getItem('auth_access_token')
        || localStorage.getItem('token')
        || localStorage.getItem('authToken');
}

export async function wawiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${WAWI_BASE_URL}${endpoint}`;

    const tenantId = localStorage.getItem('selectedTenantId');
    const token = getAuthToken();
    const deviceId = getDeviceId();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        // WaWi backend uses SimpleJWT → Bearer format
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

/**
 * Fetch a list endpoint that may return paginated DRF response.
 * Automatically unwraps { count, next, results: T[] } → T[]
 * Also handles plain array responses for backwards compatibility.
 */
export async function wawiFetchList<T>(endpoint: string, options: RequestInit = {}): Promise<T[]> {
    const data = await wawiFetch<T[] | { count: number; next: string | null; results: T[] }>(endpoint, options);
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in data) {
        return (data as { results: T[] }).results;
    }
    return data as unknown as T[];
}

/**
 * Fetch binary content (e.g. PDF downloads) from WaWi backend.
 */
export async function wawiFetchBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${WAWI_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    const tenantId = localStorage.getItem('selectedTenantId');

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
            ...(options.headers as Record<string, string> || {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
    }

    return response.blob();
}
