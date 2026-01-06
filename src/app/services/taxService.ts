// Tax Service - API client for tax module
// Handles tax profiles, invoices, and period calculations

import { apiFetch } from '../api/client';

// Types
export type BusinessType = 'sole_trader' | 'company';
export type TaxMethod = 'IST' | 'SOLL';
export type PeriodType = 'monthly' | 'quarterly';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'canceled';
export type TaxCode = 'STANDARD' | 'REVERSE' | 'EU' | 'TAX_FREE';
export type TaxRate = 0 | 7 | 19;

export interface TaxProfile {
    id: string;
    tenant_id: string;
    business_type: BusinessType;
    tax_number?: string;
    vat_id?: string;
    tax_method: TaxMethod;
    small_business: boolean;
    period_type: PeriodType;
    created_at: string;
    updated_at: string;
}

export interface InvoiceLine {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: TaxRate;
    tax_code?: TaxCode;
    line_total?: number;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    issue_date: string;
    due_date?: string;
    paid_at?: string;
    customer_name?: string;
    billing_country: string;
    net_amount: number;
    vat_amount: number;
    gross_amount: number;
    status: InvoiceStatus;
    notes?: string;
    lines?: InvoiceLine[];
    created_at: string;
    updated_at: string;
}

export interface TaxPeriod {
    id: string;
    period_start: string;
    period_end: string;
    total_net: number;
    vat_19: number;
    vat_7: number;
    vat_0: number;
    tax_due: number;
    status: string;
}

export interface PeriodCalculation {
    period_start: string;
    period_end: string;
    invoices: Invoice[];
    totals: {
        standard_19: { net: number; vat: number; gross: number };
        reduced_7: { net: number; vat: number; gross: number };
        zero_rated: { net: number; vat: number; gross: number };
        reverse_charge: { net: number; vat: number; gross: number };
        eu_sales: { net: number; vat: number; gross: number };
    };
    tax_due: number;
}

// Tax Profile API
export async function getTaxProfile(): Promise<TaxProfile | null> {
    try {
        return await apiFetch<TaxProfile>('/api/tax/profile');
    } catch (error: any) {
        if (error.message?.includes('404')) {
            return null;
        }
        throw error;
    }
}

export async function updateTaxProfile(data: Partial<TaxProfile>): Promise<TaxProfile> {
    return apiFetch<TaxProfile>('/api/tax/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// Invoice API
export async function listInvoices(params?: {
    status?: InvoiceStatus;
    from_date?: string;
    to_date?: string;
    limit?: number;
}): Promise<Invoice[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.from_date) query.append('from_date', params.from_date);
    if (params?.to_date) query.append('to_date', params.to_date);
    if (params?.limit) query.append('limit', params.limit.toString());

    const url = `/api/invoices${query.toString() ? '?' + query.toString() : ''}`;
    return apiFetch<Invoice[]>(url);
}

export async function getInvoice(id: string): Promise<Invoice> {
    return apiFetch<Invoice>(`/api/invoices/${id}`);
}

export async function createInvoice(data: {
    issue_date: string;
    due_date?: string;
    customer_name?: string;
    billing_country?: string;
    notes?: string;
    lines: InvoiceLine[];
}): Promise<Invoice> {
    return apiFetch<Invoice>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    return apiFetch<Invoice>(`/api/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
    return apiFetch<Invoice>(`/api/invoices/${id}/pay`, {
        method: 'POST'
    });
}

export async function cancelInvoice(id: string): Promise<Invoice> {
    return apiFetch<Invoice>(`/api/invoices/${id}/cancel`, {
        method: 'POST'
    });
}

export async function deleteInvoice(id: string): Promise<void> {
    await apiFetch(`/api/invoices/${id}`, {
        method: 'DELETE'
    });
}

// Tax Period API
export async function listTaxPeriods(limit = 12): Promise<TaxPeriod[]> {
    return apiFetch<TaxPeriod[]>(`/api/tax/periods?limit=${limit}`);
}

export async function calculatePeriod(periodStart: string, periodEnd: string): Promise<PeriodCalculation> {
    return apiFetch<PeriodCalculation>('/api/tax/periods/calculate', {
        method: 'POST',
        body: JSON.stringify({ period_start: periodStart, period_end: periodEnd })
    });
}

export async function savePeriod(periodStart: string, periodEnd: string): Promise<TaxPeriod> {
    return apiFetch<TaxPeriod>('/api/tax/periods', {
        method: 'POST',
        body: JSON.stringify({ period_start: periodStart, period_end: periodEnd })
    });
}
