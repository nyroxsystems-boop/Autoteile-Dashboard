import { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Car, Wrench, Zap, CheckCircle2, XCircle,
    ChevronDown, Shield, ShieldAlert, ShieldCheck, Cpu, Globe, Timer, Info, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { testOemPipeline, getOemVehicles, OemVehiclesData } from '../api/wws';
import { toast } from 'sonner';

// ─── Vehicle Database (identical to Landing Page Live Demo) ──────────
const VEHICLE_DB: Record<string, Record<string, Record<string, string[]>>> = {
    'BMW': {
        '1er (F20/F21)': { '2015': ['116d (N47, 116PS)', '118i (B38, 136PS)', '120d (N47, 190PS)'], '2016': ['116d (B37, 116PS)', '118i (B38, 136PS)', '120d (B47, 190PS)'], '2017': ['118i (B38, 136PS)', '120d (B47, 190PS)', '125d (B47, 224PS)'] },
        '3er (F30/F31)': { '2014': ['316d (N47, 116PS)', '318d (N47, 143PS)', '320d (N47, 184PS)', '330d (N57, 258PS)'], '2015': ['318d (N47, 150PS)', '320d (N47, 190PS)', '330d (N57, 258PS)', '335d (N57, 313PS)'], '2016': ['318d (B47, 150PS)', '320d (B47, 190PS)', '330d (B57, 265PS)'], '2017': ['320d (B47, 190PS)', '330d (B57, 265PS)', '340i (B58, 326PS)'], '2018': ['318d (B47, 150PS)', '320d (B47, 190PS)', '330i (B48, 252PS)'] },
        '5er (G30/G31)': { '2017': ['520d (B47, 190PS)', '530d (B57, 265PS)', '530i (B48, 252PS)', '540i (B58, 340PS)'], '2018': ['520d (B47, 190PS)', '530d (B57, 265PS)', '540i (B58, 340PS)', 'M550d (B57, 400PS)'], '2019': ['520d (B47, 190PS)', '530e (B48, 292PS)', '540i (B58, 340PS)'] },
        'X1 (F48)': { '2016': ['sDrive18d (B47, 150PS)', 'xDrive20d (B47, 190PS)', 'xDrive25d (B47, 231PS)'], '2017': ['sDrive18d (B47, 150PS)', 'xDrive20d (B47, 190PS)'], '2018': ['sDrive18d (B47, 150PS)', 'xDrive20d (B47, 190PS)', 'xDrive25e (B38, 220PS)'] },
        'X3 (G01)': { '2017': ['xDrive20d (B47, 190PS)', 'xDrive30d (B57, 265PS)', 'M40i (B58, 360PS)'], '2018': ['xDrive20d (B47, 190PS)', 'xDrive30d (B57, 265PS)'], '2019': ['xDrive20d (B47, 190PS)', 'xDrive30e (B48, 292PS)'] },
    },
    'Volkswagen': {
        'Golf VII': { '2014': ['1.2 TSI (CJZA, 86PS)', '1.4 TSI (CZCA, 125PS)', '1.6 TDI (CLHB, 90PS)', '2.0 TDI (CRLB, 150PS)', 'GTI 2.0 TSI (CHHB, 230PS)'], '2015': ['1.4 TSI (CZCA, 125PS)', '1.6 TDI (DGTE, 115PS)', '2.0 TDI (CRLB, 150PS)'], '2016': ['1.0 TSI (CHZD, 110PS)', '1.4 TSI (CZCA, 125PS)', '2.0 TDI (DFGA, 150PS)'], '2017': ['1.0 TSI (CHZJ, 115PS)', '1.5 TSI (DADA, 130PS)', '2.0 TDI (DFGA, 150PS)'] },
        'Passat B8': { '2015': ['1.4 TSI (CZEA, 150PS)', '1.6 TDI (DCXA, 120PS)', '2.0 TDI (CRLB, 150PS)', '2.0 TDI (CUAA, 190PS)'], '2016': ['1.4 TSI (CZEA, 150PS)', '2.0 TDI (DFGA, 150PS)', '2.0 TDI (DFHA, 190PS)'], '2017': ['1.4 TSI (CZEA, 150PS)', '2.0 TDI (DFGA, 150PS)'], '2018': ['1.5 TSI (DACA, 150PS)', '2.0 TDI (DFGA, 150PS)'] },
        'Tiguan II': { '2016': ['1.4 TSI (CZEA, 150PS)', '2.0 TDI (DFGA, 150PS)', '2.0 TDI (DFHA, 190PS)'], '2017': ['1.4 TSI (CZEA, 150PS)', '2.0 TDI (DFGA, 150PS)'], '2018': ['1.5 TSI (DACA, 150PS)', '2.0 TDI (DFGA, 150PS)', '2.0 TSI (DNFA, 220PS)'] },
        'T-Roc': { '2018': ['1.0 TSI (CHZJ, 115PS)', '1.5 TSI (DADA, 150PS)', '2.0 TDI (DFGA, 150PS)'], '2019': ['1.0 TSI (CHZJ, 115PS)', '1.5 TSI (DADA, 150PS)', '2.0 TSI (DNFA, 190PS)'] },
    },
    'Mercedes-Benz': {
        'A-Klasse (W176)': { '2015': ['A 160 (M270, 102PS)', 'A 180 (M270, 122PS)', 'A 200 (M270, 156PS)'], '2016': ['A 180 (M270, 122PS)', 'A 200 (M270, 156PS)'], '2017': ['A 180 (M270, 122PS)', 'A 200 (M270, 156PS)', 'A 250 (M270, 211PS)'] },
        'C-Klasse (W205)': { '2014': ['C 180 (M274, 156PS)', 'C 200 (M274, 184PS)', 'C 220d (OM651, 170PS)'], '2015': ['C 180 (M274, 156PS)', 'C 200 (M274, 184PS)', 'C 220d (OM651, 170PS)', 'C 300 (M274, 245PS)'], '2016': ['C 200 (M274, 184PS)', 'C 220d (OM654, 194PS)', 'C 300 (M274, 245PS)'], '2017': ['C 200 (M264, 184PS)', 'C 220d (OM654, 194PS)', 'C 43 AMG (M276, 390PS)'] },
        'E-Klasse (W213)': { '2016': ['E 200 (M274, 184PS)', 'E 220d (OM654, 194PS)', 'E 350d (OM642, 258PS)'], '2017': ['E 200 (M274, 184PS)', 'E 220d (OM654, 194PS)', 'E 300 (M274, 245PS)'], '2018': ['E 200 (M264, 184PS)', 'E 220d (OM654, 194PS)', 'E 300 (M264, 258PS)'] },
        'GLC (X253)': { '2016': ['GLC 200 (M274, 184PS)', 'GLC 220d (OM651, 170PS)'], '2017': ['GLC 220d (OM654, 194PS)', 'GLC 300 (M274, 245PS)'], '2018': ['GLC 200 (M264, 184PS)', 'GLC 220d (OM654, 194PS)'] },
    },
    'Audi': {
        'A3 (8V)': { '2015': ['1.4 TFSI (CZEA, 150PS)', '1.6 TDI (CLHB, 110PS)', '2.0 TDI (CRLB, 150PS)'], '2016': ['1.4 TFSI (CZEA, 150PS)', '2.0 TDI (DFGA, 150PS)'], '2017': ['1.0 TFSI (CHZD, 115PS)', '1.5 TFSI (DADA, 150PS)', '2.0 TDI (DFGA, 150PS)'] },
        'A4 (B9)': { '2016': ['2.0 TFSI (CVKB, 190PS)', '2.0 TDI (DETA, 150PS)', '2.0 TDI (DEUA, 190PS)'], '2017': ['2.0 TFSI (CVKB, 190PS)', '2.0 TDI (DETA, 150PS)'], '2018': ['2.0 TFSI (CVKB, 190PS)', '2.0 TDI (DTUA, 190PS)'] },
        'Q5 (FY)': { '2017': ['2.0 TFSI (DAXB, 252PS)', '2.0 TDI (DETA, 163PS)', '3.0 TDI (CVMD, 286PS)'], '2018': ['2.0 TFSI (DAXB, 252PS)', '2.0 TDI (DTUA, 190PS)'] },
    },
    'Opel': {
        'Astra K': { '2016': ['1.0 Turbo (B10XFT, 105PS)', '1.4 Turbo (B14XFT, 150PS)', '1.6 CDTi (B16DTH, 136PS)'], '2017': ['1.0 Turbo (B10XFT, 105PS)', '1.4 Turbo (B14XFT, 150PS)'], '2018': ['1.2 Turbo (F12XHT, 130PS)', '1.4 Turbo (B14XFT, 150PS)'] },
        'Corsa E': { '2015': ['1.0 Turbo (B10XFT, 90PS)', '1.2 (B12XER, 70PS)', '1.4 (A14XER, 90PS)'], '2016': ['1.0 Turbo (B10XFT, 115PS)', '1.4 (A14XER, 90PS)'], '2017': ['1.0 Turbo (B10XFT, 115PS)', '1.4 Turbo (A14NET, 150PS)'] },
        'Insignia B': { '2017': ['1.5 Turbo (B15XFT, 140PS)', '2.0 CDTi (B20DTH, 170PS)'], '2018': ['1.5 Turbo (B15XFT, 165PS)', '2.0 CDTi (B20DTH, 170PS)', '2.0 Turbo (A20NFT, 260PS)'] },
    },
    'Ford': {
        'Focus IV': { '2018': ['1.0 EcoBoost (M1DA, 85PS)', '1.0 EcoBoost (M1DA, 125PS)', '1.5 EcoBlue (XWDB, 95PS)'], '2019': ['1.0 EcoBoost (M1DA, 125PS)', '1.5 EcoBoost (M1PT, 150PS)'] },
        'Fiesta VII': { '2017': ['1.0 EcoBoost (M1JE, 100PS)', '1.0 EcoBoost (M1JE, 125PS)'], '2018': ['1.0 EcoBoost (M1JE, 125PS)', '1.5 EcoBoost (M1PT, 200PS ST)'] },
        'Kuga II': { '2016': ['1.5 EcoBoost (M8DA, 120PS)', '2.0 TDCi (T7CL, 150PS)'], '2017': ['1.5 EcoBoost (M8DA, 150PS)', '2.0 TDCi (T7CL, 150PS)'] },
    },
    'Hyundai': {
        'Tucson (TL)': { '2016': ['1.6 GDi (G4FD, 132PS)', '1.6 T-GDi (G4FJ, 177PS)', '2.0 CRDi (D4HA, 136PS)'], '2017': ['1.6 T-GDi (G4FJ, 177PS)', '2.0 CRDi (D4HA, 185PS)'] },
        'i30 (PD)': { '2017': ['1.0 T-GDi (G3LC, 120PS)', '1.4 T-GDi (G4LD, 140PS)', '1.6 CRDi (D4FB, 136PS)'], '2018': ['1.0 T-GDi (G3LC, 120PS)', '1.4 T-GDi (G4LD, 140PS)'] },
    },
    'Toyota': {
        'Corolla (E210)': { '2019': ['1.2 Turbo (8NR-FTS, 116PS)', '1.8 Hybrid (2ZR-FXE, 122PS)', '2.0 Hybrid (M20A-FXS, 184PS)'] },
        'RAV4 (XA50)': { '2019': ['2.0 (M20A-FKS, 175PS)', '2.5 Hybrid (A25A-FXS, 218PS)'] },
    },
    'Renault': {
        'Clio V': { '2019': ['1.0 TCe (H4D, 100PS)', '1.3 TCe (H5H, 130PS)', '1.5 dCi (K9K, 85PS)'] },
        'Mégane IV': { '2016': ['1.2 TCe (H5F, 130PS)', '1.5 dCi (K9K, 110PS)', '1.6 dCi (R9M, 130PS)'], '2017': ['1.2 TCe (H5F, 130PS)', '1.5 dCi (K9K, 110PS)'] },
    },
    'Porsche': {
        'Macan (95B)': { '2019': ['2.0 Turbo (DKN, 245PS)', 'S 3.0 (DCM, 354PS)', 'GTS 2.9 (DKP, 380PS)'] },
        'Cayenne (9YA)': { '2018': ['3.0 V6 Turbo (DFC, 340PS)', 'S 2.9 V6 (DFJ, 440PS)'] },
    },
    'Tesla': {
        'Model 3': { '2019': ['Standard Range Plus (239PS)', 'Long Range AWD (350PS)', 'Performance (480PS)'] },
        'Model Y': { '2021': ['Long Range AWD (350PS)', 'Performance (480PS)'] },
    },
};

const MAKES = Object.keys(VEHICLE_DB).sort();

const QUICK_PARTS = [
    'Bremsscheibe vorne', 'Bremsscheibe hinten', 'Bremsbelag vorne', 'Ölfilter',
    'Luftfilter', 'Stoßdämpfer vorne', 'Zündkerze', 'Querlenker',
    'Klimakompressor', 'Wasserpumpe', 'Turbolader', 'Kupplung',
    'Radlager', 'Thermostat', 'Lichtmaschine', 'Spurstange',
];

// ═══════════════════════════════════════════════════════════════════
// OEM Pipeline Playground Component
// ═══════════════════════════════════════════════════════════════════
export function OemPlayground() {
    // Dropdown state
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [engine, setEngine] = useState('');
    const [vin, setVin] = useState('');
    const [partDesc, setPartDesc] = useState('');

    // Results
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showTrace, setShowTrace] = useState(true);

    // Also load server vehicle data for custom models
    const [_serverVehicles, setServerVehicles] = useState<OemVehiclesData | null>(null);
    useEffect(() => { getOemVehicles().then(setServerVehicles).catch(() => {}); }, []);

    // Derived dropdown data from embedded VEHICLE_DB
    const models = make && VEHICLE_DB[make] ? Object.keys(VEHICLE_DB[make]).sort() : [];
    const years = (make && model && VEHICLE_DB[make]?.[model])
        ? Object.keys(VEHICLE_DB[make][model]).sort().reverse() : [];
    const engines = (make && model && year && VEHICLE_DB[make]?.[model]?.[year])
        ? VEHICLE_DB[make][model][year] : [];

    // Resolve Make name for API (handle "Volkswagen" → "VOLKSWAGEN")
    const getMakeForApi = () => {
        if (make === 'Volkswagen') return 'VW';
        if (make === 'Mercedes-Benz') return 'MERCEDES';
        return make.toUpperCase();
    };

    // Search
    const handleSearch = useCallback(async () => {
        if (!partDesc.trim()) {
            toast.error('Bitte ein Ersatzteil eingeben');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const engineCode = engine.match(/\(([^,]+)/)?.[1] || '';
            const r = await testOemPipeline({
                make: getMakeForApi() || 'UNKNOWN',
                model: model || undefined,
                year: year ? Number(year) : undefined,
                part: partDesc.trim(),
                vin: vin || undefined,
                motorcode: engineCode || undefined,
            });
            setResult(r);
            if (r.result?.bestOem) {
                toast.success(`OEM gefunden: ${r.result.bestOem}`);
            } else {
                toast.error('Keine OEM-Nummer gefunden');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Pipeline-Test fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    }, [make, model, year, engine, vin, partDesc]);

    const resetAll = () => {
        setMake(''); setModel(''); setYear(''); setEngine('');
        setVin(''); setPartDesc(''); setResult(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">OEM Pipeline Playground</h2>
                        <p className="text-xs text-muted-foreground">Hydra v2 + Pattern Decoder · Identisch zum Live-Demo Bot</p>
                    </div>
                </div>
                <Button variant="outline" className="rounded-xl text-xs" onClick={resetAll}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Zurücksetzen
                </Button>
            </div>

            {/* Main Card */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 space-y-5">
                    {/* Step 1: Vehicle Selection */}
                    <div className="flex items-center gap-2 text-sm">
                        <Car className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">Schritt 1: Fahrzeug identifizieren</span>
                    </div>

                    {/* VIN Field (optional) */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">VIN/FIN (optional — überschreibt Dropdown)</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono"
                            placeholder="z.B. WBAPH5C55BA123456"
                            value={vin}
                            onChange={e => setVin(e.target.value.toUpperCase())}
                            maxLength={17}
                        />
                    </div>

                    {/* Cascading Dropdowns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Make */}
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer"
                                value={make}
                                onChange={e => { setMake(e.target.value); setModel(''); setYear(''); setEngine(''); }}
                            >
                                <option value="">Marke…</option>
                                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Model */}
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer disabled:opacity-30"
                                value={model}
                                onChange={e => { setModel(e.target.value); setYear(''); setEngine(''); }}
                                disabled={!make}
                            >
                                <option value="">Modell…</option>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Year */}
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer disabled:opacity-30"
                                value={year}
                                onChange={e => { setYear(e.target.value); setEngine(''); }}
                                disabled={!model}
                            >
                                <option value="">Baujahr…</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Engine */}
                        <div className="relative">
                            <select
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-sm appearance-none cursor-pointer disabled:opacity-30"
                                value={engine}
                                onChange={e => setEngine(e.target.value)}
                                disabled={!year}
                            >
                                <option value="">Motor…</option>
                                {engines.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Vehicle Badge */}
                    {make && model && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold">{make} {model}</div>
                                <div className="text-xs text-muted-foreground">
                                    {year && year}{engine && ` · ${engine}`}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teil angeben</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    {/* Step 2: Part Input */}
                    <div className="flex items-center gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold">Schritt 2: Ersatzteil</span>
                    </div>

                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm"
                            placeholder="z.B. Bremsscheibe vorne, Ölfilter, Klimakompressor…"
                            value={partDesc}
                            onChange={e => setPartDesc(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Quick Part Buttons */}
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Schnellauswahl:</div>
                        <div className="flex gap-1.5 flex-wrap">
                            {QUICK_PARTS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPartDesc(p)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        partDesc === p
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        className="w-full rounded-xl py-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg text-sm font-bold"
                        onClick={handleSearch}
                        disabled={loading || !partDesc.trim()}
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Hydra analysiert…</>
                        ) : (
                            <><Zap className="w-4 h-4 mr-2" /> OEM-Nummer ermitteln (Hydra v2 Pipeline)</>
                        )}
                    </Button>
                </div>
            </div>

            {/* ═══ RESULTS ═══ */}
            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Main Result Card */}
                    <div className={`rounded-3xl p-6 border-2 ${
                        result.result?.bestOem
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                            : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                    }`}>
                        {result.result?.bestOem ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1">OEM-Nummer gefunden</div>
                                        <div className="text-4xl font-mono font-black tracking-wider text-foreground">{result.result.bestOem}</div>
                                        <div className="flex gap-4 mt-3 text-sm flex-wrap">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Timer className="w-3.5 h-3.5" /> {result.elapsed}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Cpu className="w-3.5 h-3.5" /> {result.result.resolvedBy}
                                            </span>
                                            <span className={`font-bold ${
                                                result.result.confidence >= 0.9 ? 'text-emerald-600' :
                                                result.result.confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {Math.round(result.result.confidence * 100)}% Confidence
                                            </span>
                                            {result.result.needsConfirmation && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Bestätigung empfohlen</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <XCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
                                <div>
                                    <div className="font-bold text-red-700 dark:text-red-400 text-lg mb-1">Keine OEM-Nummer gefunden</div>
                                    <div className="text-sm text-muted-foreground">Hydra konnte keine passende Nummer finden. ({result.elapsed})</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trace Toggle */}
                    <button
                        onClick={() => setShowTrace(!showTrace)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTrace ? 'rotate-180' : ''}`} />
                        {showTrace ? 'Pipeline-Trace ausblenden' : 'Pipeline-Trace anzeigen'}
                    </button>

                    {showTrace && (
                        <div className="space-y-4">
                            {/* Pattern Decoder + Validation */}
                            {result.patternDecoder && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Pattern Decoder */}
                                    <div className="bg-card border border-border rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-sm">Pattern Decoder</span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-muted-foreground">Marke:</span><span className="font-medium">{result.patternDecoder.brand}</span></div>
                                            {result.patternDecoder.partGroup && <div className="flex justify-between"><span className="text-muted-foreground">Teilegruppe:</span><span className="font-mono font-medium">{result.patternDecoder.partGroup}</span></div>}
                                            {result.patternDecoder.position && result.patternDecoder.position !== 'unspecified' && (
                                                <div className="flex justify-between"><span className="text-muted-foreground">Position:</span><span className="font-medium">{result.patternDecoder.position === 'front' ? '🔵 Vorne' : result.patternDecoder.position === 'rear' ? '🔴 Hinten' : result.patternDecoder.position}</span></div>
                                            )}
                                            {result.patternDecoder.platform && <div className="flex justify-between"><span className="text-muted-foreground">Plattform:</span><span className="font-medium">{result.patternDecoder.platform}</span></div>}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Decode-Confidence:</span>
                                                <span className={`font-bold ${result.patternDecoder.decodeConfidence >= 0.8 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                                    {Math.round(result.patternDecoder.decodeConfidence * 100)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 mt-2">{result.patternDecoder.explanation}</div>
                                        </div>
                                    </div>

                                    {/* Validation */}
                                    {result.validation && (
                                        <div className={`border rounded-2xl p-5 ${
                                            result.validation.isHallucination
                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                {result.validation.isHallucination ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                                                <span className="font-bold text-sm">{result.validation.isHallucination ? '🚫 Hallucination erkannt!' : '✅ Validierung bestanden'}</span>
                                            </div>
                                            <p className="text-sm">{result.validation.reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Brand Intelligence */}
                            {result.brandIntelligence && (
                                <div className="bg-card border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        <span className="font-bold text-sm">Brand Intelligence — {result.brandIntelligence.brand}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">OEM-Format</div>
                                            <div className="text-xs">{result.brandIntelligence.oemFormat}</div>
                                            <div className="text-xs text-muted-foreground mt-1">z.B. {result.brandIntelligence.examples?.join(', ')}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Katalog-Quellen</div>
                                            <div className="flex flex-wrap gap-1">
                                                {result.brandIntelligence.catalogUrls?.map((u: string) => (
                                                    <span key={u} className="text-xs bg-muted px-2 py-0.5 rounded-full">{u}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {result.brandIntelligence.partSharingGroup && (
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Teile-Sharing</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.brandIntelligence.partSharingGroup.map((g: string) => (
                                                        <span key={g} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{g}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* All Candidates */}
                            {result.result?.allCandidates?.length > 0 && (
                                <div className="bg-card border border-border rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-sm">Alle Kandidaten ({result.result.allCandidates.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {result.result.allCandidates.map((c: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-muted/20 rounded-xl px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                        i === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-muted text-muted-foreground'
                                                    }`}>#{i + 1}</span>
                                                    <span className="font-mono font-bold">{c.oem}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{c.source}</span>
                                                    <span className={`text-xs font-bold ${
                                                        c.confidence >= 0.9 ? 'text-emerald-500' :
                                                        c.confidence >= 0.7 ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>{Math.round(c.confidence * 100)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
