import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';
import Button from '../ui/Button';
import { getFriendlyApiErrorMessage } from '../lib/apiErrorMessage';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

const SuppliersPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/dashboard/suppliers');
      const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setRows(rows);
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
    row?.supplierName ??
    row?.supplier_name ??
    row?.company ??
    row?.title ??
    row?.id ??
    'Lieferant';

  const getStatus = (row: any) => {
    const raw = String(row?.status ?? row?.state ?? row?.isActive ?? row?.active ?? '').toLowerCase();
    if (raw === 'true' || raw.includes('active') || raw.includes('connected') || raw.includes('ok')) return 'success';
    if (raw.includes('error') || raw.includes('failed') || raw.includes('inactive') || raw === 'false') return 'danger';
    return 'neutral';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Lieferanten"
        subtitle="Partnerdaten für externe Bestellung & Nachverfolgung."
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            Aktualisieren
          </Button>
        }
      />

      <Card title="Lieferantenliste" subtitle="Schnell suchen, Status prüfen, Details öffnen.">
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
            placeholder="Name, E-Mail, Notizen…"
            style={{ maxWidth: 420 }}
          />
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {rows.length} Lieferanten · {filtered.length} sichtbar
          </div>
        </div>

        {!loading && !error && filtered.length === 0 ? (
          <EmptyState
            title="Keine Lieferanten"
            description="Wenn du Lieferanten im Backend pflegst, erscheinen sie hier. Du kannst trotzdem schon Aufträge und Angebote bearbeiten."
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
                  <Badge variant={getStatus(row) as any}>{String(row?.status ?? '–')}</Badge>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {[row?.email, row?.phone, row?.country].filter(Boolean).join(' · ') || '—'}
                </div>
                {row?.notes ? (
                  <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.4 }}>
                    {String(row.notes).slice(0, 180)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default SuppliersPage;
