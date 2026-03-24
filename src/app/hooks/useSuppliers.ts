
import { useState, useEffect } from 'react';
import { getSuppliers, Supplier } from '../api/wws';
import { toast } from 'sonner';

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
            toast.error('Fehler beim Laden der Lieferanten');
            setError('Fehler beim Laden der Lieferanten');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return { suppliers, loading, error, refresh: load };
}
