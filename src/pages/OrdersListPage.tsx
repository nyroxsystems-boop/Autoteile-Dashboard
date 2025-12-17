import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrders } from '../api/orders';
import type { Order } from '../api/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ShopBadge from '../ui/ShopBadge';
import StatusChip from '../ui/StatusChip';

const OrdersListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done' | 'failed'>('all');
  const navigate = useNavigate();

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (err) {
      console.error('[OrdersListPage] Fehler beim Laden der Aufträge', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (statusFilter === 'done') return String(o.status).includes('done');
        if (statusFilter === 'failed') return String(o.status).includes('fail') || String(o.status).includes('error');
        if (statusFilter === 'open')
          return ['collect_vehicle', 'collect_part', 'oem_lookup', 'choose_language', 'show_offers'].includes(
            String(o.status)
          );
        return true;
      })
      .filter((o) => {
        if (!term) return true;
        const customer = `${o.customerId ?? ''} ${o.customerPhone ?? ''}`.toLowerCase();
        const id = String(o.id ?? '').toLowerCase();
        const part = String(o.part?.partText ?? '').toLowerCase();
        const oem = String(o.part?.oemNumber ?? '').toLowerCase();
        const vehicle = `${o.vehicle?.make ?? ''} ${o.vehicle?.model ?? ''} ${o.vehicle?.vin ?? ''}`.toLowerCase();
        return customer.includes(term) || id.includes(term) || part.includes(term) || oem.includes(term) || vehicle.includes(term);
      });
  }, [orders, search, statusFilter]);

  const renderDate = (date?: string) => {
    if (!date) return '–';
    return new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const renderVehicle = (order: Order) => {
    const vehicle = order.vehicle ?? null;
    if (!vehicle) return '–';
    const ident = vehicle.vin || [vehicle.hsn, vehicle.tsn].filter(Boolean).join('/') || '–';
    return (
      <div style={styles.cellStack}>
        <div>
          {vehicle.make ?? '-'} {vehicle.model ?? ''}
        </div>
        <div style={styles.muted}>
          Bj. {vehicle.year ?? '-'} · Identifikation: {ident}
        </div>
      </div>
    );
  };

  const renderPart = (order: Order) => {
    const part = order.part ?? null;
    if (!part) return '–';
    return (
      <div style={styles.cellStack}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>{part.partCategory ?? '-'}</div>
          {part.oemNumber ? <span style={styles.oemChip}>OEM {part.oemNumber}</span> : null}
        </div>
        <div style={styles.muted}>{part.partText ?? '-'}</div>
      </div>
    );
  };

  const renderPrice = (order: Order) => {
    const value = order.totalPrice ?? order.total_price ?? null;
    if (value === null || value === undefined) return '–';
    return `€ ${value.toFixed(2)}`;
  };

  const renderShop = (order: Order) => {
    const shop = order.order_data?.selectedOfferSummary?.shopName ?? null;
    return <ShopBadge shopName={shop} />;
  };

  const renderNextAction = (order: Order) => {
    const status = String(order.status ?? '').toLowerCase();
    if (status === 'show_offers') return '3 Angebote senden → Kunden-OK';
    if (status === 'oem_lookup') return 'OEM prüfen / bestätigen';
    if (status === 'collect_vehicle') return 'Fahrzeugdaten vervollständigen';
    if (status === 'collect_part') return 'Teildaten vervollständigen';
    if (status === 'choose_language') return 'Sprache wählen';
    if (status === 'done') return 'Beleg prüfen / abschließen';
    return 'Öffnen';
  };

  const renderCustomer = (order: Order) => {
    return (
      <div style={styles.cellStack}>
        <div>Kunden-ID: {order.customerId ?? '-'}</div>
        <div style={styles.muted}>Telefon: {order.customerPhone ?? '-'}</div>
      </div>
    );
  };

  const handleRowNavigate = (orderId: string) => navigate(`/orders/${orderId}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Aufträge"
        subtitle="WhatsApp-Anfragen → OEM → Angebote → Kunden-OK → Auftrag"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'ghost'} onClick={() => setStatusFilter('all')}>
              Alle
            </Button>
            <Button size="sm" variant={statusFilter === 'open' ? 'primary' : 'ghost'} onClick={() => setStatusFilter('open')}>
              Offen
            </Button>
            <Button size="sm" variant={statusFilter === 'done' ? 'primary' : 'ghost'} onClick={() => setStatusFilter('done')}>
              Abgeschlossen
            </Button>
            <Button size="sm" variant={statusFilter === 'failed' ? 'primary' : 'ghost'} onClick={() => setStatusFilter('failed')}>
              Fehlgeschlagen
            </Button>
            {isLoading ? <span className="pill">Lädt…</span> : <span className="pill">{rows.length} sichtbar</span>}
          </div>
        }
      >
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="error-box" role="status" aria-live="polite">
              <strong>Fehler:</strong> {error}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => void loadOrders()} disabled={isLoading}>
              Erneut laden
            </Button>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
          <Input
            label="Suchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Auftrag, Kunde, OEM, Fahrzeug…"
            helperText="Filtert nach Auftrag-ID, Kunde, OEM oder Fahrzeug."
            style={{ maxWidth: 320 }}
          />
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Auftrag</th>
                <th>Kunde</th>
                <th>Fahrzeug</th>
                <th>Teil / OEM</th>
                <th>Shop</th>
                <th>Preis</th>
                <th>Status</th>
                <th>Nächster Schritt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={9}>
                        <div className="skeleton-row">
                          <div className="skeleton-block" />
                          <div className="skeleton-block" />
                          <div className="skeleton-block" />
                        </div>
                      </td>
                    </tr>
                  ))
                : null}

              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 14 }}>Es liegen noch keine Aufträge vor.</td>
                </tr>
              ) : null}

              {!isLoading &&
                rows.map((order) => (
                  <tr
                    key={order.id}
                    className="table-row table-row-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowNavigate(order.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowNavigate(order.id);
                      }
                    }}
                  >
                    <td>
                      <div style={styles.cellStack}>
                        <div style={{ fontWeight: 800 }}>#{order.id}</div>
                        <div style={styles.muted}>{renderDate(order.created_at ?? order.createdAt ?? undefined)}</div>
                      </div>
                    </td>
                    <td>{renderCustomer(order)}</td>
                    <td>{renderVehicle(order)}</td>
                    <td>
                      {renderPart(order)}
                    </td>
                    <td>{renderShop(order)}</td>
                    <td>{renderPrice(order)}</td>
                    <td>
                      <StatusChip status={String(order.status ?? '')} />
                    </td>
                    <td>{renderNextAction(order)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowNavigate(order.id);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrdersListPage;

const styles = {
  muted: { color: 'var(--muted)', fontSize: 13 },
  cellStack: { display: 'flex', flexDirection: 'column', gap: 4 },
  oemChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(79,139,255,0.12)',
    border: '1px solid rgba(79,139,255,0.35)',
    color: '#4f8bff',
    fontSize: 12,
    fontWeight: 800
  }
} as const;
