
import { useState, useEffect } from 'react';
import { getMe, MeResponse } from '../api/wws';

export function useMe() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function loadMe() {
            try {
                setLoading(true);
                const data = await getMe();
                setMe(data);

                // Automatically persist tenant ID to localStorage for API requests
                if (data?.tenant?.id) {
                    localStorage.setItem('selectedTenantId', data.tenant.id.toString());
                    // Tenant ID saved to localStorage
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
