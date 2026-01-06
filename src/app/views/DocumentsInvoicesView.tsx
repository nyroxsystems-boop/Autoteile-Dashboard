// Belege & Rechnungen View - Integrated with Tax Module
// Uses tax module invoice service for complete tax management

import { useState, useEffect, useMemo } from 'react';
import {
  listInvoices,
  markInvoiceAsPaid,
  type Invoice
} from '../services/taxService';
import { Search, Filter, Plus, FileText, AlertTriangle, CheckCircle, FileEdit, TrendingUp, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentsInvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await listInvoices({ limit: 100 });
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesFilter = !activeFilter || inv.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [invoices, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    return {
      draft: invoices.filter(inv => inv.status === 'draft').length,
      issued: invoices.filter(inv => inv.status === 'issued').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      canceled: invoices.filter(inv => inv.status === 'canceled').length,
      totalPaidAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.gross_amount.toString()), 0),
    };
  }, [invoices]);

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Rechnung als bezahlt markieren?')) return;

    try {
      await markInvoiceAsPaid(id);
      await loadInvoices();
      toast.success('Rechnung als bezahlt markiert');
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      toast.error('Fehler beim Markieren als bezahlt');
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        Lade Rechnungen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">Belege & Rechnungen</h1>
          <p className="text-muted-foreground">
            Kaufmännische Dokumente verwalten und Rechnungen erstellen
          </p>
        </div>
        <button
          onClick={() => window.location.hash = '/tax/dashboard'}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Rechnung erstellen
        </button>
      </div>

      {/* Stats - Kompakt */}
      <div className="grid grid-cols-4 gap-6">
        {/* Entwürfe */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'draft' ? null : 'draft')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-slate-500/10 via-slate-400/5 to-transparent border hover:border-slate-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'draft' ? 'border-slate-500/60 ring-2 ring-slate-500/30 shadow-lg' : 'border-slate-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <FileEdit className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Entwürfe</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-slate-700 to-slate-600 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.draft}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Warte auf Versand
            </div>
          </div>
        </div>

        {/* Versendet/Ausgestellt */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'issued' ? null : 'issued')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent border hover:border-blue-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'issued' ? 'border-blue-500/60 ring-2 ring-blue-500/30 shadow-lg' : 'border-blue-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Download className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-600">Offen</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Versendet</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.issued}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Durchschnittlich 14 Tage
            </div>
          </div>
        </div>

        {/* Storniert */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'canceled' ? null : 'canceled')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border hover:border-red-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'canceled' ? 'border-red-500/60 ring-2 ring-red-500/30 shadow-lg' : 'border-red-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Storniert</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-red-600 to-red-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.canceled}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Ungültige Belege
            </div>
          </div>
        </div>

        {/* Bezahlt */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'paid' ? null : 'paid')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent border hover:border-green-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'paid' ? 'border-green-500/60 ring-2 ring-green-500/30 shadow-lg' : 'border-green-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-3 h-3 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Bezahlt</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.paid}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {formatCurrency(stats.totalPaidAmount)} Gesamt
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechnungsnummer oder Kunde suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={activeFilter || 'all'}
            onChange={(e) => setActiveFilter(e.target.value === 'all' ? null : e.target.value)}
            className="h-10 pl-10 pr-8 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="issued">Versendet</option>
            <option value="paid">Bezahlt</option>
            <option value="canceled">Storniert</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="font-medium text-foreground mb-1">Keine Dokumente gefunden</div>
          <div className="text-sm text-muted-foreground">
            {searchQuery ? 'Versuchen Sie es mit anderen Suchbegriffen' : 'Erstellen Sie Ihre erste Rechnung'}
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rechnungsnr.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{invoice.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-foreground">{invoice.customer_name || 'Unbekannt'}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatCurrency(invoice.gross_amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      Netto: {formatCurrency(invoice.net_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {invoice.status === 'draft' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        Entwurf
                      </span>
                    )}
                    {invoice.status === 'issued' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Versendet
                      </span>
                    )}
                    {invoice.status === 'paid' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Bezahlt
                      </span>
                    )}
                    {invoice.status === 'canceled' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Storniert
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {(invoice.status === 'draft' || invoice.status === 'issued') && (
                      <button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        Bezahlt markieren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Finanzamt Notice */}
      <div className="mt-8 p-5 rounded-xl border border-[var(--status-success-border)] bg-[var(--status-success-bg)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--status-success)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">Steuer-Modul aktiv</div>
            <div className="text-sm text-muted-foreground">
              Alle Rechnungen werden automatisch für die UStVA (Umsatzsteuervoranmeldung) erfasst.
              <button
                onClick={() => window.location.hash = '/tax/dashboard'}
                className="ml-2 text-primary hover:underline font-medium"
              >
                Zum Steuer-Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}