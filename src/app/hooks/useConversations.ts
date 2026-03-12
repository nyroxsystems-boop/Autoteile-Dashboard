
import { useState, useEffect, useCallback } from 'react';
import { getConversations, Conversation } from '../api/wws';

// Auto-refresh interval in milliseconds (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useConversations(autoRefresh = true) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const refresh = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();

        // Auto-refresh polling
        if (autoRefresh) {
            const interval = setInterval(() => {
                refresh(true); // Silent refresh (no loading spinner)
            }, REFRESH_INTERVAL);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, refresh]);

    return { conversations, loading, error, refresh, lastUpdated };
}
