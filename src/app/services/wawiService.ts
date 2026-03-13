import { apiFetch, ApiError, API_BASE_URL, getAuthToken } from '../api/client';

// Adapter: route all calls through Bot-Service (same DB as Admin Dashboard)
// Gracefully handles 404 for endpoints not yet implemented on the backend
async function wawiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        return await apiFetch<T>(endpoint, options);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
            console.debug(`[WaWi] Endpoint not available: ${endpoint}`);
            return {} as T;
        }
        throw err;
    }
}

async function wawiFetchList<T>(endpoint: string): Promise<T[]> {
    try {
        const data = await apiFetch<T[] | { results?: T[] }>(endpoint);
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            return data.results;
        }
        return [];
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
            console.debug(`[WaWi] Endpoint not available: ${endpoint}`);
            return [];
        }
        throw err;
    }
}

async function wawiFetchBlob(endpoint: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            ...(token ? { 'Authorization': `Token ${token}` } : {}),
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
    return res.blob();
}

export interface Part {
    id: number | string;
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
    purchase_price?: number;
    sale_price?: number;
    weight?: number;
    stock_locations?: StockByLocation[];
}

export interface StockMovement {
    id: number;
    part_id: number;
    part_name?: string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION';
    quantity: number;
    reference?: string;
    notes?: string;
    from_location?: number;
    to_location?: number;
    from_location_name?: string;
    to_location_name?: string;
    created_at: string;
    created_by: string;
    created_by_name?: string;
}

export interface WarehouseLocation {
    id: number;
    name: string;
    type: 'main' | 'shelf' | 'returns' | 'quarantine';
    code: string;
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
    website?: string;
    notes?: string;
    status: 'active' | 'inactive';
    active?: boolean;
    payment_terms?: string;
    rating?: number;
    created_at?: string;
}

export interface SupplierArticle {
    id: number;
    supplier: number;
    supplier_name: string;
    product: number;
    supplier_sku: string;
    purchase_price: number;
    currency: string;
    lead_time_days?: number;
    minimum_order_quantity?: number;
    is_preferred?: boolean;
}

export interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier: number;
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
    product: number;
    part_id?: number;
    part_name: string;
    part_ipn: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    received_quantity?: number;
}

export interface SupplierRating {
    id: number;
    supplier: number;
    supplier_name: string;
    period: string;
    orders_total: number;
    orders_on_time: number;
    orders_late: number;
    avg_delivery_days: number;
    quality_score: number | string;
    return_rate: number | string;
    communication_score: number | string;
    overall_score: number | string;
    notes?: string;
}

export interface ReturnItem {
    id: number;
    product?: number;
    product_name?: string;
    product_ipn?: string;
    quantity: number;
    reason: string;
    notes?: string;
    status: string;
    contact_name?: string;
    refund_amount?: number;
}

export interface OemCrossRef {
    id: number;
    product: number;
    oem_number: string;
    brand?: string;
    oem_type?: string;
}

export interface VehicleApplication {
    id: number;
    product: number;
    kba_hsn?: string;
    kba_tsn?: string;
    make?: string;
    model?: string;
    year_from?: number;
    year_to?: number;
}

export interface PriceRule {
    id: number;
    product: number;
    profile: string;
    min_quantity: number;
    price: number;
    discount_percent: number;
}

export interface BOMComponent {
    id: number;
    part_id: number;
    part_name: string;
    part_ipn: string;
    quantity: number;
    available_stock?: number;
}

export const wawiService = {
    // ── Products ──────────────────────────────────────────────
    getArticles: async () => {
        return await wawiFetchList<Part>('/api/products/');
    },

    getArticleDetails: async (id: number | string) => {
        return await wawiFetch<Part>(`/api/products/${id}/`);
    },

    createArticle: async (data: Partial<Part>) => {
        return await wawiFetch<Part>('/api/products/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateArticle: async (id: number | string, data: Partial<Part>) => {
        return await wawiFetch<Part>(`/api/products/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    deleteArticle: async (id: number | string) => {
        await wawiFetch(`/api/products/${id}/`, { method: 'DELETE' });
    },

    // ── Stock Movements ──────────────────────────────────────
    getRecentMovements: async (limit = 50) => {
        return await wawiFetchList<StockMovement>(`/api/stock-movements/?limit=${limit}`);
    },

    getMovementHistory: async (partId: number | string) => {
        return await wawiFetchList<StockMovement>(`/api/stock-movements/?part_id=${partId}`);
    },

    createMovement: async (movement: Partial<StockMovement>) => {
        return await wawiFetch<StockMovement>('/api/stock-movements/', {
            method: 'POST',
            body: JSON.stringify(movement),
        });
    },

    // ── Locations ─────────────────────────────────────────────
    getLocations: async () => {
        return await wawiFetchList<WarehouseLocation>('/api/stock-locations/');
    },

    createLocation: async (data: Partial<WarehouseLocation>) => {
        return await wawiFetch<WarehouseLocation>('/api/stock-locations/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ── Suppliers ─────────────────────────────────────────────
    getSuppliers: async () => {
        return await wawiFetchList<Supplier>('/api/suppliers/');
    },

    getSupplierDetails: async (id: number | string) => {
        return await wawiFetch<Supplier>(`/api/suppliers/${id}/`);
    },

    createSupplier: async (supplier: Partial<Supplier>) => {
        return await wawiFetch<Supplier>('/api/suppliers/', {
            method: 'POST',
            body: JSON.stringify(supplier),
        });
    },

    updateSupplier: async (id: number | string, patch: Partial<Supplier>) => {
        return await wawiFetch<Supplier>(`/api/suppliers/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        });
    },

    deleteSupplier: async (id: number | string) => {
        await wawiFetch(`/api/suppliers/${id}/`, { method: 'DELETE' });
    },

    getSupplierArticles: async (supplierId?: number) => {
        const url = supplierId
            ? `/api/supplier-articles/?supplier_id=${supplierId}`
            : '/api/supplier-articles/';
        return await wawiFetchList<SupplierArticle>(url);
    },

    // ── Purchase Orders ──────────────────────────────────────
    getPurchaseOrders: async () => {
        return await wawiFetchList<PurchaseOrder>('/api/purchase-orders/');
    },

    createPurchaseOrder: async (order: {
        supplier: number;
        items: Array<{ product: number; quantity: number; unit_price?: number }>;
        expected_delivery?: string;
        notes?: string;
    }) => {
        return await wawiFetch<PurchaseOrder>('/api/purchase-orders/', {
            method: 'POST',
            body: JSON.stringify(order),
        });
    },

    updatePurchaseOrder: async (id: number | string, patch: Partial<PurchaseOrder>) => {
        return await wawiFetch<PurchaseOrder>(`/api/purchase-orders/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        });
    },

    cancelPurchaseOrder: async (id: number | string) => {
        return await wawiFetch<PurchaseOrder>(`/api/purchase-orders/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
        });
    },

    receivePurchaseOrder: async (poId: number | string, data: {
        location_id?: number;
        items: Array<{ item_id: number; quantity: number }>;
    }) => {
        return await wawiFetch(`/api/purchase-orders/${poId}/receive/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ── Server-side Stats & Suggestions ──────────────────────
    getStats: async () => {
        return await wawiFetch<{
            totalArticles: number;
            lowStockCount: number;
            totalValue: number;
        }>('/api/products/stats/');
    },

    getReorderSuggestions: async () => {
        return await wawiFetchList<unknown>('/api/products/reorder-suggestions/');
    },

    // ── Dashboard Summary (combined stats) ───────────────────
    getDashboardSummary: async () => {
        return await wawiFetch('/api/dashboard/summary/');
    },

    // ── Feature 1: OEM Cross-References ──────────────────────
    getOemCrossRefs: async (productId?: number) => {
        const url = productId ? `/api/oem-cross-refs/?product=${productId}` : '/api/oem-cross-refs/';
        return await wawiFetchList<OemCrossRef>(url);
    },

    searchByOem: async (query: string) => {
        return await wawiFetchList(`/api/oem-cross-refs/search/?q=${encodeURIComponent(query)}`);
    },

    createOemCrossRef: async (data: { product: number; oem_number: string; brand?: string; oem_type?: string; source?: string }) => {
        return await wawiFetch('/api/oem-cross-refs/', { method: 'POST', body: JSON.stringify(data) });
    },

    deleteOemCrossRef: async (id: number) => {
        await wawiFetch(`/api/oem-cross-refs/${id}/`, { method: 'DELETE' });
    },

    // ── Feature 3: Vehicle Applications ──────────────────────
    getVehicleApplications: async (productId?: number) => {
        const url = productId ? `/api/vehicle-applications/?product=${productId}` : '/api/vehicle-applications/';
        return await wawiFetchList<VehicleApplication>(url);
    },

    searchByVehicle: async (params: { hsn?: string; tsn?: string; make?: string; model?: string }) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString();
        return await wawiFetchList(`/api/vehicle-applications/search/?${qs}`);
    },

    createVehicleApplication: async (data: { product: number; hsn?: string; tsn?: string; make?: string; model?: string; year_from?: number; year_to?: number }) => {
        return await wawiFetch('/api/vehicle-applications/', { method: 'POST', body: JSON.stringify(data) });
    },

    deleteVehicleApplication: async (id: number) => {
        await wawiFetch(`/api/vehicle-applications/${id}/`, { method: 'DELETE' });
    },

    // ── Feature 2: Returns ───────────────────────────────────
    getReturns: async (statusFilter?: string) => {
        const url = statusFilter ? `/api/returns/?status=${statusFilter}` : '/api/returns/';
        return await wawiFetchList<ReturnItem>(url);
    },

    createReturn: async (data: { order?: number; product?: number; contact?: number; quantity: number; reason: string; notes?: string; location?: number }) => {
        return await wawiFetch('/api/returns/', { method: 'POST', body: JSON.stringify(data) });
    },

    approveReturn: async (id: number) => {
        return await wawiFetch(`/api/returns/${id}/approve/`, { method: 'POST' });
    },

    receiveReturn: async (id: number, restock = false) => {
        return await wawiFetch(`/api/returns/${id}/receive/`, { method: 'POST', body: JSON.stringify({ restock }) });
    },

    refundReturn: async (id: number, refundAmount?: number, createCreditNote = false) => {
        return await wawiFetch(`/api/returns/${id}/refund/`, {
            method: 'POST',
            body: JSON.stringify({ refund_amount: refundAmount, create_credit_note: createCreditNote }),
        });
    },

    rejectReturn: async (id: number, reason?: string) => {
        return await wawiFetch(`/api/returns/${id}/reject/`, { method: 'POST', body: JSON.stringify({ reason }) });
    },

    // ── Feature 5: Price Rules ───────────────────────────────
    getPriceRules: async (productId?: number) => {
        const url = productId ? `/api/price-rules/?product=${productId}` : '/api/price-rules/';
        return await wawiFetchList<PriceRule>(url);
    },

    createPriceRule: async (data: { product: number; profile: string; min_quantity: number; price: number; discount_percent?: number }) => {
        return await wawiFetch('/api/price-rules/', { method: 'POST', body: JSON.stringify(data) });
    },

    deletePriceRule: async (id: number) => {
        await wawiFetch(`/api/price-rules/${id}/`, { method: 'DELETE' });
    },

    calculatePrice: async (productId: number, quantity: number, profile = 'endkunde') => {
        return await wawiFetch(`/api/price-rules/calculate/?product=${productId}&quantity=${quantity}&profile=${profile}`);
    },

    // ── Feature 4: DATEV Export ──────────────────────────────
    exportDATEV: async (from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const blob = await wawiFetchBlob(`/api/billing/reports/datev/?${params.toString()}`);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'datev_export.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    // ── Feature 7: BOM Items (Stücklisten) ───────────────────
    getBomItems: async (parentId?: number) => {
        const url = parentId ? `/api/bom-items/?parent=${parentId}` : '/api/bom-items/';
        return await wawiFetchList(url);
    },

    createBomItem: async (data: { parent: number; component: number; quantity: number; notes?: string }) => {
        return await wawiFetch('/api/bom-items/', { method: 'POST', body: JSON.stringify(data) });
    },

    deleteBomItem: async (id: number) => {
        await wawiFetch(`/api/bom-items/${id}/`, { method: 'DELETE' });
    },

    explodeBom: async (parentId: number, locationId: number, quantity = 1) => {
        return await wawiFetch('/api/bom-items/explode/', {
            method: 'POST',
            body: JSON.stringify({ parent: parentId, location: locationId, quantity }),
        });
    },

    // ── Feature 8: Supplier Ratings ──────────────────────────
    getSupplierRatings: async (supplierId?: number) => {
        const url = supplierId ? `/api/supplier-ratings/?supplier=${supplierId}` : '/api/supplier-ratings/';
        return await wawiFetchList<SupplierRating>(url);
    },

    createSupplierRating: async (data: {
        supplier: number; period: string;
        orders_total: number; orders_on_time: number; orders_late: number;
        avg_delivery_days: number; quality_score: number; return_rate: number;
        communication_score: number; notes?: string;
    }) => {
        return await wawiFetch('/api/supplier-ratings/', { method: 'POST', body: JSON.stringify(data) });
    },

    updateSupplierRating: async (id: number, data: Partial<{ supplier: number; period: string; orders_total: number; orders_on_time: number; orders_late: number; avg_delivery_days: number; quality_score: number; return_rate: number; communication_score: number; notes: string }>) => {
        return await wawiFetch(`/api/supplier-ratings/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },

    recalculateSupplierRating: async (id: number) => {
        return await wawiFetch(`/api/supplier-ratings/${id}/recalculate/`, { method: 'POST' });
    },

    // ── Feature 9: Smart Reorder (AI) ────────────────────────
    getSmartReorder: async (lookbackDays = 90, forecastDays = 30) => {
        return await wawiFetch(`/api/ai/smart-reorder/?days=${lookbackDays}&forecast_days=${forecastDays}`);
    },

    // ── Feature 10: Fuzzy OEM Search (AI) ────────────────────
    fuzzyOemSearch: async (query: string) => {
        return await wawiFetch(`/api/ai/oem-search/?q=${encodeURIComponent(query)}`);
    },

    // ── Feature 11: Price Optimization (AI) ──────────────────
    getPriceOptimization: async () => {
        return await wawiFetch('/api/ai/price-optimization/');
    },

    // ── Feature 13: Anomaly Detection (AI) ───────────────────
    getAnomalies: async (days = 7, threshold = 3.0) => {
        return await wawiFetch(`/api/ai/anomalies/?days=${days}&threshold=${threshold}`);
    },

    // ── Feature 14: Dashboard Briefing (AI) ──────────────────
    getBriefing: async () => {
        return await wawiFetch('/api/ai/briefing/');
    },
};
