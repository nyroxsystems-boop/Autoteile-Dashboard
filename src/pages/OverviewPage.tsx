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
  const [toast, setToast] = useState<string | null>(null);

  // PartsBot Empfehlungen
  type RecCategory = 'alle' | 'marge' | 'lager' | 'retouren' | 'service';
  type RecItem = {
    id: string;
    category: RecCategory;
    severity: 'high' | 'medium' | 'low';
    title: string;
    rationale: string;
    state?: 'vorgemerkt' | 'ignoriert' | 'spaeter';
  };
  const [recFilter, setRecFilter] = useState<RecCategory>('alle');
  const [recs, setRecs] = useState<RecItem[]>([
    { id: 'rec1', category: 'retouren', severity: 'high', title: 'Retouren-Cluster DHL Nord', rationale: 'Abbruchrate +18% bei Lieferzeit >3 Tage' },
    { id: 'rec2', category: 'marge', severity: 'medium', title: 'Marge anheben bei Bremsbelägen', rationale: 'Ø Marge 11% vs Ziel 18% (SKU-Set 2440)' },
    { id: 'rec3', category: 'lager', severity: 'high', title: 'Dead-Stock 90T+ abbauen', rationale: '12 SKUs > 90 Tage, Kapital 14.200 €' },
    { id: 'rec4', category: 'service', severity: 'low', title: 'Kompatibilitäts-Hinweise ergänzen', rationale: '20% Abbruchgrund: Kompatibilität unklar' },
    { id: 'rec5', category: 'marge', severity: 'medium', title: 'Bundle-Vorschlag Öl + Filter', rationale: 'Warenkorb +12%, Retouren -4%' },
    { id: 'rec6', category: 'retouren', severity: 'medium', title: 'Qualitätscheck Lieferant XY', rationale: 'Retourenquote 9% vs Schnitt 3%' },
    { id: 'rec7', category: 'lager', severity: 'low', title: 'Langlieger Rabatt B2B anbieten', rationale: 'Kapitalbindung 8.900 € in 6 SKUs' }
  ]);

  const filteredRecs = useMemo(() => {
    return recs.filter((r) => recFilter === 'alle' || r.category === recFilter).filter((r) => r.state !== 'ignoriert');
  }, [recs, recFilter]);

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
          if (s.priceProfiles && s.priceProfiles.length) {
            setPriceProfiles(s.priceProfiles);
            setMarginInputs(buildMarginInputs(s.priceProfiles));
          }
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
        marginPercent: defaultMargin ?? 0,
        priceProfiles
      });
      // TODO: priceProfiles persistieren, sobald API dafür vorhanden ist
      setError(null);
      console.log('[OverviewPage] Merchant settings saved');
      setToast('Einstellungen gespeichert (Demo)');
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

      {/* PartsBot Empfehlungen */}
      <Card
        title="PartsBot Empfehlungen"
        subtitle="Heute priorisiert – basierend auf Anfragen, Abbrüchen, Lager & Marge"
        actions={
          <select
            aria-label="Kategorie"
            className="topbar-select"
            value={recFilter}
            onChange={(e) => setRecFilter(e.target.value as any)}
            style={{ minWidth: 160 }}
          >
            <option value="alle">Kategorie: Alle</option>
            <option value="marge">Marge</option>
            <option value="lager">Lager</option>
            <option value="retouren">Retouren</option>
            <option value="service">Service</option>
          </select>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredRecs.map((rec, idx) => (
            <div
              key={rec.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 10,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background:
                      rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f59e0b' : '#22c55e'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800 }}>{rec.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {rec.rationale}{' '}
                    {rec.state === 'spaeter' ? <Badge variant="warning">Erinnerung: morgen (Demo)</Badge> : null}
                    {rec.state === 'vorgemerkt' ? <Badge variant="success">Vorgemerkt (Demo)</Badge> : null}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setRecs((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, state: 'vorgemerkt' } : r))
                    );
                    setToast('Aktion vorgemerkt (Demo)');
                  }}
                >
                  Anwenden
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // move to bottom, mark spaeter
                    setRecs((prev) => {
                      const item = { ...prev[idx], state: 'spaeter' };
                      const rest = prev.filter((_, i) => i !== idx);
                      return [...rest, item];
                    });
                  }}
                >
                  Später
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRecs((prev) => prev.map((r, i) => (i === idx ? { ...r, state: 'ignoriert' } : r)));
                  }}
                >
                  Ignorieren
                </Button>
              </div>
            </div>
          ))}
          {filteredRecs.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>Alle Empfehlungen sind verarbeitet.</div>
          ) : null}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
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
                  gap: 10,
                  minHeight: 260
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 800 }}>{profile.name}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                    <input
                      type="checkbox"
                      checked={profile.isDefault === true}
                      onChange={() => {
                        setPriceProfiles((prev) => {
                          const next = prev.map((p, pIdx) =>
                            pIdx === idx ? { ...p, isDefault: !p.isDefault } : p
                          );
                          const firstDefault = next.find((p) => p.isDefault);
                          setDefaultMargin(firstDefault ? Math.round(firstDefault.margin * 10000) / 100 : null);
                          return next;
                        });
                      }}
                    />
                    Standard
                  </label>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{profile.description}</div>
                <div style={{ marginTop: 'auto' }}>
                  <Input
                    label="Marge (%)"
                    type="text"
                    inputMode="decimal"
                    value={marginInputs[profile.id] ?? ''}
                    placeholder="z.B. 28"
                    style={{ height: 48, display: 'flex', alignItems: 'center', width: '100%' }}
                    onFocus={(e) => {
                      const len = e.target.value.length;
                      requestAnimationFrame(() => {
                        try {
                          e.target.setSelectionRange(len, len);
                        } catch {}
                      });
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setMarginInputs((prev) => ({ ...prev, [profile.id]: '' }));
                        setPriceProfiles((prev) =>
                          prev.map((p, pIdx) => (pIdx === idx ? { ...p, margin: 0 } : p))
                        );
                        if (profile.isDefault) setDefaultMargin(null);
                        return;
                      }
                      const cleaned = raw.replace(/^0+(?=\d)/, '');
                      setMarginInputs((prev) => ({ ...prev, [profile.id]: cleaned }));

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
            {!isSavingSettings ? (
              <span style={{ color: 'var(--muted)', fontSize: 12, alignSelf: 'center' }}>
                Änderungen speichern, um sie zu übernehmen.
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Retouren- & Abbruch-Forensik */}
      <Card title="Retouren- & Abbruch-Forensik" subtitle="Warum Geld verloren geht">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
          <KpiCard title="Vermeidbarer Umsatzverlust" value="14.800 €" description="geschätzt, letzte 30 Tage" />
          <KpiCard title="Haupttreiber" value="Lieferzeit & Kompatibilität" description="Top 2 Ursachen" />
          <KpiCard title="Betroffene SKUs" value="17" description="mit >10% Abbruch/Retouren" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Abbruch- & Retourenursachen</div>
          <CauseBarChart
            data={[
              { label: 'Lieferzeit zu lang', value: 38 },
              { label: 'Preis zu hoch', value: 22 },
              { label: 'Kompatibilität unklar', value: 31 },
              { label: 'Doppelbestellung', value: 12 },
              { label: 'Qualitätsmangel', value: 18 }
            ]}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Hotspots (SKU × Ursache)</div>
          <HotspotTable />
        </div>
      </Card>

      {/* Gebundenes Kapital Radar */}
      <Card
        title="Gebundenes Kapital Radar"
        subtitle="Slow Mover & Kapitalbindung – fokus auf Liquidität"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" /> Nur Risiko
            </label>
            <select className="topbar-select" style={{ minWidth: 130 }}>
              <option>30 Tage</option>
              <option>90 Tage</option>
              <option>180 Tage</option>
              <option>365 Tage</option>
            </select>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
          <KpiCard title="Im Lager gebunden" value="72.400 €" description="Warenwert aktuell" />
          <KpiCard title="Kurzfristig freisetzbar" value="18.600 €" description="30–60 Tage" />
          <KpiCard title="Dead Stock Kandidaten" value="9" description=">180 Tage" />
        </div>
        <CapitalTable />
      </Card>

      <Card title="Hinweise & Status">
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Empfangene Nachrichten heute: {stats?.incomingMessages ?? '–'}</li>
          <li>Abgebrochene Bestellungen heute: {stats?.abortedOrders ?? '–'}</li>
          <li>Bestellungen, die auf OEM-Klärung warten: {oemIssuesCount}</li>
        </ul>
      </Card>

      {toast ? (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
          {toast}
          <button
            onClick={() => setToast(null)}
            style={{ marginLeft: 10, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ) : null}
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

function buildMarginInputs(profiles: PriceProfile[]) {
  return Object.fromEntries(profiles.map((p) => [p.id, formatMarginValue(p.margin)]));
}

const CauseBarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 160, color: 'var(--muted)', fontSize: 13 }}>{d.label}</div>
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((d.value / max) * 100)}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #2563eb, #22c55e)'
              }}
            />
          </div>
          <div style={{ width: 40, textAlign: 'right', color: 'var(--muted)', fontSize: 13 }}>{d.value}%</div>
        </div>
      ))}
    </div>
  );
};

const hotspotData = [
  { sku: 'BREM-2440', cause: 'Lieferzeit zu lang', abbruch: '18%', retouren: '6%', marge: '14%', note: 'Express-Option anbieten' },
  { sku: 'FILTER-900', cause: 'Preis zu hoch', abbruch: '12%', retouren: '3%', marge: '22%', note: 'Bundle mit Öl filter' },
  { sku: 'RADLAGER-77', cause: 'Kompatibilität unklar', abbruch: '15%', retouren: '5%', marge: '19%', note: 'Kompatibilitätstext ergänzen' },
  { sku: 'BATT-AGM60', cause: 'Doppelbestellung', abbruch: '9%', retouren: '8%', marge: '11%', note: 'Warenkorb-Prüfung verstärken' },
  { sku: 'WISCH-SET2', cause: 'Qualitätsmangel', abbruch: '6%', retouren: '10%', marge: '24%', note: 'Lieferant prüfen' },
  { sku: 'OEL-5W30', cause: 'Preis zu hoch', abbruch: '7%', retouren: '2%', marge: '17%', note: 'Preisstaffel prüfen' }
];

const HotspotTable = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = selected.length === hotspotData.length;
  const toggleAll = () => setSelected(allSelected ? [] : hotspotData.map((h) => h.sku));
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div>
      {selected.length > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', gap: 8 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected.length} markiert</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary">Markierte analysieren</Button>
            <Button size="sm" variant="ghost">Als Aufgabe speichern</Button>
          </div>
        </div>
      ) : null}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Alle auswählen" /></th>
              <th>SKU / Artikel</th>
              <th>Ursache</th>
              <th>Abbruchrate</th>
              <th>Retourenquote</th>
              <th>Ø Marge</th>
              <th>Empfehlung</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {hotspotData.map((h) => (
              <tr key={h.sku} className="table-row">
                <td><input type="checkbox" checked={selected.includes(h.sku)} onChange={() => toggle(h.sku)} aria-label={`${h.sku} auswählen`} /></td>
                <td>{h.sku}</td>
                <td><Badge variant="neutral">{h.cause}</Badge></td>
                <td>{h.abbruch}</td>
                <td>{h.retouren}</td>
                <td>{h.marge}</td>
                <td style={{ color: 'var(--muted)' }}>{h.note}</td>
                <td><Button size="sm" variant="ghost">Details</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const capitalData = [
  { sku: 'BREM-2440', stock: 120, einstand: '45 €', capital: '5.400 €', days: '120 Tage', action: 'B2B-Abverkauf' },
  { sku: 'FILTER-900', stock: 340, einstand: '6 €', capital: '2.040 €', days: '95 Tage', action: 'Bundle' },
  { sku: 'RADLAGER-77', stock: 60, einstand: '38 €', capital: '2.280 €', days: '150 Tage', action: 'Preis senken' },
  { sku: 'BATT-AGM60', stock: 18, einstand: '110 €', capital: '1.980 €', days: '210 Tage', action: 'Lieferant-Rückgabe' },
  { sku: 'WISCH-SET2', stock: 220, einstand: '4 €', capital: '880 €', days: '75 Tage', action: 'Bundle' },
  { sku: 'OEL-5W30', stock: 90, einstand: '18 €', capital: '1.620 €', days: '60 Tage', action: 'B2B-Abverkauf' }
];

const CapitalTable = () => {
  const [planner, setPlanner] = useState<{ open: boolean; sku?: string }>({ open: false });
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [actionType, setActionType] = useState('Preis senken');
  const [planStatus, setPlanStatus] = useState<string | null>(null);

  return (
    <div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Artikel / SKU</th>
              <th>Bestand</th>
              <th>Einstand</th>
              <th>Kapitalwert</th>
              <th>Liegedauer</th>
              <th>Empfohlene Aktion</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {capitalData.map((c) => (
              <tr key={c.sku} className="table-row">
                <td>{c.sku}</td>
                <td>{c.stock}</td>
                <td>{c.einstand}</td>
                <td>{c.capital}</td>
                <td>{c.days}</td>
                <td><Badge variant="neutral">{c.action}</Badge></td>
                <td>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setPlanner({ open: true, sku: c.sku });
                      setPlanStatus(null);
                    }}
                  >
                    Aktion planen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {planner.open ? (
        <div
          style={{
            marginTop: 12,
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(255,255,255,0.03)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10
          }}
        >
          <div style={{ fontWeight: 800 }}>Plan für {planner.sku}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'var(--muted)', fontSize: 12 }}>Aktionstyp</label>
            <select
              className="topbar-select"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option>Preis senken</option>
              <option>Bundle</option>
              <option>B2B-Abverkauf</option>
              <option>Lieferant-Rückgabe</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'var(--muted)', fontSize: 12 }}>Zielpreis (€)</label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="z.B. 14,90" />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'var(--muted)', fontSize: 12 }}>Notiz</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                minHeight: 80,
                borderRadius: 10,
                border: '1px solid var(--border)',
                padding: 10,
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text)'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              variant="primary"
              onClick={() => {
                setPlanStatus('Plan gespeichert (Demo)');
              }}
            >
              Plan speichern (Demo)
            </Button>
            <Button variant="ghost" onClick={() => setPlanner({ open: false })}>
              Schließen
            </Button>
            {planStatus ? <span style={{ color: 'var(--muted)' }}>{planStatus}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
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
