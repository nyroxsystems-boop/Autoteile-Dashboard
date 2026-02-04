import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface B2BSupplier {
    name: string;
    displayName: string;
    description: string;
    hasApi: boolean;
    website: string;
    config: B2BSupplierConfig | null;
}

export interface B2BSupplierConfig {
    enabled: boolean;
    price_tier: string;
    margin_type: 'percentage' | 'fixed';
    margin_value: number;
    minimum_margin: number;
    rounding_strategy: 'up' | 'down' | 'nearest';
    round_to: number;
    priority: number;
    hasCredentials: boolean;
}

export interface PriceTier {
    id: string;
    name: string;
    discount: number;
    minOrders: number;
}

export function useB2BSuppliers() {
    const [suppliers, setSuppliers] = useState<B2BSupplier[]>([]);
    const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<B2BSupplier[]>('/api/b2b/suppliers');
            setSuppliers(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Lieferanten');
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceTiers = async () => {
        try {
            const data = await apiClient.get<PriceTier[]>('/api/b2b/price-tiers');
            setPriceTiers(data || []);
        } catch (err) {
            console.error('Failed to fetch price tiers:', err);
        }
    };

    const updateSupplier = async (name: string, config: Partial<B2BSupplierConfig & { api_key?: string; api_secret?: string; account_number?: string }>) => {
        try {
            await apiClient.put(`/api/b2b/suppliers/${name}`, config);
            await fetchSuppliers();
            return true;
        } catch (err: any) {
            setError(err.message || 'Fehler beim Speichern');
            return false;
        }
    };

    const calculateMargin = async (purchasePrice: number, supplierName: string) => {
        try {
            const result = await apiClient.post<{
                purchasePrice: number;
                sellingPrice: number;
                marginAmount: number;
                marginPercent: number;
                formatted: { purchase: string; selling: string; margin: string };
            }>('/api/b2b/calculate-margin', { purchasePrice, supplierName });
            return result;
        } catch (err) {
            console.error('Failed to calculate margin:', err);
            return null;
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchPriceTiers();
    }, []);

    return {
        suppliers,
        priceTiers,
        loading,
        error,
        updateSupplier,
        calculateMargin,
        refresh: fetchSuppliers
    };
}
