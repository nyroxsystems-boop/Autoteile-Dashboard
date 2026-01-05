
import { useState, useEffect } from 'react';
import { getMeTenants } from '../api/wws';

export interface TenantMembership {
    id: number;
    tenant: number;
    tenant_name: string;
    tenant_slug: string;
    role: string;
    is_active: boolean;
}

export function useTenants() {
    const [tenants, setTenants] = useState<TenantMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTenantId, setCurrentTenantId] = useState<number | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Use real backend API to get tenant list
                const tenantList = await getMeTenants();

                if (tenantList && tenantList.length > 0) {
                    setTenants(tenantList);

                    // Restore previously selected tenant or use first
                    const savedTenantId = localStorage.getItem('selectedTenantId');
                    const tenantToSelect = savedTenantId
                        ? tenantList.find(t => t.tenant.toString() === savedTenantId)
                        : tenantList[0];

                    if (tenantToSelect) {
                        setCurrentTenantId(tenantToSelect.tenant);
                        localStorage.setItem('selectedTenantId', tenantToSelect.tenant.toString());
                    }
                } else {
                    console.warn('No tenants returned from API');
                }
            } catch (err) {
                console.error('Failed to load tenants', err);
                // If API fails, keep empty state - don't fall back to mock data
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const switchTenant = (id: number) => {
        setCurrentTenantId(id);
        localStorage.setItem('selectedTenantId', id.toString());
        // In a real app, this might trigger a page reload or update a context/header
        window.location.reload();
    };

    return {
        tenants,
        loading,
        currentTenant: tenants.find(t => t.tenant === currentTenantId),
        switchTenant
    };
}
