import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Database, Search, Play, Square, RefreshCw, Sparkles,
    ChevronDown, Car, Wrench, Zap, CheckCircle2, XCircle, Clock,
    Filter, Hash, Shield, ShieldAlert, ShieldCheck, Cpu, Globe, Timer, Info,
    ExternalLink, Loader2, Trash2, Plus, PlayCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
    getOemDbStats, getOemRecords, getOemVehicles, startSeeder,
    getSeederStatus, stopSeeder, reverseOemLookup,
    testOemPipeline, lookupPartsLink24, PartsLink24Result, getPartsLink24Health,
    OemDbStats, OemRecord, SeederStatus, OemVehiclesData
} from '../api/wws';
import { toast } from 'sonner';
import { OemPlayground } from './OemPlayground';

// ── Tab Navigation ──

type TabId = 'playground' | 'register' | 'seeder' | 'custom' | 'pl24batch';

// ── Main Component ──

export function OemRegisterView() {
    const [activeTab, setActiveTab] = useState<TabId>('playground');
    const [dbStats, setDbStats] = useState<OemDbStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const loadStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const stats = await getOemDbStats();
            setDbStats(stats);
        } catch {
            toast.error('Fehler beim Laden der DB-Statistiken');
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const tabs = [
        { id: 'playground' as TabId, label: 'Pipeline Test', icon: Sparkles },
        { id: 'register' as TabId, label: 'OEM Register', icon: Database, count: dbStats?.totalRecords },
        { id: 'seeder' as TabId, label: 'Catalog Seeder', icon: Zap },
        { id: 'pl24batch' as TabId, label: 'PL24 Batch', icon: ExternalLink },
        { id: 'custom' as TabId, label: 'Custom-Suche', icon: Search },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">OEM Intelligence</h1>
                        <p className="text-sm text-muted-foreground">
                            {dbStats ? `${dbStats.totalRecords.toLocaleString()} OEM-Nummern · ${Object.keys(dbStats.brands).length} Marken` : 'Laden…'}
                        </p>
                    </div>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={loadStats} disabled={loadingStats}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} /> Aktualisieren
                </Button>
            </div>

            {/* Stats Cards */}
            {dbStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-500">{dbStats.totalRecords.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">OEM-Nummern</div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{Object.keys(dbStats.brands).length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Marken</div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-500">{Object.keys(dbStats.categories).length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Teilekategorien</div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{dbStats.seederTotalCombinations.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">Seeder-Kapazität</div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-card shadow-sm text-foreground border border-border'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tab.count.toLocaleString()}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'playground' && <OemPlayground />}
            {activeTab === 'register' && <RegisterTab dbStats={dbStats} />}
            {activeTab === 'seeder' && <SeederTab onStatsRefresh={loadStats} />}
            {activeTab === 'pl24batch' && <PL24BatchTab />}
            {activeTab === 'custom' && <CustomSearchTab />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: OEM Register
// ═══════════════════════════════════════════════════════════════

function RegisterTab({ dbStats }: { dbStats: OemDbStats | null }) {
    const [records, setRecords] = useState<OemRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const loadRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOemRecords({
                brand: brandFilter || undefined,
                category: categoryFilter || undefined,
                search: searchQuery || undefined,
                limit: 100,
            });
            setRecords(data.records || []);
        } catch {
            toast.error('Fehler beim Laden der Records');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, brandFilter, categoryFilter]);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    return (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            {/* Filters */}
            <div className="p-4 border-b border-border flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                        placeholder="OEM-Nummer oder Teilebeschreibung suchen…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadRecords()}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        className="pl-10 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                        value={brandFilter}
                        onChange={e => setBrandFilter(e.target.value)}
                    >
                        <option value="">Alle Marken</option>
                        {dbStats && Object.keys(dbStats.brands).sort().map(b => (
                            <option key={b} value={b}>{b} ({dbStats.brands[b]})</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        className="pl-10 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Alle Kategorien</option>
                        {dbStats && Object.keys(dbStats.categories).sort().map(c => (
                            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="text-center py-16 text-muted-foreground animate-pulse">Lade OEM-Records…</div>
                ) : records.length === 0 ? (
                    <div className="text-center py-16">
                        <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Keine OEM-Nummern gefunden</p>
                        <p className="text-xs text-muted-foreground mt-1">Starte den Seeder um die Datenbank zu befüllen</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                <th className="py-3 px-4">OEM-Nummer</th>
                                <th className="py-3 px-4">Beschreibung</th>
                                <th className="py-3 px-4">Confidence</th>
                                <th className="py-3 px-4">Quelle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r, i) => (
                                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                    <td className="py-3 px-4">
                                        <span className="font-mono font-bold text-primary">{r.oem}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm">{r.description || '—'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${r.confidence >= 0.9 ? 'bg-emerald-500' : r.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${r.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${r.confidence >= 0.9 ? 'text-emerald-500' : r.confidence >= 0.7 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {Math.round(r.confidence * 100)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{r.source || 'db'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: Catalog Seeder
// ═══════════════════════════════════════════════════════════════

function SeederTab({ onStatsRefresh }: { onStatsRefresh: () => void }) {
    const [status, setStatus] = useState<SeederStatus | null>(null);
    const [vehicleData, setVehicleData] = useState<OemVehiclesData | null>(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [starting, setStarting] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load vehicle data for dropdowns
    useEffect(() => {
        getOemVehicles().then(setVehicleData).catch(() => {});
        getSeederStatus().then(setStatus).catch(() => {});
    }, []);

    // Poll seeder status while running
    useEffect(() => {
        if (status?.running) {
            pollRef.current = setInterval(async () => {
                try {
                    const s = await getSeederStatus();
                    setStatus(s);
                    if (!s.running) {
                        clearInterval(pollRef.current!);
                        onStatsRefresh();
                        toast.success(`Seeder fertig: ${s.found} neue OEMs gefunden!`);
                    }
                } catch { /* ignore */ }
            }, 2000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [status?.running, onStatsRefresh]);

    const handleStart = async () => {
        setStarting(true);
        try {
            const result = await startSeeder({ brand: selectedBrand || undefined });
            toast.success(result.message);
            const s = await getSeederStatus();
            setStatus(s);
        } catch (err: any) {
            toast.error(err?.message || 'Seeder konnte nicht gestartet werden');
        } finally {
            setStarting(false);
        }
    };

    const handleStop = async () => {
        try {
            await stopSeeder();
            toast.info('Seeder wird gestoppt…');
            const s = await getSeederStatus();
            setStatus(s);
        } catch {
            toast.error('Fehler beim Stoppen');
        }
    };

    const progressPct = status?.total ? Math.round((status.completed / status.total) * 100) : 0;
    const etaMin = status?.etaSeconds ? Math.ceil(status.etaSeconds / 60) : 0;

    return (
        <div className="space-y-6">
            {/* Seeder Control Panel */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-lg">Catalog Seeder</h3>
                    {status?.running && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
                            Läuft…
                        </span>
                    )}
                </div>

                {!status?.running ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Der Seeder befüllt die OEM-Datenbank über KI-gestützte Websuche.
                            Wähle eine Marke oder starte für alle {vehicleData?.brands.length || 0} Marken.
                        </p>

                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marke (optional)</label>
                                <div className="relative">
                                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <select
                                        className="w-full pl-10 pr-8 py-3 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                                        value={selectedBrand}
                                        onChange={e => setSelectedBrand(e.target.value)}
                                    >
                                        <option value="">Alle Marken ({vehicleData?.brands.length || 0})</option>
                                        {vehicleData?.brands.map(b => (
                                            <option key={b} value={b}>{b} ({vehicleData.vehiclesByBrand[b]?.length || 0} Modelle)</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <Button
                                className="rounded-xl px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                                onClick={handleStart}
                                disabled={starting}
                            >
                                {starting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                Seeder starten
                            </Button>
                        </div>

                        {selectedBrand && vehicleData && (
                            <div className="bg-muted/30 rounded-xl p-4">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Modelle für {selectedBrand}:</div>
                                <div className="flex gap-2 flex-wrap">
                                    {vehicleData.vehiclesByBrand[selectedBrand]?.map(v => (
                                        <span key={v.modelCode} className="text-xs bg-card border border-border px-3 py-1.5 rounded-lg">
                                            {v.model} <span className="text-muted-foreground">({v.yearFrom}–{v.yearTo})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">{progressPct}% abgeschlossen</span>
                                <span className="text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                                    ETA: {etaMin} Min
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Item */}
                        <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
                            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                            <div className="text-sm">
                                <span className="font-medium">{status?.currentVehicle}</span>
                                <span className="text-muted-foreground"> → {status?.currentPart}</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-muted/30 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold">{status?.completed || 0}</div>
                                <div className="text-[11px] text-muted-foreground">Bearbeitet</div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold text-emerald-600">{status?.found || 0}</div>
                                <div className="text-[11px] text-emerald-600">Gefunden</div>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold">{status?.skipped || 0}</div>
                                <div className="text-[11px] text-muted-foreground">Übersprungen</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold text-red-500">{status?.failed || 0}</div>
                                <div className="text-[11px] text-red-500">Fehlgeschlagen</div>
                            </div>
                        </div>

                        {/* Stop Button */}
                        <Button variant="destructive" className="rounded-xl w-full" onClick={handleStop}>
                            <Square className="w-4 h-4 mr-2" /> Seeder stoppen
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: Custom Search
// ═══════════════════════════════════════════════════════════════

function CustomSearchTab() {
    const [vehicleData, setVehicleData] = useState<OemVehiclesData | null>(null);
    const [mode, setMode] = useState<'forward' | 'reverse'>('forward');

    // Forward mode state
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [customModel, setCustomModel] = useState('');
    const [vin, setVin] = useState('');
    const [partDesc, setPartDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [forwardResult, setForwardResult] = useState<any>(null);

    // Reverse mode state
    const [oemInput, setOemInput] = useState('');
    const [reverseLoading, setReverseLoading] = useState(false);
    const [reverseResult, setReverseResult] = useState<{
        success: boolean; oem: string;
        partName?: string; partCategory?: string; vehicles?: string;
        manufacturer?: string; confidence?: number; notes?: string;
    } | null>(null);

    useEffect(() => { getOemVehicles().then(setVehicleData).catch(() => {}); }, []);

    // ── Forward Search: Vehicle + Part → OEM ──
    const handleForwardSearch = async () => {
        const finalModel = customModel || model;
        if (!partDesc) {
            toast.error('Bitte ein Teil eingeben');
            return;
        }

        setLoading(true);
        setForwardResult(null);
        try {
            // Use the full pipeline test endpoint with Pattern Decoder trace
            const result = await testOemPipeline({
                make: brand || 'UNKNOWN',
                model: finalModel || undefined,
                part: partDesc,
                vin: vin || undefined,
            });
            setForwardResult(result);
            if (result.result?.bestOem) {
                toast.success(`OEM gefunden: ${result.result.bestOem}`);
            } else {
                toast.error('Keine OEM-Nummer gefunden');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Pipeline-Test fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    // ── Reverse Search: OEM → Part ──
    const handleReverseSearch = async () => {
        if (!oemInput || oemInput.length < 4) {
            toast.error('Bitte eine OEM-Nummer eingeben (min. 4 Zeichen)');
            return;
        }

        setReverseLoading(true);
        setReverseResult(null);
        try {
            const result = await reverseOemLookup(oemInput.trim());
            setReverseResult(result);
            if (result.success && result.partName) {
                toast.success(`Teil identifiziert: ${result.partName}`);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Reverse Lookup fehlgeschlagen');
        } finally {
            setReverseLoading(false);
        }
    };

    const models = brand && vehicleData ? vehicleData.vehiclesByBrand[brand] || [] : [];

    return (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">OEM Intelligence</h3>
                </div>

                {/* Direction Toggle */}
                <div className="flex bg-muted/40 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setMode('forward')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mode === 'forward'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Car className="w-4 h-4" />
                        Fahrzeug → OEM
                    </button>
                    <button
                        onClick={() => setMode('reverse')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mode === 'reverse'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Hash className="w-4 h-4" />
                        OEM → Teil
                    </button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                {mode === 'forward'
                    ? '🔍 Volle Pipeline: Datenbank → Querverweise → KI-Suche → Validierung → Self-Learning'
                    : '🔄 KI-gestützte Rückwärtssuche: OEM-Nummer → Teil + kompatible Fahrzeuge'
                }
            </p>

            {/* ═══ FORWARD MODE ═══ */}
            {mode === 'forward' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* VIN */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">VIN/FIN (optional)</label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono"
                                placeholder="WVWZZZAUZJP023456"
                                value={vin}
                                onChange={e => setVin(e.target.value.toUpperCase())}
                            />
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marke</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                                    value={brand}
                                    onChange={e => { setBrand(e.target.value); setModel(''); setCustomModel(''); }}
                                >
                                    <option value="">Marke wählen</option>
                                    {vehicleData?.brands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                    <option value="__custom">Andere Marke…</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Model */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Modell</label>
                            {models.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                                            value={model}
                                            onChange={e => { setModel(e.target.value); setCustomModel(''); }}
                                        >
                                            <option value="">Modell wählen</option>
                                            {models.map(m => (
                                                <option key={m.modelCode} value={m.model}>{m.model} ({m.yearFrom}–{m.yearTo})</option>
                                            ))}
                                            <option value="__custom">Anderes Modell…</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                    {model === '__custom' && (
                                        <input
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
                                            placeholder="z.B. 5er G60"
                                            value={customModel}
                                            onChange={e => setCustomModel(e.target.value)}
                                        />
                                    )}
                                </div>
                            ) : (
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
                                    placeholder="z.B. Golf 8, C-Klasse W206"
                                    value={customModel}
                                    onChange={e => setCustomModel(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Part */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ersatzteil</label>
                            <div className="relative">
                                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm"
                                    placeholder="z.B. Bremsscheibe vorne"
                                    value={partDesc}
                                    onChange={e => setPartDesc(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleForwardSearch()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Part Buttons */}
                    {vehicleData && (
                        <div>
                            <div className="text-xs font-medium text-muted-foreground mb-2">Schnellauswahl:</div>
                            <div className="flex gap-2 flex-wrap">
                                {vehicleData.parts.slice(0, 12).map(p => (
                                    <button
                                        key={p.category}
                                        onClick={() => setPartDesc(p.description)}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                            partDesc === p.description
                                                ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                                                : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                                        }`}
                                    >
                                        {p.description}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        className="rounded-xl px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg w-full md:w-auto"
                        onClick={handleForwardSearch}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        OEM-Nummer suchen (Hydra v2)
                    </Button>

                    {/* Forward Result */}
                    {forwardResult && (
                        <div className="space-y-4">
                            {/* Main Result */}
                            <div className={`rounded-2xl p-6 border ${
                                forwardResult.result?.bestOem
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                            }`}>
                                {forwardResult.result?.bestOem ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-4">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-3xl font-mono font-bold text-foreground">{forwardResult.result.bestOem}</span>
                                                </div>
                                                <div className="flex gap-4 text-sm flex-wrap">
                                                    <span className="flex items-center gap-1.5">
                                                        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{forwardResult.elapsed}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{forwardResult.result.resolvedBy}</span>
                                                    </span>
                                                    <span className={`font-bold ${
                                                        forwardResult.result.confidence >= 0.9 ? 'text-emerald-600' :
                                                        forwardResult.result.confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                        {Math.round(forwardResult.result.confidence * 100)}% Confidence
                                                    </span>
                                                    {forwardResult.result.needsConfirmation && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Bestätigung empfohlen</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-bold text-red-700 dark:text-red-400 mb-1">Keine OEM-Nummer gefunden</div>
                                            <div className="text-sm text-muted-foreground">Hydra konnte keine passende Nummer finden. ({forwardResult.elapsed})</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pattern Decoder + Validation */}
                            {forwardResult.patternDecoder && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Pattern Decoder Card */}
                                    <div className="bg-card border border-border rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-sm">Pattern Decoder</span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Marke:</span>
                                                <span className="font-medium">{forwardResult.patternDecoder.brand}</span>
                                            </div>
                                            {forwardResult.patternDecoder.partGroup && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Teilegruppe:</span>
                                                    <span className="font-mono font-medium">{forwardResult.patternDecoder.partGroup}</span>
                                                </div>
                                            )}
                                            {forwardResult.patternDecoder.position && forwardResult.patternDecoder.position !== 'unspecified' && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Position:</span>
                                                    <span className="font-medium">{forwardResult.patternDecoder.position === 'front' ? '🔵 Vorne' : forwardResult.patternDecoder.position === 'rear' ? '🔴 Hinten' : forwardResult.patternDecoder.position}</span>
                                                </div>
                                            )}
                                            {forwardResult.patternDecoder.platform && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Plattform:</span>
                                                    <span className="font-medium">{forwardResult.patternDecoder.platform}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Decode-Confidence:</span>
                                                <span className={`font-bold ${forwardResult.patternDecoder.decodeConfidence >= 0.8 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                                    {Math.round(forwardResult.patternDecoder.decodeConfidence * 100)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 mt-2">
                                                {forwardResult.patternDecoder.explanation}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Validation Card */}
                                    {forwardResult.validation && (
                                        <div className={`border rounded-2xl p-5 ${
                                            forwardResult.validation.isHallucination 
                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                {forwardResult.validation.isHallucination 
                                                    ? <ShieldAlert className="w-4 h-4 text-red-500" />
                                                    : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                                                <span className="font-bold text-sm">
                                                    {forwardResult.validation.isHallucination ? '🚫 Hallucination!' : '✅ Validierung bestanden'}
                                                </span>
                                            </div>
                                            <p className="text-sm">{forwardResult.validation.reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Brand Intelligence */}
                            {forwardResult.brandIntelligence && (
                                <div className="bg-card border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        <span className="font-bold text-sm">Brand Intelligence — {forwardResult.brandIntelligence.brand}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">OEM-Format</div>
                                            <div className="text-xs">{forwardResult.brandIntelligence.oemFormat}</div>
                                            <div className="text-xs text-muted-foreground mt-1">Beispiele: {forwardResult.brandIntelligence.examples?.join(', ')}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Katalog-Quellen</div>
                                            <div className="flex flex-wrap gap-1">
                                                {forwardResult.brandIntelligence.catalogUrls?.map((url: string) => (
                                                    <span key={url} className="text-xs bg-muted px-2 py-0.5 rounded-full">{url}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {forwardResult.brandIntelligence.partSharingGroup && (
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Teile-Sharing-Gruppe</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {forwardResult.brandIntelligence.partSharingGroup.map((g: string) => (
                                                        <span key={g} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{g}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* All Candidates Table */}
                            {forwardResult.result?.allCandidates?.length > 0 && (
                                <div className="bg-card border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-sm">Alle Kandidaten ({forwardResult.result.allCandidates.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {forwardResult.result.allCandidates.map((c: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-muted/20 rounded-xl px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-mono font-bold">{c.oem}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{c.source}</span>
                                                    <span className={`text-xs font-bold ${
                                                        c.confidence >= 0.9 ? 'text-emerald-500' : 
                                                        c.confidence >= 0.7 ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>
                                                        {Math.round(c.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ═══ REVERSE MODE ═══ */}
            {mode === 'reverse' && (
                <>
                    <div className="max-w-lg">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">OEM-Nummer eingeben</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background text-lg font-mono font-bold tracking-wider"
                                placeholder="z.B. 5Q0 407 151 M"
                                value={oemInput}
                                onChange={e => setOemInput(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && handleReverseSearch()}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">KI identifiziert automatisch: Teilname, Kategorie, Hersteller und kompatible Fahrzeuge</p>
                    </div>

                    <Button
                        className="rounded-xl px-8 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg w-full md:w-auto"
                        onClick={handleReverseSearch}
                        disabled={reverseLoading}
                    >
                        {reverseLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Teil identifizieren
                    </Button>

                    {/* Reverse Result */}
                    {reverseResult && (
                        <div className={`rounded-2xl p-6 border ${
                            reverseResult.success && reverseResult.partName && reverseResult.partName !== 'Unbekannt'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                        }`}>
                            {reverseResult.success && reverseResult.partName && reverseResult.partName !== 'Unbekannt' ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="mb-1 text-xs text-muted-foreground font-mono">{reverseResult.oem}</div>
                                            <div className="text-2xl font-bold text-foreground mb-2">{reverseResult.partName}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {reverseResult.partCategory && (
                                            <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-border/50">
                                                <div className="text-xs text-muted-foreground mb-1">Kategorie</div>
                                                <div className="font-medium">{reverseResult.partCategory}</div>
                                            </div>
                                        )}
                                        {reverseResult.manufacturer && (
                                            <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-border/50">
                                                <div className="text-xs text-muted-foreground mb-1">OE-Hersteller</div>
                                                <div className="font-medium">{reverseResult.manufacturer}</div>
                                            </div>
                                        )}
                                        {reverseResult.vehicles && (
                                            <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-border/50 md:col-span-2">
                                                <div className="text-xs text-muted-foreground mb-1">Kompatible Fahrzeuge</div>
                                                <div className="font-medium text-sm">{reverseResult.vehicles}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 text-sm text-muted-foreground">
                                        {reverseResult.confidence !== undefined && (
                                            <span>Confidence: <strong className={reverseResult.confidence >= 0.8 ? 'text-emerald-600' : 'text-yellow-600'}>
                                                {Math.round(reverseResult.confidence * 100)}%
                                            </strong></span>
                                        )}
                                        {reverseResult.notes && <span>· {reverseResult.notes}</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <XCircle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-amber-700 dark:text-amber-400 mb-1">Teil nicht identifiziert</div>
                                        <div className="text-sm text-muted-foreground">
                                            {reverseResult.notes || 'Die KI konnte diese OEM-Nummer nicht zuordnen.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5: PartsLink24 Batch Test
// ═══════════════════════════════════════════════════════════════

interface BatchTestCase {
    id: string;
    vin: string;
    part: string;
    label?: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'no-results';
    result?: PartsLink24Result;
    elapsedMs?: number;
    error?: string;
}

const DEFAULT_TEST_CASES: Omit<BatchTestCase, 'id' | 'status'>[] = [
    { vin: 'WBAAT51010FW14413', part: 'Ölfilter', label: 'BMW 5er E39' },
    { vin: 'WBAAT51010FW14413', part: 'Bremsscheibe vorne', label: 'BMW 5er E39' },
    { vin: 'WBAAT51010FW14413', part: 'Luftfilter', label: 'BMW 5er E39' },
    { vin: 'WBAAT51010FW14413', part: 'Zündkerze', label: 'BMW 5er E39' },
    { vin: 'WBAAT51010FW14413', part: 'Wasserpumpe', label: 'BMW 5er E39' },
];

function PL24BatchTab() {
    const [testCases, setTestCases] = useState<BatchTestCase[]>(
        DEFAULT_TEST_CASES.map((tc, i) => ({ ...tc, id: `tc-${i}`, status: 'pending' as const }))
    );
    const [running, setRunning] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [pl24Health, setPl24Health] = useState<{ status: string; browser: { running: boolean } } | null>(null);
    const abortRef = useRef(false);

    // Check PL24 health on mount
    useEffect(() => {
        getPartsLink24Health().then(setPl24Health).catch(() => setPl24Health(null));
    }, []);

    // Add test case
    const addTestCase = () => {
        setTestCases(prev => [...prev, {
            id: `tc-${Date.now()}`,
            vin: '',
            part: '',
            label: '',
            status: 'pending',
        }]);
    };

    // Remove test case
    const removeTestCase = (id: string) => {
        setTestCases(prev => prev.filter(tc => tc.id !== id));
    };

    // Update test case field
    const updateTestCase = (id: string, field: 'vin' | 'part' | 'label', value: string) => {
        setTestCases(prev => prev.map(tc =>
            tc.id === id ? { ...tc, [field]: field === 'vin' ? value.toUpperCase() : value } : tc
        ));
    };

    // Run all test cases sequentially
    const runBatch = async () => {
        setRunning(true);
        abortRef.current = false;

        // Reset all statuses
        setTestCases(prev => prev.map(tc => ({ ...tc, status: 'pending' as const, result: undefined, elapsedMs: undefined, error: undefined })));

        for (let i = 0; i < testCases.length; i++) {
            if (abortRef.current) break;

            const tc = testCases[i];
            if (!tc.vin || !tc.part) {
                setTestCases(prev => prev.map((t, idx) =>
                    idx === i ? { ...t, status: 'error', error: 'VIN oder Teil fehlt' } : t
                ));
                continue;
            }

            setCurrentIdx(i);
            setTestCases(prev => prev.map((t, idx) =>
                idx === i ? { ...t, status: 'running' } : t
            ));

            const start = Date.now();
            try {
                const result = await lookupPartsLink24({ vin: tc.vin, part: tc.part });
                const elapsedMs = Date.now() - start;

                setTestCases(prev => prev.map((t, idx) =>
                    idx === i ? {
                        ...t,
                        status: result.success && result.results.length > 0 ? 'success' : 'no-results',
                        result,
                        elapsedMs,
                    } : t
                ));
            } catch (err: any) {
                setTestCases(prev => prev.map((t, idx) =>
                    idx === i ? {
                        ...t,
                        status: 'error',
                        error: err?.message || 'Unbekannter Fehler',
                        elapsedMs: Date.now() - start,
                    } : t
                ));
            }

            // Small delay between requests to avoid overwhelming the scraper
            if (i < testCases.length - 1 && !abortRef.current) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        setCurrentIdx(-1);
        setRunning(false);
        toast.success('Batch-Test abgeschlossen!');
    };

    const stopBatch = () => {
        abortRef.current = true;
        toast.info('Batch wird gestoppt…');
    };

    // Stats
    const done = testCases.filter(tc => tc.status !== 'pending' && tc.status !== 'running');
    const successCount = testCases.filter(tc => tc.status === 'success').length;
    const noResultCount = testCases.filter(tc => tc.status === 'no-results').length;
    const errorCount = testCases.filter(tc => tc.status === 'error').length;
    const avgMs = done.length > 0
        ? Math.round(done.filter(tc => tc.elapsedMs).reduce((sum, tc) => sum + (tc.elapsedMs || 0), 0) / done.filter(tc => tc.elapsedMs).length)
        : 0;
    const totalOems = testCases.reduce((sum, tc) => sum + (tc.result?.results?.length || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header + Health */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">PartsLink24 Batch Test</h3>
                            <div className="text-xs text-muted-foreground">
                                {pl24Health?.status === 'healthy'
                                    ? '✅ Service verbunden'
                                    : pl24Health === null
                                        ? '⏳ Verbindung prüfen…'
                                        : '⚠️ Service nicht erreichbar'
                                }
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!running ? (
                            <Button
                                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                                onClick={runBatch}
                                disabled={testCases.length === 0 || testCases.every(tc => !tc.vin || !tc.part)}
                            >
                                <PlayCircle className="w-4 h-4 mr-2" /> Batch starten ({testCases.length})
                            </Button>
                        ) : (
                            <Button variant="destructive" className="rounded-xl" onClick={stopBatch}>
                                <Square className="w-4 h-4 mr-2" /> Stoppen
                            </Button>
                        )}
                    </div>
                </div>

                {/* Progress bar when running */}
                {running && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">{currentIdx + 1} / {testCases.length} — {testCases[currentIdx]?.part}</span>
                            <span className="text-muted-foreground">{Math.round(((currentIdx + 1) / testCases.length) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${((currentIdx + 1) / testCases.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Stats cards */}
                {done.length > 0 && (
                    <div className="grid grid-cols-5 gap-3 mb-4">
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold">{done.length}/{testCases.length}</div>
                            <div className="text-[11px] text-muted-foreground">Abgeschlossen</div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-emerald-600">{successCount}</div>
                            <div className="text-[11px] text-emerald-600">Treffer</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-yellow-600">{noResultCount}</div>
                            <div className="text-[11px] text-yellow-600">Keine Treffer</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-red-500">{errorCount}</div>
                            <div className="text-[11px] text-red-500">Fehler</div>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold">{totalOems}</div>
                            <div className="text-[11px] text-muted-foreground">OEMs gefunden</div>
                        </div>
                    </div>
                )}

                {/* Test Cases Editor */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Test Cases</span>
                        <button
                            onClick={addTestCase}
                            disabled={running}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5" /> Hinzufügen
                        </button>
                    </div>

                    {testCases.map((tc, idx) => (
                        <div
                            key={tc.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                tc.status === 'running'
                                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 animate-pulse'
                                    : tc.status === 'success'
                                    ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10'
                                    : tc.status === 'error'
                                    ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10'
                                    : tc.status === 'no-results'
                                    ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10'
                                    : 'border-border bg-background'
                            }`}
                        >
                            {/* Status indicator */}
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                                {tc.status === 'running' ? (
                                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                ) : tc.status === 'success' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : tc.status === 'error' ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                ) : tc.status === 'no-results' ? (
                                    <XCircle className="w-4 h-4 text-yellow-500" />
                                ) : (
                                    <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                                )}
                            </div>

                            {/* VIN input */}
                            <input
                                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono disabled:opacity-50"
                                placeholder="VIN/FIN"
                                value={tc.vin}
                                onChange={e => updateTestCase(tc.id, 'vin', e.target.value)}
                                disabled={running}
                                maxLength={17}
                            />

                            {/* Part input */}
                            <input
                                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-50"
                                placeholder="Ersatzteil"
                                value={tc.part}
                                onChange={e => updateTestCase(tc.id, 'part', e.target.value)}
                                disabled={running}
                            />

                            {/* Label (optional) */}
                            <input
                                className="w-32 px-3 py-2 rounded-lg border border-border bg-background text-xs text-muted-foreground disabled:opacity-50"
                                placeholder="Label"
                                value={tc.label || ''}
                                onChange={e => updateTestCase(tc.id, 'label', e.target.value)}
                                disabled={running}
                            />

                            {/* Result info */}
                            <div className="w-24 text-right flex-shrink-0">
                                {tc.status === 'success' && tc.result && (
                                    <div>
                                        <div className="text-xs font-bold text-emerald-600">{tc.result.results.length} OEMs</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {tc.elapsedMs ? `${(tc.elapsedMs / 1000).toFixed(1)}s` : ''}
                                            {tc.result.fromCache && ' · Cache'}
                                        </div>
                                    </div>
                                )}
                                {tc.status === 'error' && (
                                    <div className="text-[10px] text-red-500 truncate" title={tc.error}>{tc.error}</div>
                                )}
                                {tc.status === 'no-results' && (
                                    <div className="text-[10px] text-yellow-600">0 Treffer</div>
                                )}
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={() => removeTestCase(tc.id)}
                                disabled={running}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Results Detail ── */}
            {testCases.some(tc => tc.result && tc.result.results.length > 0) && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-amber-500" />
                        <h3 className="font-bold text-sm">Ergebnisse im Detail</h3>
                        <span className="text-xs text-muted-foreground ml-auto">
                            Ø {avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : '—'} pro Abfrage
                        </span>
                    </div>

                    <div className="space-y-3">
                        {testCases.filter(tc => tc.result && tc.result.results.length > 0).map(tc => (
                            <div key={tc.id} className="border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                                        {tc.vin}
                                    </span>
                                    <span className="text-sm font-medium">{tc.part}</span>
                                    {tc.label && <span className="text-xs text-muted-foreground">({tc.label})</span>}
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {tc.result?.results.length} OEMs · {tc.elapsedMs ? `${(tc.elapsedMs / 1000).toFixed(1)}s` : ''}
                                        {tc.result?.fromCache && ' · 🔄 Cache'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {tc.result?.results.map((r, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-card/80 rounded-xl px-4 py-3 border border-border">
                                            <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono font-bold text-sm tracking-wider">{r.oem}</div>
                                                <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>
                                            </div>
                                            {r.bildtafel && <span className="text-[10px] text-muted-foreground">{r.bildtafel}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
