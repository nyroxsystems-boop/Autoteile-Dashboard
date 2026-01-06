
import { useState, useEffect, useCallback } from 'react';
import { getInvoices, Invoice } from '../api/wws';

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getInvoices();
            setInvoices(data || []);
            setError(null);
        } catch (err: any) {
            // Always silently handle errors - billing endpoint is optional
            // The backend may not be configured yet
            console.warn('Invoices not available:', err.message);
            setInvoices([]);
            setError(null); // Don't show error to user
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { invoices, loading, error, refetch: load };
}
