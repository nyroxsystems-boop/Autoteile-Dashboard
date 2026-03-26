import { useState, useEffect, useCallback } from 'react';
import { History, Filter, Download, ChevronLeft, ChevronRight, Clock, User, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useI18n } from '../../i18n';
import { apiFetch } from '../api/client';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  merchantId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'part.created':    { label: 'Artikel erstellt', color: 'text-green-500', icon: '📦' },
  'part.updated':    { label: 'Artikel bearbeitet', color: 'text-blue-500', icon: '✏️' },
  'part.deleted':    { label: 'Artikel gelöscht', color: 'text-red-500', icon: '🗑️' },
  'stock.adjusted':  { label: 'Bestand angepasst', color: 'text-amber-500', icon: '📊' },
  'stock.movement':  { label: 'Lagerbewegung', color: 'text-purple-500', icon: '🔄' },
  'supplier.created': { label: 'Lieferant erstellt', color: 'text-green-500', icon: '🏢' },
  'supplier.updated': { label: 'Lieferant bearbeitet', color: 'text-blue-500', icon: '🏢' },
  'supplier.deleted': { label: 'Lieferant gelöscht', color: 'text-red-500', icon: '🏢' },
  'purchase_order.created': { label: 'Bestellung erstellt', color: 'text-green-500', icon: '📋' },
  'purchase_order.status_changed': { label: 'Bestellstatus geändert', color: 'text-blue-500', icon: '📋' },
  'invoice.created': { label: 'Rechnung erstellt', color: 'text-green-500', icon: '💰' },
  'invoice.cancelled': { label: 'Rechnung storniert', color: 'text-red-500', icon: '💰' },
  'order.created':   { label: 'Auftrag erstellt', color: 'text-green-500', icon: '📝' },
  'order.status_changed': { label: 'Auftragsstatus geändert', color: 'text-blue-500', icon: '📝' },
  'settings.updated': { label: 'Einstellungen geändert', color: 'text-gray-500', icon: '⚙️' },
  'user.role_changed': { label: 'Rolle geändert', color: 'text-purple-500', icon: '👤' },
  'inventory.started': { label: 'Inventur gestartet', color: 'text-blue-500', icon: '📋' },
  'inventory.finalized': { label: 'Inventur abgeschlossen', color: 'text-green-500', icon: '✅' },
};

export function AuditLogView() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ entityType: '', action: '' });
  const pageSize = 25;

  const loadAuditLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      if (filters.entityType) params.set('entity_type', filters.entityType);
      if (filters.action) params.set('action', filters.action);

      const data = await apiFetch<{ entries: AuditEntry[]; total: number }>(`/api/dashboard/audit-log?${params}`);
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadAuditLog(); }, [loadAuditLog]);

  const exportCSV = () => {
    const csv = [
      'Zeitpunkt,Aktion,Typ,ID,Benutzer,IP',
      ...entries.map(e => 
        `${e.timestamp},${e.action},${e.entityType},${e.entityId},${e.userId},${e.ip || ''}`
      ),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
           ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            {t('audit_log_title') !== 'audit_log_title' ? t('audit_log_title') : 'Audit-Trail'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Lückenlose Protokollierung aller Änderungen (GoBD-konform)
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> CSV Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm"
          value={filters.entityType}
          onChange={e => { setFilters(f => ({ ...f, entityType: e.target.value })); setPage(0); }}
        >
          <option value="">Alle Entitäten</option>
          <option value="part">Artikel</option>
          <option value="stock">Bestand</option>
          <option value="supplier">Lieferanten</option>
          <option value="purchase_order">Bestellungen</option>
          <option value="invoice">Rechnungen</option>
          <option value="order">Aufträge</option>
          <option value="inventory">Inventur</option>
          <option value="settings">Einstellungen</option>
        </select>
        <select
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm"
          value={filters.action}
          onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(0); }}
        >
          <option value="">Alle Aktionen</option>
          {Object.keys(ACTION_LABELS).map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{total} Einträge</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
              <th className="px-6 py-4"><Clock className="w-3 h-3 inline mr-1" /> Zeitpunkt</th>
              <th className="px-6 py-4">Aktion</th>
              <th className="px-6 py-4"><FileText className="w-3 h-3 inline mr-1" /> Entität</th>
              <th className="px-6 py-4"><User className="w-3 h-3 inline mr-1" /> Benutzer</th>
              <th className="px-6 py-4">Änderungen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Lade Audit-Trail...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Keine Einträge gefunden</td></tr>
            ) : entries.map(entry => {
              const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-gray-500', icon: '📄' };
              return (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground whitespace-nowrap">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{entry.entityType}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">#{entry.entityId?.substring(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {entry.userId?.substring(0, 12)}
                    {entry.ip && <span className="ml-2 text-xs opacity-50">({entry.ip})</span>}
                  </td>
                  <td className="px-6 py-4">
                    {entry.changes ? (
                      <div className="text-xs space-y-1">
                        {Object.entries(entry.changes).slice(0, 3).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="text-red-400 line-through">{JSON.stringify(val.before)?.substring(0, 20)}</span>
                            <span className="text-green-400">→ {JSON.stringify(val.after)?.substring(0, 20)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Seite {page + 1} von {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
