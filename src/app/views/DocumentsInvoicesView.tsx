// Unified Belege & Invoice Management View
// Comprehensive document hub with tabs for outgoing/incoming invoices and tax office section

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Check, X, Plus, Upload, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listInvoices, markInvoiceAsPaid, cancelInvoice, type Invoice, type InvoiceStatus } from '../services/taxService';
import InvoiceCreationModal from '../components/tax/InvoiceCreationModal';
import { toast } from 'sonner';

type TabType = 'all' | 'outgoing' | 'incoming' | 'tax-office';

export function DocumentsInvoicesView() {
  const navigate = useNavigate();
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
      console.log('[DocumentsInvoicesView] Invoice created event received, refreshing list...');
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
      toast.error('Fehler beim Laden der Belege');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markInvoiceAsPaid(id);
      toast.success('Rechnung als bezahlt markiert');
      loadInvoices();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Rechnung wirklich stornieren?')) return;

    try {
      await cancelInvoice(id);
      toast.success('Rechnung storniert');
      loadInvoices();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    // Tab filter (for future: add type field to distinguish incoming/outgoing)
    // if (activeTab === 'outgoing') return inv.type === 'outgoing';
    // if (activeTab === 'incoming') return inv.type === 'incoming';

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
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      canceled: 'bg-red-100 text-red-700',
    };

    const labels = {
      draft: 'Entwurf',
      issued: 'Versendet',
      paid: 'Bezahlt',
      canceled: 'Storniert',
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
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Finanzamt-Bereich</h3>
          <p className="text-gray-600 mb-6">
            UStVA-Export, Quartalsberichte und Zusammenfassende Meldungen
          </p>
          <button
            onClick={() => navigate('/bot/tax/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zum Steuer-Dashboard →
          </button>
        </div>
      );
    }


    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Lade Belege...</div>
        </div>
      );
    }

    if (filteredInvoices.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Belege gefunden</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Keine Ergebnisse für Ihre Suche' : 'Erstellen Sie Ihre erste Rechnung'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Rechnung erstellen
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftrag</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(invoice.issue_date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {invoice.customer_name || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {invoice.source_order_id ? (
                    <button
                      onClick={() => navigate('/bot/auftraege')}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      title="Zum Auftrag navigieren"
                    >
                      {invoice.source_order_id}
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
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
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Als bezahlt markieren"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {invoice.status !== 'canceled' && invoice.status !== 'paid' && (
                      <button
                        onClick={() => handleCancel(invoice.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Stornieren"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          // Use tenant.slug from auth session to match settings save
                          const authSession = localStorage.getItem('auth_session');
                          let tenantId = localStorage.getItem('selectedTenantId') || '';
                          if (authSession) {
                            try {
                              const session = JSON.parse(authSession);
                              tenantId = session.tenant?.slug || session.user?.merchant_id || tenantId;
                            } catch (e) { /* use fallback */ }
                          }
                          const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');
                          const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';
                          const url = `${apiBase}/api/invoices/${invoice.invoice_number}/pdf`;

                          const response = await fetch(url, {
                            headers: {
                              'X-Tenant-ID': tenantId || '',
                              'Authorization': `Token ${token}`
                            }
                          });

                          if (!response.ok) throw new Error('Failed to load PDF');

                          const blob = await response.blob();
                          const blobUrl = window.URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');

                          // Clean up after a delay
                          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
                        } catch (error) {
                          console.error('PDF preview failed:', error);
                          toast.error('PDF-Vorschau fehlgeschlagen');
                        }
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="PDF anzeigen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Use tenant.slug from auth session to match settings save
                          const authSession = localStorage.getItem('auth_session');
                          let tenantId = localStorage.getItem('selectedTenantId') || '';
                          if (authSession) {
                            try {
                              const session = JSON.parse(authSession);
                              tenantId = session.tenant?.slug || session.user?.merchant_id || tenantId;
                            } catch (e) { /* use fallback */ }
                          }
                          const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');
                          const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';
                          const url = `${apiBase}/api/invoices/${invoice.invoice_number}/pdf`;

                          const response = await fetch(url, {
                            headers: {
                              'X-Tenant-ID': tenantId || '',
                              'Authorization': `Token ${token}`
                            }
                          });

                          if (!response.ok) throw new Error('Failed to download PDF');

                          const blob = await response.blob();
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = `Rechnung-${invoice.invoice_number}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(downloadUrl);
                          toast.success('PDF wird heruntergeladen...');
                        } catch (error) {
                          console.error('PDF download failed:', error);
                          toast.error('PDF-Download fehlgeschlagen');
                        }
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                      title="PDF herunterladen"
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
        <h1 className="text-2xl font-bold text-gray-900">Belege & Rechnungen</h1>
        <div className="flex gap-2">
          {activeTab === 'incoming' ? (
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Upload className="w-4 h-4" />
              Beleg hochladen
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Neue Rechnung
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { id: 'all', label: 'Alle Belege', icon: FileText },
            { id: 'outgoing', label: 'Ausgangsrechnungen', icon: FileText },
            { id: 'incoming', label: 'Eingangsrechnungen', icon: Upload },
            { id: 'tax-office', label: 'Finanzamt', icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
              placeholder="Rechnungsnummer oder Kunde suchen..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwürfe</option>
            <option value="issued">Versendet</option>
            <option value="paid">Bezahlt</option>
            <option value="canceled">Storniert</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border rounded-lg shadow-sm">
        {renderTabContent()}
      </div>

      {/* Statistics Footer */}
      {activeTab !== 'tax-office' && filteredInvoices.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Gesamt', value: filteredInvoices.length, color: 'blue' },
            { label: 'Offen', value: filteredInvoices.filter(i => i.status === 'issued').length, color: 'yellow' },
            { label: 'Bezahlt', value: filteredInvoices.filter(i => i.status === 'paid').length, color: 'green' },
            { label: 'Summe', value: formatCurrency(filteredInvoices.reduce((sum, i) => sum + i.gross_amount, 0)), color: 'purple' },
          ].map((stat, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            </div>
          ))}
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