// Unified Belege & Invoice Management View
// Comprehensive document hub with tabs for outgoing/incoming invoices and tax office section

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Check, X, Plus, Upload, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listInvoices, markInvoiceAsPaid, cancelInvoice, type Invoice, type InvoiceStatus } from '../services/taxService';
import InvoiceCreationModal from '../components/tax/InvoiceCreationModal';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { openBlobPreview } from '../utils/desktop';
import { API_BASE_URL, getAuthToken, getTenantId } from '../api/client';

async function fetchInvoicePdf(invoiceNumber: string): Promise<Blob> {
  const tenantId = getTenantId() || '';
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceNumber}/pdf`, {
    headers: {
      ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
      ...(token ? { 'Authorization': `Token ${token}` } : {}),
    },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('PDF fetch failed');
  return response.blob();
}

type TabType = 'all' | 'outgoing' | 'incoming' | 'tax-office';

export function DocumentsInvoicesView() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInvoices();

    // Listen for invoice creation events from other views
    const handleInvoiceCreated = () => {
      // Invoice created event received, refresh list
      loadInvoices();
    };

    window.addEventListener('invoiceCreated', handleInvoiceCreated as EventListener);

    return () => {
      window.removeEventListener('invoiceCreated', handleInvoiceCreated as EventListener);
    };
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await listInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markInvoiceAsPaid(id);
      toast.success(t('docs_marked_paid'));
      loadInvoices();
    } catch (error: unknown) {
      toast.error(t('error'));
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t('docs_cancel_confirm'))) return;

    try {
      await cancelInvoice(id);
      toast.success(t('docs_canceled'));
      loadInvoices();
    } catch (error: unknown) {
      toast.error(t('error'));
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    // Tab filter - all created invoices are outgoing (invoices TO customers)
    // Incoming invoices (from suppliers) would require a separate table/workflow
    if (activeTab === 'incoming') return false; // No incoming invoices yet
    // 'all' and 'outgoing' show all invoices

    // Status filter
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.customer_name?.toLowerCase().includes(query)
      );
    }

    return true;
  });


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles = {
      draft: 'bg-muted text-muted-foreground',
      issued: 'bg-primary/10 text-primary',
      paid: 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]',
      canceled: 'bg-destructive/10 text-destructive',
    };

    const labels: Record<InvoiceStatus, string> = {
      draft: t('docs_status_draft'),
      issued: t('docs_status_issued'),
      paid: t('docs_status_paid'),
      canceled: t('docs_status_canceled'),
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'tax-office') {
      return (
        <div className="p-8 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('docs_tax')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('docs_tax_desc')}
          </p>
          <button
            onClick={() => navigate('/bot/tax/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {t('docs_tax')} →
          </button>
        </div>
      );
    }

    // Incoming invoices - Coming Soon
    if (activeTab === 'incoming') {
      return (
        <div className="p-8 text-center">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('docs_incoming')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('docs_incoming_desc')}
          </p>
          <span className="inline-block px-4 py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-sm font-medium">
            🚧 {t('coming_soon')}
          </span>
        </div>
      );
    }


    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t('docs_loading')}</div>
        </div>
      );
    }

    if (filteredInvoices.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('docs_no_invoices')}</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? t('docs_no_results') : t('docs_create_first')}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {t('orders_create_invoice')}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('docs_invoice_number')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('docs_date')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('docs_customer')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('orders_title')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('docs_amount')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('orders_status')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('docs_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {invoice.invoice_number}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(invoice.issue_date)}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {invoice.customer_name || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {invoice.source_order_id ? (
                    <button
                      onClick={() => navigate('/bot/auftraege')}
                      className="text-primary hover:text-primary/80 hover:underline font-medium"
                      title={t('orders_title')}
                    >
                      {invoice.source_order_id}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">
                  {formatCurrency(invoice.gross_amount)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.status === 'issued' && (
                      <button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        className="p-1.5 text-[var(--status-success)] hover:bg-[var(--status-success-bg)] rounded"
                        title={t('docs_mark_paid')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
                      <button
                        onClick={() => handleCancel(invoice.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                        title={t('cancel')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          const blob = await fetchInvoicePdf(invoice.invoice_number);
                          openBlobPreview(blob);
                        } catch (error) {
                          console.error('PDF preview failed:', error);
                          toast.error(t('error'));
                        }
                      }}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded"
                      title={t('docs_view_pdf')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const blob = await fetchInvoicePdf(invoice.invoice_number);
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = `Rechnung-${invoice.invoice_number}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(downloadUrl);
                          toast.success(t('docs_downloading'));
                        } catch (error) {
                          console.error('PDF download failed:', error);
                          toast.error(t('error'));
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:bg-muted rounded"
                      title={t('docs_download_pdf')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">{t('docs_title')}</h1>
        <div className="flex gap-2">
          {activeTab === 'incoming' ? (
            <button
              onClick={() => toast.info(t('coming_soon'))}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--status-success)] text-white rounded-lg hover:bg-[var(--status-success)]/90"
            >
              <Upload className="w-4 h-4" />
              {t('docs_incoming')}
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {t('docs_new_invoice')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {[
            { id: 'all', label: t('all'), icon: FileText },
            { id: 'outgoing', label: t('docs_outgoing'), icon: FileText },
            { id: 'tax-office', label: t('docs_tax'), icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      {activeTab !== 'tax-office' && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('docs_search_placeholder')}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
            className="px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">{t('all')}</option>
            <option value="draft">{t('docs_status_draft')}</option>
            <option value="issued">{t('docs_status_issued')}</option>
            <option value="paid">{t('docs_status_paid')}</option>
            <option value="canceled">{t('docs_status_canceled')}</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {renderTabContent()}
      </div>

      {/* Statistics Footer */}
      {activeTab !== 'tax-office' && filteredInvoices.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{t('all')}</div>
            <div className="text-2xl font-bold text-primary">{filteredInvoices.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{t('docs_status_issued')}</div>
            <div className="text-2xl font-bold text-amber-600">{filteredInvoices.filter(i => i.status === 'issued').length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{t('docs_status_paid')}</div>
            <div className="text-2xl font-bold text-[var(--status-success)]">{filteredInvoices.filter(i => i.status === 'paid').length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{t('docs_total')}</div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(filteredInvoices.reduce((sum, i) => sum + i.gross_amount, 0))}</div>
          </div>
        </div>
      )}

      {/* Invoice Creation Modal */}
      <InvoiceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadInvoices}
      />
    </div>
  );
}