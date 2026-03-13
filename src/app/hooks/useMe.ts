
import { useState, useEffect } from 'react';
import { getMe, MeResponse } from '../api/wws';
import { getAuthToken } from '../api/client';

// Module-level cache to prevent duplicate API calls across components
let cachedMe: MeResponse | null = null;
let mePromise: Promise<MeResponse> | null = null;

export function useMe() {
    const [me, setMe] = useState<MeResponse | null>(cachedMe);
    const [loading, setLoading] = useState(!cachedMe);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }

        // If we already have cached data, use it immediately
        if (cachedMe) {
            setMe(cachedMe);
            setLoading(false);
            return;
        }

        // Deduplicate in-flight requests
        if (!mePromise) {
            mePromise = getMe();
        }

        let cancelled = false;
        mePromise
            .then((data) => {
                cachedMe = data;
                mePromise = null;
                if (!cancelled) {
                    setMe(data);
                    if (data?.tenant?.id) {
                        localStorage.setItem('selectedTenantId', data.tenant.id.toString());
                    }
                }
            })
            .catch((err) => {
                mePromise = null;
                if (!cancelled) setError(err as Error);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { me, loading, error };
}

// Allow clearing cache (e.g., on logout)
export function clearMeCache() {
    cachedMe = null;
    mePromise = null;
}
