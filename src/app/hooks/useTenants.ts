
import { useState, useEffect, useCallback } from 'react';
import { getMeTenants } from '../api/wws';
import { getAuthToken, getTenantId } from '../api/client';
import { toast } from 'sonner';
import { safeReload } from '../utils/desktop';

export interface TenantMembership {
    id: number;
    tenant: number;
    tenant_name: string;
    tenant_slug?: string;
    role: string;
    is_active?: boolean;
}

// Module-level cache to prevent duplicate API calls
let cachedTenants: TenantMembership[] | null = null;
let tenantsPromise: Promise<TenantMembership[]> | null = null;
let cachedCurrentTenantId: number | null = null;

export function useTenants() {
    const [tenants, setTenants] = useState<TenantMembership[]>(cachedTenants || []);
    const [loading, setLoading] = useState(!cachedTenants);
    const [currentTenantId, setCurrentTenantId] = useState<number | null>(cachedCurrentTenantId);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }

        // If we already have cached data, use it
        if (cachedTenants) {
            setTenants(cachedTenants);
            if (cachedCurrentTenantId) setCurrentTenantId(cachedCurrentTenantId);
            setLoading(false);
            return;
        }

        // Deduplicate in-flight requests
        if (!tenantsPromise) {
            tenantsPromise = getMeTenants();
        }

        let cancelled = false;
        tenantsPromise
            .then((tenantList) => {
                tenantsPromise = null;
                if (!tenantList || !Array.isArray(tenantList) || tenantList.length === 0) {
                    cachedTenants = [];
                    if (!cancelled) setLoading(false);
                    return;
                }

                cachedTenants = tenantList;
                if (!cancelled) setTenants(tenantList);

                const savedTenantId = getTenantId();
                const tenantToSelect = savedTenantId
                    ? tenantList.find(t => t.tenant.toString() === savedTenantId)
                    : tenantList[0];

                if (tenantToSelect) {
                    cachedCurrentTenantId = tenantToSelect.tenant;
                    if (!cancelled) setCurrentTenantId(tenantToSelect.tenant);
                    localStorage.setItem('selectedTenantId', tenantToSelect.tenant.toString());
                }
            })
            .catch((err) => {
                tenantsPromise = null;
                console.error('Failed to load tenants', err);
                if (!cancelled) toast.error('Fehler beim Laden der Teams');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    const switchTenant = useCallback((id: number) => {
        setCurrentTenantId(id);
        cachedCurrentTenantId = id;
        localStorage.setItem('selectedTenantId', id.toString());
        // Clear all caches and reload to get fresh data for new tenant
        cachedTenants = null;
        tenantsPromise = null;
        safeReload();
    }, []);

    return {
        tenants,
        loading,
        currentTenant: tenants.find(t => t.tenant === currentTenantId),
        switchTenant
    };
}

// Allow clearing cache (e.g., on logout)
export function clearTenantsCache() {
    cachedTenants = null;
    tenantsPromise = null;
    cachedCurrentTenantId = null;
}
