import { useEffect, useMemo, useState } from 'react';
import { listOrders } from '../api/orders';
import { fetchOverviewStats, type OverviewStats } from '../api/stats';
import type { Order } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { fetchMerchantSettings, saveMerchantSettings, type MerchantSettings } from '../api/merchant';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';

const OverviewPage = () => {
  const [timeRange, setTimeRange] = useState<'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr'>('Heute');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [defaultMargin, setDefaultMargin] = useState<number | null>(null);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [step, setStep] = useState<number>(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const auth = useAuth();

  // a small default list of known shops (can be replaced by a real backend list later)
  const KNOWN_SHOPS = ['Autodoc', 'Stahlgruber', 'Mister Auto'];
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

  const orderSeries = useMemo(() => buildOrderSeries(timeRange, orders), [timeRange, orders]);
  const baseSeriesValues = useMemo(() => orderSeries.map((p) => p.value), [orderSeries]);
  const deriveSeries = (multiplier: number, jitter = 0) => {
    const base = baseSeriesValues.length ? baseSeriesValues : [normalize(stats?.ordersInPeriod)];
    return base.map((v, idx) => {
      const noise = jitter ? ((idx % 2 === 0 ? 1 : -1) * jitter * (idx + 1)) : 0;
      return Math.max(0, v * multiplier + noise);
    });
  };

  const handleRangeChange = (value: 'Heute' | 'Diese Woche' | 'Dieser Monat') => {
    console.log('[OverviewPage] Zeitraum geändert:', value);
    setTimeRange(value);
  };

  const handleMarginChange = (value: string) => {
    const parsed = value === '' ? null : Number(value);
    console.log('[OverviewPage] Standard-Marge geändert:', parsed);
    setDefaultMargin(Number.isNaN(parsed) ? null : parsed);
  };

  const handleMarginSave = () => {
    // legacy single-field save (keeps behavior but delegates to stepper save below)
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
      setError(null);
      setStep(0);
      setShowSettings(false);
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
                  title="Bestellungen im Zeitraum"
                  value={stats?.ordersInPeriod ?? '–'}
                  description="Alle neu gestarteten Bestellungen im gewählten Zeitraum."
                  accent="#2563eb"
                  series={deriveSeries(1)}
                />
                <KpiCard
                  title="Offene Bestellungen (OEM)"
                  value={oemIssuesCount}
                  description="Bestellungen mit offener oder problematischer OEM-Ermittlung."
                  accent="#f97316"
                  series={deriveSeries(0.4, 0.2)}
                />
                <KpiCard
                  title="Empfangene Nachrichten"
                  value={stats?.incomingMessages ?? '–'}
                  description="Eingehende WhatsApp-Nachrichten im Zeitraum."
                  accent="#22c55e"
                  series={deriveSeries(1.2, 0.3)}
                />
                <KpiCard
                  title="Abgebrochene Bestellungen"
                  value={stats?.abortedOrders ?? '–'}
                  description="Begonnene, aber nicht abgeschlossene Vorgänge."
                  accent="#f97316"
                  series={deriveSeries(0.25, 0.15)}
                />
                <KpiCard
                  title="Konversionsrate"
                  value={`${stats?.conversionRate ?? '–'}%`}
                  description="Abschlussrate gegenüber gestarteten Anfragen."
                  accent="#a855f7"
                  series={deriveSeries(0.6, 0.1)}
                />
                <KpiCard
                  title="Ø Marge"
                  value={`${stats?.averageMargin ?? '–'}%`}
                  description="Mittelwert der angewendeten Marge pro Bestellung."
                  accent="#3b82f6"
                  series={deriveSeries(0.5, 0.05)}
                />
                <KpiCard
                  title="Ø Warenkorb"
                  value={stats?.averageBasket ? `€ ${stats.averageBasket}` : '–'}
                  description="Durchschnittlicher Endpreis pro Bestellung."
                  accent="#10b981"
                  series={deriveSeries(0.8, 0.1)}
                />
              </>
            )}
        </div>
      </Card>

      <Card
        title="Onboarding & Grundeinstellungen"
        subtitle="Shops auswählen und Standard-Marge festlegen."
      >
        {!showSettings && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ color: 'var(--muted)' }}>
              Einstellungen hinterlegt. Shops: {selectedShops.join(', ') || '–'} · Standard-Marge: {defaultMargin ?? '–'}%
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowSettings(true)}>
              Einstellungen bearbeiten
            </Button>
          </div>
        )}
        {showSettings && (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Badge variant={step === 0 ? 'success' : 'neutral'}>Schritt 1</Badge>
              <Badge variant={step === 1 ? 'success' : 'neutral'}>Schritt 2</Badge>
            </div>
            {step === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: 'var(--muted)' }}>Wähle die Shops aus, die bei der Angebotssuche berücksichtigt werden sollen.</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {KNOWN_SHOPS.map((s) => (
                    <label key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                      <input type="checkbox" checked={selectedShops.includes(s)} onChange={() => handleToggleShop(s)} />
                      <div style={{ fontWeight: 700 }}>{s}</div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" onClick={() => setStep(1)} disabled={selectedShops.length === 0}>
                    Weiter
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedShops([])}>
                    Zurücksetzen
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: 'var(--muted)' }}>Diese Marge wird prozentual auf den Teilepreis aufgeschlagen.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 200px)', gap: 12 }}>
                  <Input
                    label="Standard-Marge (%)"
                    type="number"
                    value={defaultMargin ?? ''}
                    placeholder="z.B. 20"
                    onChange={(e) => handleMarginChange(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Speichert…' : 'Speichern & Abschließen'}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    Zurück
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
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
  accent?: string;
  series?: number[];
};

const KpiCard = ({ title, value, description, accent = '#3b82f6', series }: KpiCardProps) => {
  const numericSeed = toNumberish(value ?? 0);
  const sparkId = `${title.replace(/\s+/g, '-').toLowerCase()}-spark`;
  const points = series && series.length ? normalizeSeries(series) : createSparkPoints(numericSeed);
  const { linePath, areaPath } = buildSparkPaths(points, 180, 70);

  return (
    <Card
      className="kpi-card"
      padded
    >
      <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{description}</div>
      <div
        style={{
          marginTop: 10,
          padding: '8px 6px 4px 6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid var(--border)'
        }}
      >
        <svg width="100%" height="70" viewBox="0 0 180 70" preserveAspectRatio="none" role="img" aria-label={`${title} Trend`}>
          <defs>
            <linearGradient id={`${sparkId}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id={`${sparkId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${sparkId}-fill)`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${sparkId}-stroke)`}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Card>
  );
};

type SeriesPoint = { label: string; value: number };

const toNumberish = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

const createSparkPoints = (seed: number, length = 8): number[] => {
  let x = Math.max(1, Math.abs(Math.floor(seed * 97)) % 9973);
  const pts: number[] = [];
  for (let i = 0; i < length; i++) {
    x = (x * 16807) % 2147483647;
    const v = (x % 1000) / 1000;
    pts.push(0.35 + v * 0.55); // range ~0.35-0.9
  }
  return pts;
};

const buildSparkPaths = (points: number[], width: number, height: number) => {
  if (!points.length) return { linePath: '', areaPath: '' };
  const step = width / Math.max(1, points.length - 1);
  const scaleY = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    return height - clamped * (height - 8); // leave small padding top/bottom
  };
  const coords = points.map((p, idx) => [idx * step, scaleY(p)] as const);
  const linePath = coords.reduce(
    (acc, [x, y], idx) => (idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`),
    ''
  );
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  return { linePath, areaPath };
};

const normalizeSeries = (values: number[]) => {
  const max = Math.max(1, ...values);
  if (!values.length) return [];
  return values.map((v) => Math.max(0.05, Math.min(0.95, v / max)));
};

const buildOrderSeries = (
  range: 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr',
  orders: Order[]
): SeriesPoint[] => {
  const now = new Date();
  const getDate = (o: Order) => new Date((o as any)?.created_at ?? (o as any)?.createdAt ?? Date.now());

  if (range === 'Heute') {
    // 8 buckets à 3 Stunden
    const buckets = Array.from({ length: 8 }).map((_, idx) => {
      const start = new Date(now);
      start.setHours(idx * 3, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 3);
      const value = orders.filter((o) => {
        const d = getDate(o);
        return d >= start && d < end;
      }).length;
      return { label: `${start.getHours()}h`, value };
    });
    return buckets;
  }

  if (range === 'Diese Woche') {
    const buckets = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const value = orders.filter((o) => {
        const od = getDate(o);
        return od >= d && od < next;
      }).length;
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), value };
    });
    return buckets;
  }

  if (range === 'Dieser Monat') {
    // 4 Wochen-Buckets
    const buckets = Array.from({ length: 4 }).map((_, idx) => {
      const start = new Date(now);
      start.setDate(1 + idx * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const value = orders.filter((o) => {
        const od = getDate(o);
        return od >= start && od < end;
      }).length;
      return { label: `${idx + 1}. Woche`, value };
    });
    return buckets;
  }

  // Dieses Jahr: 12 Monats-Buckets
  const buckets = Array.from({ length: 12 }).map((_, idx) => {
    const start = new Date(now.getFullYear(), idx, 1);
    const end = new Date(now.getFullYear(), idx + 1, 1);
    const value = orders.filter((o) => {
      const od = getDate(o);
      return od >= start && od < end;
    }).length;
    return { label: start.toLocaleDateString(undefined, { month: 'short' }), value };
  });
  return buckets;
};
export default OverviewPage;
