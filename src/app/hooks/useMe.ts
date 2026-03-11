
import { useState, useEffect } from 'react';
import { getMe, MeResponse } from '../api/wws';
import { getAuthToken } from '../api/client';

export function useMe() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function loadMe() {
            // Don't fetch if not authenticated
            const token = getAuthToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getMe();
                setMe(data);

                // Automatically persist tenant ID to localStorage for API requests
                if (data?.tenant?.id) {
                    localStorage.setItem('selectedTenantId', data.tenant.id.toString()); // centralized write
                }
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        loadMe();
    }, []);

    return { me, loading, error };
}
