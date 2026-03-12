
import { useState, useEffect } from 'react';
import { getSuppliers, Supplier } from '../api/wws';
import { toast } from 'sonner';

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getSuppliers();
                setSuppliers(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch suppliers:', err);
                toast.error('Fehler beim Laden der Lieferanten');
                setError('Fehler beim Laden der Lieferanten');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { suppliers, loading, error };
}
