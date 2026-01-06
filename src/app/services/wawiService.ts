import { apiFetch } from '../api/client';

export interface Part {
    id: number;
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

    getArticleDetails: async (id: number) => {
        return await apiFetch<Part>(`/api/products/${id}/`);
    },

    getRecentMovements: async () => {
        // Placeholder until backend endpoints are ready
        return [] as StockMovement[];
    },

    getMovementHistory: async (partId: number) => {
        // Placeholder - will fetch detailed movement log for a specific part
        return [] as StockMovement[];
    },

    getLocations: async () => {
        // Placeholder - will fetch all warehouse locations
        return [
            { id: 1, name: 'Hauptlager', type: 'main', code: 'A1', capacity: 1000, current_stock: 450 },
            { id: 2, name: 'Regal B3', type: 'shelf', code: 'B3', capacity: 200, current_stock: 87 },
            { id: 3, name: 'Wareneingang Quarantäne', type: 'quarantine', code: 'Q1', capacity: 100, current_stock: 12 },
            { id: 4, name: 'Retouren', type: 'returns', code: 'R1', capacity: 150, current_stock: 23 },
        ] as WarehouseLocation[];
    },

    createMovement: async (movement: Partial<StockMovement>) => {
        // Placeholder - will create a new stock movement
        console.log('Creating movement:', movement);
        return { id: Date.now(), ...movement } as StockMovement;
    },

    // Procurement methods
    getSuppliers: async () => {
        // Placeholder - will fetch all suppliers
        return [] as Supplier[];
    },

    getSupplierDetails: async (id: number) => {
        // Placeholder - will fetch supplier details
        console.log('Fetching supplier:', id);
        return null as Supplier | null;
    },

    createSupplier: async (supplier: Partial<Supplier>) => {
        console.log('Creating supplier:', supplier);
        return { id: Date.now(), ...supplier, status: 'active' } as Supplier;
    },

    getSupplierArticles: async (supplierId?: number) => {
        // Placeholder - will fetch supplier-article relationships
        return [] as SupplierArticle[];
    },

    getPurchaseOrders: async () => {
        // Placeholder - will fetch all purchase orders
        return [] as PurchaseOrder[];
    },

    createPurchaseOrder: async (order: Partial<PurchaseOrder>) => {
        console.log('Creating purchase order:', order);
        return { id: Date.now(), order_number: `PO-${Date.now()}`, ...order } as PurchaseOrder;
    },

    getReorderSuggestions: async () => {
        // Get articles below minimum stock
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
