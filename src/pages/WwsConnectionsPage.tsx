import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';
import Button from '../ui/Button';
import { getFriendlyApiErrorMessage } from '../lib/apiErrorMessage';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

const WwsConnectionsPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/dashboard/wws-connections');
      const normalizedRows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setRows(normalizedRows);
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const hay = Object.values(row ?? {})
        .map((v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)))
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rows, search]);

  const getName = (row: any) =>
    row?.name ??
    row?.shopName ??
    row?.shop_name ??
    row?.provider ??
    row?.type ??
    row?.system ??
    row?.id ??
    'Integration';

  const getBaseUrl = (row: any) => row?.baseUrl ?? row?.base_url ?? row?.url ?? row?.host ?? null;

  const getStatusLabel = (row: any) => {
    if (row?.isActive === true || row?.active === true) return 'Verbunden';
    if (row?.isActive === false || row?.active === false) return 'Inaktiv';
    const raw = row?.status ?? row?.state ?? row?.connectionStatus ?? row?.connection_status ?? null;
    return raw ? String(raw) : 'Unbekannt';
  };

  const getStatusVariant = (row: any): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (row?.isActive === true || row?.active === true) return 'success';
    if (row?.isActive === false || row?.active === false) return 'neutral';
    const raw = String(row?.status ?? row?.state ?? row?.connectionStatus ?? row?.connection_status ?? '').toLowerCase();
    if (!raw) return 'neutral';
    if (raw.includes('ok') || raw.includes('connected') || raw.includes('active')) return 'success';
    if (raw.includes('pending') || raw.includes('setup') || raw.includes('sync')) return 'warning';
    if (raw.includes('error') || raw.includes('failed') || raw.includes('inactive') || raw.includes('disconnected')) return 'danger';
    return 'neutral';
  };

  const getMetaLine = (row: any) => {
    const type = row?.type ?? row?.provider ?? row?.system ?? null;
    const id = row?.id ?? null;
    const updated = row?.updated_at ?? row?.updatedAt ?? row?.lastSyncAt ?? row?.last_sync_at ?? null;
    const parts = [
      type ? `Typ: ${type}` : null,
      id ? `ID: ${id}` : null,
      updated ? `Update: ${formatDateTime(updated)}` : null
    ].filter(Boolean);
    return parts.join(' · ') || null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Integrationen"
        subtitle="Shop-/WWS-Verbindungen für Angebotssuche, Bestellung und Belege."
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            Aktualisieren
          </Button>
        }
      />

      <Card title="Verbindungen" subtitle="Status prüfen und bei Problemen erneut laden.">
        {loading ? <div className="skeleton-block" style={{ width: 120, height: 12 }} /> : null}
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="error-box">{error}</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Erneut laden
            </Button>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
          <Input
            label="Suchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Typ, URL…"
            style={{ maxWidth: 420 }}
          />
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {rows.length} Integrationen · {filtered.length} sichtbar
          </div>
        </div>

        {!loading && !error && filtered.length === 0 ? (
          <EmptyState
            title="Keine Integrationen"
            description="Wenn im Backend Shop-/WWS-Verbindungen angelegt sind, erscheinen sie hier. Für den Alltag reichen oft 1–2 aktive Shops."
          />
        ) : null}

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map((row, idx) => (
              <div
                key={row?.id ?? idx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 12,
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 900 }}>{getName(row)}</div>
                  <Badge variant={getStatusVariant(row)}>{getStatusLabel(row)}</Badge>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {getBaseUrl(row) ? (
                    <span style={{ wordBreak: 'break-all' }}>{String(getBaseUrl(row))}</span>
                  ) : (
                    '—'
                  )}
                </div>
                {getMetaLine(row) ? (
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{getMetaLine(row)}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default WwsConnectionsPage;

function formatDateTime(value: string | Date | undefined | null) {
  if (!value) return '–';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
