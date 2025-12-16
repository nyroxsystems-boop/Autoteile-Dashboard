import { apiClient } from './client';

export type InvoiceLine = {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total?: number;
};

export type Invoice = {
  id: number;
  invoice_number: string | null;
  status: string;
  order: number | null;
  contact: number | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  billing_address_json?: any;
  shipping_address_json?: any;
  lines?: InvoiceLine[];
  created_at?: string;
};

export const listInvoices = async (): Promise<Invoice[]> => {
  return apiClient.get<Invoice[]>('/api/invoices');
};

export const getInvoice = async (id: string | number): Promise<Invoice> => {
  return apiClient.get<Invoice>(`/api/invoices/${id}`);
};

export const createInvoice = async (payload: Partial<Invoice>): Promise<Invoice> => {
  return apiClient.post<Invoice>('/api/invoices', payload);
};

export const issueInvoice = async (id: string | number): Promise<Invoice> =>
  apiClient.post<Invoice>(`/api/invoices/${id}/issue`);

export const sendInvoice = async (id: string | number): Promise<Invoice> =>
  apiClient.post<Invoice>(`/api/invoices/${id}/send`);

export const markInvoicePaid = async (id: string | number): Promise<Invoice> =>
  apiClient.post<Invoice>(`/api/invoices/${id}/mark-paid`);

export const cancelInvoice = async (id: string | number): Promise<Invoice> =>
  apiClient.post<Invoice>(`/api/invoices/${id}/cancel`);

export const downloadInvoicePdf = async (id: string | number) => {
  const url = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/invoices/${id}/pdf`;
  window.open(url, '_blank');
};

export const createInvoiceFromOrder = async (orderId: string | number): Promise<Invoice> =>
  apiClient.post<Invoice>(`/api/orders/${orderId}/create-invoice`);
