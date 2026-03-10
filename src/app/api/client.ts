/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';

// Validate API_BASE_URL at module load
if (!API_BASE_URL || API_BASE_URL.startsWith('/')) {
    console.error('[API Client] Invalid API_BASE_URL:', API_BASE_URL);
    console.error('[API Client] Environment:', import.meta.env);
} else {
    // API_BASE_URL configured via env
}

function getDeviceId() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Multi-tenancy support
    const tenantId = localStorage.getItem('selectedTenantId');
    const token = localStorage.getItem('token') || localStorage.getItem('auth_access_token');
    const deviceId = getDeviceId();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        // Keep Authorization header for backwards compat — remove once all clients use cookies
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',  // Send httpOnly cookies with every request
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
