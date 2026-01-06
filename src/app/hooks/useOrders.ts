
import { useState, useEffect, useCallback } from 'react';
import { getOrders, Order } from '../api/wws';

// Auto-refresh interval in milliseconds (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useOrders(autoRefresh = true) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        // Auto-refresh polling
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchOrders(true); // Silent refresh (no loading spinner)
            }, REFRESH_INTERVAL);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, fetchOrders]);

    return { orders, loading, error, refresh: fetchOrders, lastUpdated };
}
