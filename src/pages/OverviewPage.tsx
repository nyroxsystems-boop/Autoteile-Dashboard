import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '../api/orders';
import type { Order } from '../api/types';
import BotHealthWidget from '../components/BotHealthWidget';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import PageHeader from '../ui/PageHeader';
import ShopBadge from '../ui/ShopBadge';
import StatusChip from '../ui/StatusChip';

const OverviewPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await listOrders();
        setOrders(data);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Bestellungen', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const counts = useMemo(() => {
    const open = orders.filter((o) => String(o.status ?? '').toLowerCase() !== 'done').length;
    const awaitingConfirmation = orders.filter((o) => String(o.status ?? '').toLowerCase() === 'show_offers').length;
    const needsOem = orders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      const oemStatus = (o.part?.oemStatus ?? null) as string | null;
      if (status === 'oem_lookup') return true;
      if (!oemStatus) return false;
      return ['pending', 'not_found', 'multiple_matches'].includes(oemStatus);
    }).length;
    const missingInvoice = orders.filter((o) => {
      const isDone = String(o.status ?? '').toLowerCase() === 'done';
      const invoiceNumber = (o as any)?.external_ref ?? (o as any)?.invoice_number ?? null;
      return isDone && !invoiceNumber;
    }).length;
    return { open, awaitingConfirmation, needsOem, missingInvoice };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const bDate = new Date((b as any)?.created_at ?? b.createdAt ?? 0).getTime();
        const aDate = new Date((a as any)?.created_at ?? a.createdAt ?? 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [orders]);

  const nextAction = (order: Order) => {
    const status = String(order.status ?? '').toLowerCase();
    if (status === 'collect_vehicle') return 'Fahrzeugdaten anfragen';
    if (status === 'collect_part') return 'Teiledaten anfragen';
    if (status === 'choose_language') return 'Sprache wählen';
    if (status === 'oem_lookup') return 'OEM prüfen';
    if (status === 'show_offers') return '3 Angebote senden';
    if (status === 'done') return 'Beleg prüfen';
    return 'Öffnen';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Heute"
        subtitle="WhatsApp-first Überblick: Was ist als Nächstes zu tun?"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button as={Link} to="/orders" variant="primary" size="sm">
              Aufträge öffnen
            </Button>
            <Button as={Link} to="/offers" variant="secondary" size="sm">
              Angebote ansehen
            </Button>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}
      >
        <ActionCard
          title="Offene Aufträge"
          value={loading ? '…' : counts.open}
          description="Neue oder laufende WhatsApp-Anfragen."
          actionLabel="Zu Aufträgen"
          to="/orders"
        />
        <ActionCard
          title="Warten auf Kunden-OK"
          value={loading ? '…' : counts.awaitingConfirmation}
          description="Angebote sind da – jetzt per WhatsApp senden & bestätigen lassen."
          actionLabel="Aufträge prüfen"
          to="/orders"
        />
        <ActionCard
          title="OEM prüfen"
          value={loading ? '…' : counts.needsOem}
          description="OEM fehlt oder ist unklar."
          actionLabel="Zu Aufträgen"
          to="/orders"
        />
        <ActionCard
          title="Fehlende Rechnung"
          value={loading ? '…' : counts.missingInvoice}
          description="Abgeschlossen, aber noch ohne Rechnungsnummer/Beleg."
          actionLabel="Zu Belegen"
          to="/documents"
        />
      </div>

      <BotHealthWidget />

      {error ? <div className="error-box">Fehler beim Laden: {error}</div> : null}

      <Card
        title="Aktuelle Aufträge"
        subtitle="Kurzliste · deine neuesten WhatsApp-Vorgänge"
        actions={
          <Button as={Link} to="/orders" variant="ghost" size="sm">
            Alle Aufträge
          </Button>
        }
      >
        {loading ? (
          <div className="skeleton-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="skeleton-block" style={{ height: 14, width: '40%' }} />
            <div className="skeleton-block" style={{ height: 14, width: '65%' }} />
            <div className="skeleton-block" style={{ height: 14, width: '55%' }} />
          </div>
        ) : null}

        {!loading && recentOrders.length === 0 ? (
          <EmptyState
            title="Noch keine Aufträge"
            description="Sobald eine WhatsApp-Anfrage eingeht, erscheint hier ein Auftrag."
            actionLabel="Zur Übersicht"
            onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        ) : null}

        {recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Kunde</th>
                  <th>Teil / OEM</th>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Nächster Schritt</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="table-row">
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Link to={`/orders/${o.id}`} style={{ fontWeight: 800 }}>
                          #{o.id}
                        </Link>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {formatDateTime(o.created_at ?? o.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div>{o.customerId ? `Kunde ${o.customerId}` : '—'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{o.customerPhone ?? '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontWeight: 700 }}>{o.part?.partCategory ?? '—'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {o.part?.oemNumber ? `OEM ${o.part.oemNumber}` : o.part?.partText ?? '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <ShopBadge shopName={o.order_data?.selectedOfferSummary?.shopName ?? null} />
                    </td>
                    <td>
                      <StatusChip status={String(o.status ?? '')} />
                    </td>
                    <td style={{ color: 'var(--text)' }}>{nextAction(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

const ActionCard = ({
  title,
  value,
  description,
  actionLabel,
  to
}: {
  title: string;
  value: string | number;
  description: string;
  actionLabel: string;
  to: string;
}) => {
  return (
    <Card padded>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-strong)' }}>{value}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{description}</div>
        <div style={{ marginTop: 'auto' }}>
          <Button as={Link} to={to} variant="secondary" size="sm">
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};

function formatDateTime(value: string | Date | undefined | null) {
  if (!value) return '–';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default OverviewPage;
