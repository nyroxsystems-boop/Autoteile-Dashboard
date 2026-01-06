import { apiFetch } from '../api/client';

export interface Part {
    id: number | string; // Support both numeric and UUID IDs
    name: string;
    IPN: string;
    description: string;
    total_in_stock: number;
    minimum_stock: number;
    category_name?: string;
    image?: string;
    brand?: string;
    status?: 'active' | 'inactive';
    article_type?: 'standard' | 'set' | 'deposit';
    bom_components?: BOMComponent[];
    stock_locations?: StockByLocation[]; // New: Stock distributed across locations
}

export interface BOMComponent {
    id: number;
    part_id: number;
    part_name: string;
    part_ipn: string;
    quantity: number;
    available_stock?: number;
}

export interface StockMovement {
    id: number;
    part_id: number;
    part_name?: string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION';
    quantity: number;
    reference?: string;
    notes?: string;
    from_location?: string;
    to_location?: string;
    created_at: string;
    created_by: string;
    created_by_name?: string;
}

export interface WarehouseLocation {
    id: number;
    name: string;
    type: 'main' | 'shelf' | 'returns' | 'quarantine';
    code: string; // e.g. "A1-03"
    capacity?: number;
    current_stock?: number;
}

export interface StockByLocation {
    location_id: number;
    location_name: string;
    location_code: string;
    quantity: number;
}

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    status: 'active' | 'inactive';
    payment_terms?: string;
    created_at?: string;
}

export interface SupplierArticle {
    id: number;
    supplier_id: number;
    supplier_name: string;
    part_id: number;
    supplier_sku: string;
    purchase_price: number;
    currency: string;
    lead_time_days?: number;
    minimum_order_quantity?: number;
}

export interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier_id: number;
    supplier_name: string;
    status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
    order_date: string;
    expected_delivery?: string;
    total_amount: number;
    currency: string;
    items: PurchaseOrderItem[];
    notes?: string;
}

export interface PurchaseOrderItem {
    id: number;
    part_id: number;
    part_name: string;
    part_ipn: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export const wawiService = {
    getArticles: async () => {
        return await apiFetch<Part[]>('/api/products/');
    },

    getArticleDetails: async (id: number | string) => {
        return await apiFetch<Part>(`/api/products/${id}/`);
    },

    getRecentMovements: async () => {
        return await apiFetch<StockMovement[]>('/api/stock/movements?limit=50');
    },

    getMovementHistory: async (partId: number | string) => {
        return await apiFetch<StockMovement[]>(`/api/stock/movements?part_id=${partId}`);
    },

    createMovement: async (movement: Partial<StockMovement>) => {
        return await apiFetch<StockMovement>('/api/stock/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movement)
        });
    },

    getLocations: async () => {
        return await apiFetch<WarehouseLocation[]>('/api/stock/locations');
    },

    // Procurement methods
    getSuppliers: async () => {
        return await apiFetch<Supplier[]>('/api/suppliers/');
    },

    getSupplierDetails: async (id: number | string) => {
        return await apiFetch<Supplier>(`/api/suppliers/${id}/`);
    },

    createSupplier: async (supplier: Partial<Supplier>) => {
        return await apiFetch<Supplier>('/api/suppliers/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier)
        });
    },

    updateSupplier: async (id: number | string, patch: Partial<Supplier>) => {
        return await apiFetch<Supplier>(`/api/suppliers/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
    },

    deleteSupplier: async (id: number | string) => {
        await apiFetch(`/api/suppliers/${id}/`, {
            method: 'DELETE'
        });
    },

    getSupplierArticles: async (supplierId?: number) => {
        // Placeholder - will fetch supplier-article relationships
        return [] as SupplierArticle[];
    },

    getPurchaseOrders: async () => {
        return await apiFetch<PurchaseOrder[]>('/api/purchase-orders/');
    },

    createPurchaseOrder: async (order: Partial<PurchaseOrder>) => {
        return await apiFetch<PurchaseOrder>('/api/purchase-orders/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
    },

    updatePurchaseOrder: async (id: number | string, patch: Partial<PurchaseOrder>) => {
        return await apiFetch<PurchaseOrder>(`/api/purchase-orders/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
    },

    cancelPurchaseOrder: async (id: number | string) => {
        await apiFetch(`/api/purchase-orders/${id}/`, {
            method: 'DELETE'
        });
    },

    receivePurchaseOrder: async (poId: number | string, data: any) => {
        return await apiFetch(`/api/purchase-orders/${poId}/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    getReorderSuggestions: async () => {
        const articles = await wawiService.getArticles();
        return articles
            .filter(a => a.total_in_stock < a.minimum_stock)
            .map(a => ({
                part: a,
                current_stock: a.total_in_stock,
                minimum_stock: a.minimum_stock,
                suggested_order_quantity: Math.max(a.minimum_stock - a.total_in_stock, a.minimum_stock),
            }));
    },

    getStats: async () => {
        const articles = await apiFetch<Part[]>('/api/products/');
        const lowStock = articles.filter(p => p.total_in_stock < p.minimum_stock).length;
        return {
            totalArticles: articles.length,
            lowStockCount: lowStock,
            totalValue: 0 // Will need backend support for EK calculation
        };
    }
};
