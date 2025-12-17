import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';
import Button from '../ui/Button';
import { getFriendlyApiErrorMessage } from '../lib/apiErrorMessage';
import type { ShopOffer } from '../api/types';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import ShopBadge from '../ui/ShopBadge';
import EmptyState from '../ui/EmptyState';

const OffersPage = () => {
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/dashboard/offers');
      const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setOffers(rows as ShopOffer[]);
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
    const rows = offers.slice();
    rows.sort((a, b) => {
      const aKey = `${a.orderId ?? ''}-${a.shopName ?? ''}`;
      const bKey = `${b.orderId ?? ''}-${b.shopName ?? ''}`;
      return aKey.localeCompare(bKey);
    });

    if (!term) return rows;
    return rows.filter((o) => {
      const hay = [
        o.orderId,
        o.shopName,
        o.brand,
        o.productName,
        o.oemNumber,
        o.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [offers, search]);

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '–';
    const v = Number(value);
    if (!Number.isFinite(v)) return '–';
    const percent = v <= 1 ? v * 100 : v;
    return `${Math.round(percent * 10) / 10}%`;
  };

  const formatMoney = (value: number | null | undefined, currency?: string | null) => {
    if (value === null || value === undefined) return '–';
    const v = Number(value);
    if (!Number.isFinite(v)) return '–';
    const cur = currency || 'EUR';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(v);
    } catch {
      return `${v.toFixed(2)} ${cur}`;
    }
  };

  const computeFinal = (offer: ShopOffer) => {
    if (offer.finalPrice !== null && offer.finalPrice !== undefined) return offer.finalPrice;
    const margin = offer.marginPercent;
    if (margin === null || margin === undefined) return offer.basePrice;
    const m = Number(margin);
    if (!Number.isFinite(m)) return offer.basePrice;
    const factor = m <= 1 ? 1 + m : 1 + m / 100;
    return offer.basePrice * factor;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Angebote"
        subtitle="Vergleiche Angebote und sende 3 passende Preise per WhatsApp."
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button as={Link} to="/settings/pricing" variant="secondary" size="sm">
              Preisprofile & Margen
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
              Aktualisieren
            </Button>
          </div>
        }
      />

      <Card title="Hinweis" subtitle="Kundenpreis = Basispreis + Marge">
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          Diese Liste ist shop-agnostisch. Nutze den <strong>Kundenpreis</strong> (inkl. Marge) für WhatsApp-Angebote.
        </div>
      </Card>

      <Card>
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
            placeholder="Auftrag, OEM, Shop, Marke…"
            style={{ maxWidth: 420 }}
          />
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {offers.length} Angebote · {filtered.length} sichtbar
          </div>
        </div>

        {!loading && !error && filtered.length === 0 ? (
          <EmptyState
            title="Keine Angebote gefunden"
            description="Sobald ein Auftrag Angebote hat, erscheinen sie hier. Tipp: erst OEM prüfen, dann Angebote generieren."
          />
        ) : null}

        {filtered.length > 0 ? (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Shop</th>
                  <th>Produkt</th>
                  <th>OEM</th>
                  <th>Basis</th>
                  <th>Marge</th>
                  <th>Kundenpreis</th>
                  <th>Lieferzeit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((offer) => (
                  <tr key={offer.id} className="table-row">
                    <td style={{ fontWeight: 800 }}>#{offer.orderId}</td>
                    <td>
                      <ShopBadge shopName={offer.shopName ?? null} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontWeight: 700 }}>
                          {[offer.brand, offer.productName].filter(Boolean).join(' · ') || '—'}
                        </div>
                        {offer.productUrl ? (
                          <a
                            href={offer.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'underline' }}
                          >
                            Produkt öffnen
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{offer.oemNumber ?? '—'}</td>
                    <td>{formatMoney(offer.basePrice, offer.currency)}</td>
                    <td>{formatPercent(offer.marginPercent)}</td>
                    <td style={{ fontWeight: 900 }}>{formatMoney(computeFinal(offer), offer.currency)}</td>
                    <td style={{ color: 'var(--muted)' }}>
                      {offer.deliveryTimeDays ? `${offer.deliveryTimeDays} Tage` : '—'}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{offer.status}</td>
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

export default OffersPage;
