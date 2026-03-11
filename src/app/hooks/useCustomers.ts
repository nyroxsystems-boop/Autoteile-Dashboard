
import { useState, useEffect } from 'react';
import { getCustomers } from '../api/wws';

interface Customer {
    id: number;
    name: string;
    wa_id?: string;
}

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { customers, loading, error, refresh };
}
