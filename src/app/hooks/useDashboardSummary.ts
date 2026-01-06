
import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary, DashboardSummary } from '../api/wws';

// Auto-refresh interval in milliseconds (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useDashboardSummary(autoRefresh = true) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const refresh = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDashboardSummary();
            setSummary(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Zusammenfassung');
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

    return { summary, loading, error, refresh, lastUpdated };
}
