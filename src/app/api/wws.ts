/// <reference types="vite/client" />
import { apiFetch, ApiError, API_BASE_URL, getAuthToken, getTenantId, getDeviceId } from './client';

// ── Type Definitions ─────────────────────────────────────────────────────────

export interface Order {
    id: string;
    status: string;
    language?: string | null;
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
    customerId?: string | null;
    customerPhone?: string | null;

    vehicle?: {
        vin?: string | null;
        hsn?: string | null;
        tsn?: string | null;
        make?: string | null;
        model?: string | null;
        year?: number | null;
        engine?: string | null;
    } | null;

    part?: {
        partCategory?: string | null;
        position?: string | null;
        partText?: string | null;
        partDetails?: Record<string, any> | null;
        oemStatus?: "pending" | "success" | "not_found" | "multiple_matches" | null;
        oemNumber?: string | null;
    } | null;

    oem_number?: string | null;

    external_ref?: string;
    order_data?: Record<string, unknown>;
    contact?: { name: string; wa_id?: string };
    vehicle_json?: Record<string, unknown>;
    part_json?: Record<string, unknown>;
    oem?: string;
    generated_invoice_id?: string | null;
}

export interface Offer {
    id: string;
    orderId: string;
    shopName?: string;
    supplierName?: string;

    brand: string;
    productName: string;
    oemNumber?: string | null;
    sku?: string;

    basePrice: number;
    currency?: string;
    deliveryTimeDays?: number;

    status: string;
    tier?: string | null;
    meta_json?: Record<string, unknown>;

    product_name?: string;
    price?: string;
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
    apiKey: string;
    accountId?: string;
    status: 'connected' | 'error' | 'pending';
    lastSync?: string;
    createdAt?: string;
}

export interface MerchantSettings {
    merchantId: string;
    wholesalers: WholesalerConfig[];
    marginPercent: number;
    priceProfiles: Array<{ id: string | number; name: string; type: string; value: number; isDefault?: boolean }>;
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

// ── Helper: fetch array safely ────────────────────────────────────────────────
async function apiFetchList<T>(endpoint: string): Promise<T[]> {
    try {
        const data = await apiFetch<T[] | { results?: T[] }>(endpoint);
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            return data.results;
        }
        return [];
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
            console.debug(`[API] Endpoint not available: ${endpoint}`);
            return [];
        }
        throw err;
    }
}

async function apiFetchBlob(endpoint: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            ...(token ? { 'Authorization': `Token ${token}` } : {}),
        },
    });
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
    return res.blob();
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
    return apiFetchList<Order>('/api/dashboard/orders');
}

export async function getOrderMessages(orderId: string | number): Promise<Message[]> {
    return apiFetchList<Message>(`/api/dashboard/orders/${orderId}/messages`);
}

export async function sendMessage(orderId: string | number, content: string): Promise<Message> {
    return apiFetch<Message>(`/api/dashboard/orders/${orderId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

export async function getOrderOffers(orderId: string | number): Promise<Offer[]> {
    return apiFetchList<Offer>(`/api/dashboard/offers?orderId=${orderId}`);
}

export async function createOffer(orderId: string | number, offerData: Partial<Offer>): Promise<Offer> {
    return apiFetch<Offer>(`/api/dashboard/orders/${orderId}/offers`, {
        method: 'POST',
        body: JSON.stringify(offerData)
    });
}

export async function publishOffers(orderId: string | number, offerIds: (string | number)[]): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/dashboard/orders/${orderId}/publish-offers`, {
        method: 'POST',
        body: JSON.stringify({ offerIds }),
    });
}

export async function createInvoice(orderId: string | number): Promise<Invoice> {
    return apiFetch(`/api/invoices/from-order/${orderId}`, {
        method: 'POST',
    });
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function getInvoices(): Promise<Invoice[]> {
    return apiFetchList<Invoice>('/api/invoices');
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
    return apiFetchList<Supplier>('/api/dashboard/suppliers');
}

// ── Auth (Bot-Service) ────────────────────────────────────────────────────────

export async function login(credentials: { email?: string, username?: string, password?: string, tenant?: string }): Promise<{
    access: string;
    refresh?: string;
    user?: { id: string; email: string; username: string; role: string };
    tenant?: { id: number; name: string; slug: string } | null;
    expires_in?: number;
    jwt?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    };
}> {
    const device_id = getDeviceId();
    return apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ ...credentials, device_id }),
    });
}

export async function getMeTenants(): Promise<Array<{ id: number; tenant: number; tenant_name: string; role: string }>> {
    return apiFetchList<{ id: number; tenant: number; tenant_name: string; role: string }>('/api/auth/me/tenants');
}

export async function getCustomers(): Promise<Array<{ id: number; name: string; wa_id?: string }>> {
    return apiFetchList<{ id: number; name: string; wa_id?: string }>('/api/dashboard/customers');
}

export interface Conversation {
    id: number;
    contact?: { name: string; wa_id?: string };
    state_json?: { status?: string; last_text?: string; oem_list?: string[]; history?: Array<{ role: string; text: string }> };
    last_message_at?: string;
    created_at?: string;
}

export async function getConversations(): Promise<Conversation[]> {
    return apiFetchList<Conversation>('/api/dashboard/conversations');
}

export async function downloadInvoicePdf(id: number): Promise<void> {
    const blob = await apiFetchBlob(`/api/invoices/${id}/pdf`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ── Dashboard Summary ─────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>('/api/dashboard/stats');
}

export async function getMe(): Promise<MeResponse> {
    return apiFetch<MeResponse>('/api/auth/me');
}

export async function updateProfile(data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}): Promise<MeResponse> {
    return apiFetch<MeResponse>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function changePassword(data: {
    current_password: string;
    new_password: string;
}): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
            oldPassword: data.current_password,
            newPassword: data.new_password,
        }),
    });
}

export async function getBotHealth(): Promise<{ status: string }> {
    return apiFetch<{ status: string }>('/api/bot/health');
}

export async function getMerchantSettings(): Promise<MerchantSettings> {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant selected');
    return apiFetch<MerchantSettings>(`/api/dashboard/merchant/settings/${tenantId}`);
}

export async function updateMerchantSettings(settings: Partial<MerchantSettings>): Promise<{ ok: boolean }> {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant selected');
    return apiFetch<{ ok: boolean }>(`/api/dashboard/merchant/settings/${tenantId}`, {
        method: 'POST',
        body: JSON.stringify(settings),
    });
}

export async function getAdminStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>('/api/admin/stats');
}

export async function listActiveDevices(tenantId: number): Promise<ActiveDevice[]> {
    return apiFetchList<ActiveDevice>(`/api/admin/tenants/${tenantId}/devices`);
}

export async function removeActiveDevice(tenantId: number, deviceId: string): Promise<void> {
    return apiFetch(`/api/admin/tenants/${tenantId}/remove-device`, {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
    });
}

export async function updateTenantLimits(tenantId: number, limits: { max_users: number, max_devices: number }): Promise<void> {
    return apiFetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify(limits),
    });
}

export async function createTenantUser(tenantId: number, userData: { username: string; email: string; password: string; role?: string }): Promise<void> {
    return apiFetch(`/api/admin/tenants/${tenantId}/users`, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function getTeam(): Promise<Array<{ id: number; username: string; email: string; role: string; joined: string; first_name?: string; last_name?: string; is_active?: boolean }>> {
    return apiFetchList<{ id: number; username: string; email: string; role: string; joined: string; first_name?: string; last_name?: string; is_active?: boolean }>('/api/auth/team/');
}

export async function inviteTeamMember(data: { email: string; role: string }): Promise<void> {
    await apiFetch('/api/auth/team/invite', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTeamMember(memberId: number | string, data: { role?: string }): Promise<void> {
    await apiFetch(`/api/auth/team/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function removeTeamMember(memberId: number | string): Promise<void> {
    await apiFetch(`/api/auth/team/${memberId}`, {
        method: 'DELETE',
    });
}

// ── Billing Settings ──────────────────────────────────────────────────────────

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
    logo_base64?: string;
}

export async function getBillingSettings(): Promise<BillingSettings> {
    return apiFetch<BillingSettings>('/api/invoices/settings/billing');
}

export async function updateBillingSettings(settings: Partial<BillingSettings>): Promise<void> {
    await apiFetch('/api/invoices/settings/billing', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
}

// ── Order-to-Invoice ──────────────────────────────────────────────────────────

export async function createInvoiceFromOrder(orderId: string): Promise<Invoice> {
    return apiFetch<Invoice>(`/api/invoices/from-order/${orderId}`, {
        method: 'POST',
    });
}

export async function bulkCreateInvoicesFromOrders(orderIds: string[]): Promise<{
    success: Invoice[];
    failed: { orderId: string; error: string }[];
}> {
    return apiFetch('/api/invoices/bulk-from-orders', {
        method: 'POST',
        body: JSON.stringify({ orderIds }),
    });
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice[] | null> {
    try {
        return await apiFetchList(`/api/invoices/by-order/${orderId}`);
    } catch (error) {
        console.error('Error fetching invoice by order:', error);
        return null;
    }
}

// ── OEM Register & Seeder ────────────────────────────────────────────────────

export interface OemDbStats {
    totalRecords: number;
    brands: Record<string, number>;
    categories: Record<string, number>;
    seederAvailableVehicles: number;
    seederAvailableParts: number;
    seederTotalCombinations: number;
}

export interface OemRecord {
    oem: string;
    confidence: number;
    source: string;
    description: string;
    supersededBy?: string;
}

export interface SeederStatus {
    running: boolean;
    startedAt: string | null;
    elapsed: number;
    etaSeconds: number;
    currentVehicle: string | null;
    currentPart: string | null;
    brandFilter: string | null;
    completed: number;
    total: number;
    found: number;
    skipped: number;
    failed: number;
}

export interface OemVehiclesData {
    brands: string[];
    vehiclesByBrand: Record<string, Array<{ model: string; modelCode: string; yearFrom: number; yearTo: number }>>;
    parts: Array<{ category: string; description: string }>;
}

export async function getOemDbStats(): Promise<OemDbStats> {
    return apiFetch<OemDbStats>('/api/oem/db/stats');
}

export async function getOemRecords(params: { page?: number; limit?: number; brand?: string; category?: string; search?: string } = {}): Promise<{ records: OemRecord[]; total: number }> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.brand) qs.set('brand', params.brand);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    return apiFetch(`/api/oem/db/records?${qs.toString()}`);
}

export async function getOemVehicles(): Promise<OemVehiclesData> {
    return apiFetch<OemVehiclesData>('/api/oem/vehicles');
}

export async function startSeeder(params: { brand?: string; partCategory?: string } = {}): Promise<{ success: boolean; message: string; total: number }> {
    return apiFetch('/api/oem/seeder/start', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function getSeederStatus(): Promise<SeederStatus> {
    return apiFetch<SeederStatus>('/api/oem/seeder/status');
}

export async function stopSeeder(): Promise<{ success: boolean; message: string }> {
    return apiFetch('/api/oem/seeder/stop', { method: 'POST' });
}

export async function resolveSingleOem(params: { brand: string; model: string; partDescription: string }): Promise<{
    success: boolean;
    source?: string;
    oem?: string;
    confidence?: number;
    message?: string;
}> {
    return apiFetch('/api/oem/resolve-single', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}
