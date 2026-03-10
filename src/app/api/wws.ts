/// <reference types="vite/client" />
import { wawiFetch, wawiFetchBlob, wawiFetchList } from './wawiClient';
import { apiFetch } from './client';

// Aligned with bot-service/src/types/dashboard.ts

export interface Order {
    id: string; // UUID
    status: string; // 'new' | 'in_progress' | 'done'
    language?: string | null;
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
    customerId?: string | null;
    customerPhone?: string | null;

    // Vehicle Data
    vehicle?: {
        vin?: string | null;
        hsn?: string | null;
        tsn?: string | null;
        make?: string | null;
        model?: string | null;
        year?: number | null;
        engine?: string | null;
    } | null;

    // Part Data
    part?: {
        partCategory?: string | null;
        position?: string | null;
        partText?: string | null;
        partDetails?: Record<string, any> | null;
        oemStatus?: "pending" | "success" | "not_found" | "multiple_matches" | null;
        oemNumber?: string | null;
    } | null;

    oem_number?: string | null;

    // Legacy support (optional)
    external_ref?: string;
    order_data?: any;
    contact?: { name: string; wa_id?: string };

    // Aliases found in legacy code
    vehicle_json?: any; // To allow legacy code to compile, though undefined
    part_json?: any;
    oem?: string;

    // Order-Invoice Linking
    generated_invoice_id?: string | null; // Invoice ID if created from this order
}

export interface Offer {
    id: string;
    orderId: string;
    shopName?: string; // e.g. "Autodoc"
    supplierName?: string; // Compatibility

    // Product Info
    brand: string;
    productName: string;
    oemNumber?: string | null;
    sku?: string; // Optional if scraping gives it

    // Pricing
    basePrice: number;
    currency?: string;
    deliveryTimeDays?: number;

    // Meta
    status: string; // 'draft' | 'published'
    tier?: string | null;
    meta_json?: any;

    // Frontend helpers
    product_name?: string; // Alias
    price?: string; // Alias for display
}

export interface Invoice {
    id: number;
    invoice_number: string;
    status: 'draft' | 'issued' | 'paid' | 'canceled';
    total: string;
    currency: string;
    issue_date: string;
    due_date: string;
    order?: number;
    contact?: {
        name: string;
    };
}

export interface Supplier {
    id: number;
    name: string;
    rating: string;
    api_type: string;
    status?: string;
    lastUpdate?: string;
    reliability?: number;
    created_at?: string;
    updated_at?: string;
}

export interface DashboardSummary {
    ordersNew: number;
    ordersInProgress: number;
    invoicesDraft: number;
    invoicesIssued: number;
    revenueToday: number;
    revenueHistory?: Array<{ date: string; revenue: number; orders: number }>;
    topCustomers?: Array<{ name: string; revenue: number; orders: number; avatar: string }>;
    activities?: Array<{ id: string; type: 'message' | 'quote' | 'order' | 'completed'; customer: string; description: string; time: string; status: 'waiting' | 'processing' | 'success' | 'error' }>;
    avgMargin?: number;
    marginRevenue?: number;
    lastSync: string;
}

export interface MeResponse {
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        is_owner: boolean;
    };
    tenant: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

export interface WholesalerConfig {
    id: string;
    name: string;
    portal: 'tecdoc' | 'autodoc_pro' | 'stahlgruber' | 'wm_se' | 'custom';
    apiKey: string;       // masked in API responses
    accountId?: string;   // Kundennummer
    status: 'connected' | 'error' | 'pending';
    lastSync?: string;
    createdAt?: string;
}

export interface MerchantSettings {
    merchantId: string;
    wholesalers: WholesalerConfig[];
    marginPercent: number;
    priceProfiles: any[];
    notifications?: Record<string, boolean>;
}

export interface Message {
    id: string;
    direction: 'IN' | 'OUT';
    content: string;
    createdAt: string;
    isFromCustomer: boolean;
}

export interface AdminStats {
    total_tenants: number;
    total_users: number;
    total_devices: number;
    tenants: Array<{
        id: number;
        name: string;
        slug: string;
        user_count: number;
        max_users: number;
        device_count: number;
        max_devices: number;
        is_active: boolean;
    }>;
}

export interface ActiveDevice {
    id: number;
    user: string;
    device_id: string;
    last_seen: string;
    ip: string;
    ua: string;
}

export async function getOrders(): Promise<Order[]> {
    return wawiFetchList<Order>('/api/orders/');
}

export async function getOrderMessages(orderId: string | number): Promise<Message[]> {
    return wawiFetchList<Message>(`/api/orders/${orderId}/messages/`);
}

export async function sendMessage(orderId: string | number, content: string): Promise<Message> {
    return wawiFetch<Message>(`/api/orders/${orderId}/messages/`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

export async function getOrderOffers(orderId: string | number): Promise<Offer[]> {
    return wawiFetchList<Offer>(`/api/orders/${orderId}/offers/`);
}

export async function createOffer(orderId: string | number, offerData: any): Promise<Offer> {
    return wawiFetch<Offer>(`/api/orders/${orderId}/offers/`, {
        method: 'POST',
        body: JSON.stringify(offerData)
    });
}

export async function publishOffers(orderId: string | number, offerIds: (string | number)[]): Promise<{ success: boolean }> {
    return wawiFetch<{ success: boolean }>(`/api/orders/${orderId}/offers/publish/`, {
        method: 'POST',
        body: JSON.stringify({ offerIds }),
    });
}

export async function createInvoice(orderId: string | number): Promise<Invoice> {
    return wawiFetch(`/api/orders/${orderId}/create-invoice/`, {
        method: 'POST',
    });
}

export async function getInvoices(): Promise<Invoice[]> {
    return wawiFetchList<Invoice>('/api/billing/invoices/');
}

export async function getSuppliers(): Promise<Supplier[]> {
    return wawiFetchList<Supplier>('/api/suppliers/');
}

export async function login(credentials: { email?: string, username?: string, password?: string, tenant?: string }): Promise<any> {
    const device_id = localStorage.getItem('deviceId');
    // Auth goes through Bot-Service (shared user DB with Admin Dashboard)
    const data = await apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ ...credentials, device_id }),
    });
    // Token storage is handled by AuthContext.login()
    // We only return the response data here
    return data;
}

export async function getMeTenants(): Promise<any[]> {
    // Auth goes through Bot-Service
    const data = await apiFetch<any[]>('/api/auth/me/tenants');
    return Array.isArray(data) ? data : [];
}

export async function getCustomers(): Promise<any[]> {
    return wawiFetchList<any>('/api/whatsapp/contacts/');
}

export async function getConversations(): Promise<any[]> {
    return wawiFetchList<any>('/api/whatsapp/contacts/');
}

export async function downloadInvoicePdf(id: number): Promise<void> {
    const blob = await wawiFetchBlob(`/api/billing/invoices/${id}/pdf/`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return wawiFetch<DashboardSummary>('/api/dashboard/summary/');
}

export async function getMe(): Promise<MeResponse> {
    // Auth goes through Bot-Service
    return apiFetch<MeResponse>('/api/auth/me');
}

export async function updateProfile(data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}): Promise<MeResponse> {
    // Auth goes through Bot-Service
    return apiFetch<MeResponse>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function changePassword(data: {
    current_password: string;
    new_password: string;
}): Promise<{ success: boolean }> {
    // Auth goes through Bot-Service (field names: oldPassword, newPassword)
    return apiFetch<{ success: boolean }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
            oldPassword: data.current_password,
            newPassword: data.new_password,
        }),
    });
}

export async function getBotHealth(): Promise<{ status: string }> {
    return wawiFetch<{ status: string }>('/api/bot/health/');
}

export async function getMerchantSettings(): Promise<MerchantSettings> {
    return wawiFetch<MerchantSettings>('/api/dashboard/merchant/settings/');
}

export async function updateMerchantSettings(settings: Partial<MerchantSettings>): Promise<{ ok: boolean }> {
    return wawiFetch<{ ok: boolean }>('/api/dashboard/merchant/settings/', {
        method: 'POST',
        body: JSON.stringify(settings),
    });
}
export async function getAdminStats(): Promise<AdminStats> {
    return wawiFetch<AdminStats>('/api/admin-stats/');
}

export async function listActiveDevices(tenantId: number): Promise<ActiveDevice[]> {
    return wawiFetchList<ActiveDevice>(`/api/tenants/${tenantId}/devices/`);
}

export async function removeActiveDevice(tenantId: number, deviceId: string): Promise<void> {
    return wawiFetch(`/api/tenants/${tenantId}/remove-device/`, {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
    });
}

export async function updateTenantLimits(tenantId: number, limits: { max_users: number, max_devices: number }): Promise<void> {
    return wawiFetch(`/api/tenants/${tenantId}/`, {
        method: 'PATCH',
        body: JSON.stringify(limits),
    });
}

export async function createTenantUser(tenantId: number, userData: any): Promise<void> {
    return wawiFetch(`/api/tenants/${tenantId}/users/`, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function getTeam(): Promise<any[]> {
    // Auth goes through Bot-Service
    const data = await apiFetch<any[]>('/api/auth/team/');
    return Array.isArray(data) ? data : [];
}

export interface BillingSettings {
    company_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    postal_code: string;
    country: string;
    tax_id: string;
    iban: string;
    email: string;
    phone: string;
    invoice_template: string;
    invoice_color: string;
    invoice_font: string;
    logo_position: string;
    number_position: string;
    address_layout: string;
    table_style: string;
    accent_color: string;
    logo_base64?: string; // NEW: Logo as Base64 string
}

export async function getBillingSettings(): Promise<BillingSettings> {
    return wawiFetch<BillingSettings>('/api/billing/settings/');
}

export async function updateBillingSettings(settings: Partial<BillingSettings>): Promise<void> {
    await wawiFetch('/api/billing/settings/', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
}

// Order-to-Invoice Conversion Functions
export async function createInvoiceFromOrder(orderId: string): Promise<any> {
    return wawiFetch(`/api/orders/${orderId}/create-invoice/`, {
        method: 'POST',
    });
}

export async function bulkCreateInvoicesFromOrders(orderIds: string[]): Promise<{
    success: any[];
    failed: { orderId: string; error: string }[];
}> {
    return wawiFetch('/api/billing/invoices/bulk-create/', {
        method: 'POST',
        body: JSON.stringify({ orderIds }),
    });
}

export async function getInvoiceByOrderId(orderId: string): Promise<any | null> {
    try {
        return await wawiFetchList(`/api/billing/invoices/?order=${orderId}`);
    } catch (error) {
        console.error('Error fetching invoice by order:', error);
        return null;
    }
}
