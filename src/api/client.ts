interface ApiError extends Error {
    status?: number;
    url?: string;
    body?: any;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem('token');

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }

        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let parsedError;
                try {
                    parsedError = JSON.parse(errorBody);
                } catch {
                    parsedError = { error: errorBody };
                }

                // Auto-logout on 401 Unauthorized
                if (response.status === 401) {
                    console.log('[API Client] 401 Unauthorized - clearing session and redirecting to auth');
                    localStorage.removeItem('auth_session');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('selectedTenantId');
                    window.location.href = '/auth';
                }

                const error = new Error(parsedError.error || parsedError.message || `HTTP ${response.status}`) as ApiError;
                error.status = response.status;
                error.url = url;
                error.body = parsedError;
                throw error;
            }

            // Handle empty responses
            const text = await response.text();
            if (!text) return {} as T;

            return JSON.parse(text) as T;
        } catch (error) {
            if (error instanceof Error) {
                const apiError = error as ApiError;
                apiError.url = apiError.url || url;
                throw apiError;
            }
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
