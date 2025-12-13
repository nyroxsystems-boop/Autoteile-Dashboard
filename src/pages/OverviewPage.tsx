import { useEffect, useMemo, useState } from 'react';
import { listOrders } from '../api/orders';
import { fetchOverviewStats, type OverviewStats } from '../api/stats';
import type { Order } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { fetchMerchantSettings, saveMerchantSettings, type MerchantSettings } from '../api/merchant';
import { defaultPriceProfiles, type PriceProfile } from '../features/settings/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import OrdersOverTimeChart from '../features/overview/components/OrdersOverTimeChart';
import AverageBasketChart from '../features/overview/components/AverageBasketChart';
import ConversionRateChart from '../features/overview/components/ConversionRateChart';

const OverviewPage = () => {
  const [timeRange, setTimeRange] = useState<'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr'>('Heute');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [defaultMargin, setDefaultMargin] = useState<number | null>(
    defaultPriceProfiles.find((p) => p.isDefault)?.margin
      ? defaultPriceProfiles.find((p) => p.isDefault)!.margin * 100
      : null
  );
  const [priceProfiles, setPriceProfiles] = useState<PriceProfile[]>(defaultPriceProfiles);
  const [marginInputs, setMarginInputs] = useState<Record<string, string>>(
    Object.fromEntries(defaultPriceProfiles.map((p) => [p.id, formatMarginValue(p.margin)]))
  );
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const auth = useAuth();

  // a small default list of known shops (can be replaced by a real backend list later)
  const KNOWN_SHOPS = [
    'Autodoc',
    'Stahlgruber',
    'Mister Auto',
    'ATP Autoteile',
    'Autoteile Teufel',
    'Leebmann24',
    'Fressnapf Auto',
    'kfzteile24',
    'Oscaro',
    'Motointegrator',
    'Autodoc Pro'
  ];
  const [shopSearch, setShopSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isStatsLoading = !stats && !error;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await fetchOverviewStats(timeRange);
        setStats(result);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Statistiken', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadStats();
  }, [timeRange]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await listOrders();
        setOrders(data);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Bestellungen', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadOrders();
  }, []);

  // load merchant settings when session is available
  useEffect(() => {
    const loadSettings = async () => {
      if (!auth?.session?.merchantId) return;
      try {
        const s = await fetchMerchantSettings(auth.session.merchantId);
        if (s) {
          setSelectedShops(s.selectedShops ?? []);
          setDefaultMargin(s.marginPercent ?? null);
          setShowSettings(false);
        }
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Merchant-Settings', err);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [auth?.session?.merchantId]);

  const oemIssuesCount = useMemo(
    () =>
      orders.filter(
        (o) => o?.part?.oemStatus === 'not_found' || o?.part?.oemStatus === 'multiple_matches'
      ).length,
    [orders]
  );

  const normalize = (value: string | number | null | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const buckets = useMemo(() => buildOrderBuckets(timeRange, orders), [timeRange, orders]);
  const ordersSeries = useMemo(() => buckets.map((b) => b.orders.length), [buckets]);
  const doneSeries = useMemo(
    () =>
      buckets.map((b) =>
        b.orders.filter((o) => {
          const s = String(o.status ?? '').toLowerCase();
          return s.includes('done') || s.includes('show_offers') || s.includes('complete');
        }).length
      ),
    [buckets]
  );
  const conversionSeries = useMemo(
    () =>
      buckets.map((_, idx) => {
        const done = doneSeries[idx] ?? 0;
        const total = (ordersSeries[idx] ?? 0) || 1;
        return Math.round((done / total) * 100);
      }),
    [doneSeries, ordersSeries]
  );

  const handleRangeChange = (value: 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr') => {
    setTimeRange(value);
  };

  const handleMarginChange = (value: string) => {
    const parsed = value === '' ? null : Number(value);
    console.log('[OverviewPage] Standard-Marge geändert:', parsed);
    setDefaultMargin(Number.isNaN(parsed) ? null : parsed);
  };

  const handleMarginSave = () => {
    console.log('[OverviewPage] Standard-Marge speichern angeklickt', defaultMargin);
    handleSaveSettings();
  };

  const handleToggleShop = (shop: string) => {
    setSelectedShops((prev) => (prev.includes(shop) ? prev.filter((s) => s !== shop) : [...prev, shop]));
  };

  const handleSaveSettings = async () => {
    if (!auth?.session?.merchantId) {
      setError('Bitte zuerst anmelden, um Einstellungen zu speichern.');
      return;
    }
    setIsSavingSettings(true);
    setError(null);
    try {
      await saveMerchantSettings(auth.session.merchantId, {
        selectedShops,
        marginPercent: defaultMargin ?? 0
      });
      // TODO: priceProfiles persistieren, sobald API dafür vorhanden ist
      setError(null);
      console.log('[OverviewPage] Merchant settings saved');
    } catch (err) {
      console.error('[OverviewPage] Fehler beim Speichern der Merchant-Settings', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Übersicht"
        subtitle="Schnellüberblick über Anfragen, Bestellungen und Marge."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={timeRange === 'Heute' ? 'primary' : 'secondary'}
              onClick={() => handleRangeChange('Heute')}
              size="sm"
            >
              Heute
            </Button>
            <Button
              variant={timeRange === 'Diese Woche' ? 'primary' : 'secondary'}
              onClick={() => handleRangeChange('Diese Woche')}
              size="sm"
            >
              Diese Woche
            </Button>
            <Button
              variant={timeRange === 'Dieser Monat' ? 'primary' : 'secondary'}
              onClick={() => handleRangeChange('Dieser Monat')}
              size="sm"
            >
              Dieser Monat
            </Button>
            <Button
              variant={timeRange === 'Dieses Jahr' ? 'primary' : 'secondary'}
              onClick={() => handleRangeChange('Dieses Jahr')}
              size="sm"
            >
              Dieses Jahr
            </Button>
          </div>
        }
      >
        {error ? (
          <div className="error-box">
            <strong>Fehler:</strong> {error}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          {isStatsLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx}>
                  <div className="skeleton-row" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="skeleton-block" style={{ height: 14 }} />
                    <div className="skeleton-block" style={{ height: 20, width: '60%' }} />
                    <div className="skeleton-block" style={{ height: 12, width: '80%' }} />
                  </div>
                </Card>
              ))
            : (
              <>
                <KpiCard
                  title="Offene Bestellungen (OEM)"
                  value={oemIssuesCount}
                  description="Bestellungen mit offener oder problematischer OEM-Ermittlung."
                />
                <KpiCard
                  title="Empfangene Nachrichten"
                  value={stats?.incomingMessages ?? '–'}
                  description="Eingehende WhatsApp-Nachrichten im Zeitraum."
                />
                <KpiCard
                  title="Abgebrochene Bestellungen"
                  value={stats?.abortedOrders ?? '–'}
                  description="Begonnene, aber nicht abgeschlossene Vorgänge."
                />
                <KpiCard
                  title="Ø Marge"
                  value={`${stats?.averageMargin ?? '–'}%`}
                  description="Mittelwert der angewendeten Marge pro Bestellung."
                />
              </>
            )}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14
        }}
      >
        <Card title="Bestellungen im Zeitraum" subtitle="Alle neu gestarteten Bestellungen im gewählten Zeitraum." padded>
          <OrdersOverTimeChart data={buckets.map((b, idx) => ({ date: b.label, value: ordersSeries[idx] ?? 0 }))} />
        </Card>
        <Card title="Ø Warenkorb" subtitle="Durchschnittlicher Endpreis pro Bestellung." padded>
          <AverageBasketChart data={buckets.map((b) => ({ date: b.label, value: normalize(stats?.averageBasket) || 0 }))} />
        </Card>
        <Card title="Konversionsrate" subtitle="Abschlussrate gegenüber gestarteten Anfragen." padded>
          <ConversionRateChart data={buckets.map((b, idx) => ({ date: b.label, value: conversionSeries[idx] ?? 0 }))} />
        </Card>
      </div>

      <Card
        title="Onboarding & Grundeinstellungen"
        subtitle="Shops auswählen und Standard-Marge festlegen."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: 'var(--muted)' }}>
              Einstellungen hinterlegt. Shops: {selectedShops.join(', ') || '–'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedShops.map((s) => (
                <Badge key={s} variant="neutral">
                  {s}{' '}
                  <button
                    onClick={() => handleToggleShop(s)}
                    style={{
                      marginLeft: 6,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer'
                    }}
                    aria-label={`${s} entfernen`}
                  >
                    ✕
                  </button>
                </Badge>
              ))}
              {selectedShops.length === 0 ? (
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Shops ausgewählt.</span>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder="Shop suchen oder hinzufügen…"
                style={{
                  flex: 1,
                  minWidth: 240,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)'
                }}
                list="shop-options"
              />
              <datalist id="shop-options">
                {KNOWN_SHOPS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const val = shopSearch.trim();
                  if (!val) return;
                  if (!selectedShops.includes(val)) setSelectedShops((prev) => [...prev, val]);
                  setShopSearch('');
                }}
              >
                Hinzufügen
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedShops([])}>
                Zurücksetzen
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>Preisprofile:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {priceProfiles.map((profile) => (
                <PriceProfilePill key={profile.id} profile={profile} />
              ))}
            </div>
          </div>

              <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700, marginTop: 6 }}>Preisprofile bearbeiten:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {priceProfiles.map((profile, idx) => (
                  <div
                    key={profile.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 12,
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>{profile.name}</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                          <input
                      type="radio"
                      name="defaultProfile"
                      checked={profile.isDefault === true}
                      onChange={() => {
                        setPriceProfiles((prev) =>
                          prev.map((p, pIdx) => ({
                            ...p,
                            isDefault: idx === pIdx
                          }))
                        );
                        setDefaultMargin(Math.round(profile.margin * 10000) / 100);
                      }}
                    />
                    Standard
                  </label>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{profile.description}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                        <Input
                          label="Marge (%)"
                          type="text"
                          inputMode="decimal"
                          value={marginInputs[profile.id] ?? ''}
                          placeholder="z.B. 28"
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = raw.replace(/^0+(?=\d)/, ''); // führende Nullen entfernen, aber einzelne 0 erlauben
                            setMarginInputs((prev) => ({ ...prev, [profile.id]: cleaned }));

                            if (cleaned === '') {
                              setPriceProfiles((prev) =>
                                prev.map((p, pIdx) => (pIdx === idx ? { ...p, margin: 0 } : p))
                              );
                              if (profile.isDefault) setDefaultMargin(null);
                              return;
                            }

                            const val = Number(cleaned);
                            if (Number.isNaN(val)) return;
                            const newMargin = val / 100;
                            setPriceProfiles((prev) =>
                              prev.map((p, pIdx) => (pIdx === idx ? { ...p, margin: newMargin } : p))
                            );
                            if (profile.isDefault) {
                              setDefaultMargin(val);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <Button variant="primary" onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? 'Speichert…' : 'Speichern'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPriceProfiles(defaultPriceProfiles);
                    const def = defaultPriceProfiles.find((p) => p.isDefault);
                    setDefaultMargin(def ? def.margin * 100 : null);
                    setMarginInputs(Object.fromEntries(defaultPriceProfiles.map((p) => [p.id, formatMarginValue(p.margin)])));
                  }}
                >
                  Zurücksetzen
                </Button>
              </div>
        </div>
      </Card>

      <Card title="Hinweise & Status">
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Empfangene Nachrichten heute: {stats?.incomingMessages ?? '–'}</li>
          <li>Abgebrochene Bestellungen heute: {stats?.abortedOrders ?? '–'}</li>
          <li>Bestellungen, die auf OEM-Klärung warten: {oemIssuesCount}</li>
        </ul>
      </Card>
    </div>
  );
};

type KpiCardProps = {
  title: string;
  value: string | number;
  description: string;
  trendLabel?: string;
};

const KpiCard = ({ title, value, description, trendLabel }: KpiCardProps) => {
  return (
    <Card
      className="kpi-card"
      padded
    >
      <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{description}</div>
      {trendLabel ? <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: 12 }}>{trendLabel}</div> : null}
    </Card>
  );
};

const PriceProfilePill = ({ profile }: { profile: PriceProfile }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: profile.isDefault ? '1px solid rgba(79,139,255,0.45)' : '1px solid var(--border)',
        boxShadow: profile.isDefault ? '0 6px 18px rgba(79,139,255,0.18)' : 'none',
        color: 'var(--text)',
        fontSize: 13,
        fontWeight: 700
      }}
    >
      <span>{profile.name}</span>
      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{Math.round(profile.margin * 100)} %</span>
      {profile.isDefault ? (
        <span
          style={{
            fontSize: 11,
            color: '#4f8bff',
            background: 'rgba(79,139,255,0.12)',
            borderRadius: 6,
            padding: '2px 6px',
            border: '1px solid rgba(79,139,255,0.35)'
          }}
        >
          Standard
        </span>
      ) : null}
    </div>
  );
};

type SeriesPoint = { label: string; value: number };

function formatMarginValue(margin: number | null | undefined): string {
  if (margin === null || margin === undefined) return '';
  const percent = Math.round(margin * 10000) / 100;
  return Number.isFinite(percent) ? String(percent) : '';
}
type OrderBucket = { label: string; orders: Order[] };

const buildOrderBuckets = (
  range: 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr',
  orders: Order[]
): OrderBucket[] => {
  const now = new Date();
  const getDate = (o: Order) => new Date((o as any)?.created_at ?? (o as any)?.createdAt ?? Date.now());

  if (range === 'Heute') {
    // 8 buckets à 3 Stunden
    return Array.from({ length: 8 }).map((_, idx) => {
      const start = new Date(now);
      start.setHours(idx * 3, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 3);
      const bucketOrders = orders.filter((o) => {
        const d = getDate(o);
        return d >= start && d < end;
      });
      return { label: `${start.getHours()}h`, orders: bucketOrders };
    });
  }

  if (range === 'Diese Woche') {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const bucketOrders = orders.filter((o) => {
        const od = getDate(o);
        return od >= d && od < next;
      });
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), orders: bucketOrders };
    });
  }

  if (range === 'Dieser Monat') {
    // 4 Wochen-Buckets
    return Array.from({ length: 4 }).map((_, idx) => {
      const start = new Date(now);
      start.setDate(1 + idx * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const bucketOrders = orders.filter((o) => {
        const od = getDate(o);
        return od >= start && od < end;
      });
      return { label: `${idx + 1}. Woche`, orders: bucketOrders };
    });
  }

  // Dieses Jahr: 12 Monats-Buckets
  return Array.from({ length: 12 }).map((_, idx) => {
    const start = new Date(now.getFullYear(), idx, 1);
    const end = new Date(now.getFullYear(), idx + 1, 1);
    const bucketOrders = orders.filter((o) => {
      const od = getDate(o);
      return od >= start && od < end;
    });
    return { label: start.toLocaleDateString(undefined, { month: 'short' }), orders: bucketOrders };
  });
};
export default OverviewPage;
