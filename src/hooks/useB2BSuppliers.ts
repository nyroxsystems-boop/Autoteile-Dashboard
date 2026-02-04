import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface SupplierDefinition {
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    website: string;
    country: string;
    hasApi: boolean;
    features: string[];
    credentialFields: { key: string; label: string; type: 'text' | 'password'; required?: boolean }[];
    settingFields: { key: string; label: string; type: 'number' | 'select' | 'toggle'; defaultValue?: any; options?: { value: string; label: string }[]; min?: number; max?: number }[];
    config: SupplierConfig | null;
    isEnabled: boolean;
}

export interface SupplierConfig {
    enabled: boolean;
    credentials: Record<string, string>;
    settings: Record<string, any>;
    status: 'connected' | 'disconnected' | 'error';
}

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<SupplierDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<SupplierDefinition[]>('/api/b2b/suppliers');
            setSuppliers(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    };

    const updateSupplier = async (key: string, data: { enabled?: boolean; credentials?: Record<string, string>; settings?: Record<string, any> }) => {
        try {
            await apiClient.put(`/api/b2b/suppliers/${key}`, data);
            await fetchSuppliers();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const calculateMargin = async (purchasePrice: number, marginPercent: number, minMargin: number) => {
        try {
            return await apiClient.post<{ purchasePrice: number; sellingPrice: number; marginAmount: number; marginPercent: number }>('/api/b2b/calculate-margin', { purchasePrice, marginPercent, minMargin });
        } catch {
            return null;
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    return { suppliers, loading, error, updateSupplier, calculateMargin, refresh: fetchSuppliers };
}
