import { useState, useEffect, useCallback, useRef } from 'react';
import {
    RefreshCw, Car, Wrench, Zap, CheckCircle2, XCircle,
    ChevronDown, Shield, ShieldAlert, ShieldCheck, Cpu, Globe, Timer, Info, Sparkles, Loader2,
    Upload, FileText, X, Camera, ToggleRight, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { testOemPipeline, getOemVehicles, OemVehiclesData, scanFahrzeugschein, FahrzeugscheinResult, lookupPartsLink24, PartsLink24Result, getPartsLink24Health } from '../api/wws';
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

    // Fahrzeugschein scan state
    const [scanning, setScanning] = useState(false);
    const [scannedVehicle, setScannedVehicle] = useState<FahrzeugscheinResult['vehicle'] | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PartsLink24 toggle
    const [usePartsLink, setUsePartsLink] = useState(false);
    const [pl24Health, setPl24Health] = useState<{ status: string; browser: { running: boolean } } | null>(null);
    const [pl24Result, setPl24Result] = useState<PartsLink24Result | null>(null);

    // Results
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showTrace, setShowTrace] = useState(true);

    // Check PL24 health when toggle is enabled
    useEffect(() => {
        if (usePartsLink) {
            getPartsLink24Health().then(setPl24Health).catch(() => setPl24Health(null));
        }
    }, [usePartsLink]);

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
        if (scannedVehicle?.make) return scannedVehicle.make;
        if (make === 'Volkswagen') return 'VW';
        if (make === 'Mercedes-Benz') return 'MERCEDES';
        return make.toUpperCase();
    };

    // ── Fahrzeugschein Upload Handlers ─────────────────────────────────
    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Nur Bilddateien (JPG, PNG) erlaubt');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Bild zu groß (max 10MB)');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            setPreview(base64);
            setScanning(true);
            setScannedVehicle(null);

            try {
                const result = await scanFahrzeugschein(base64);
                if (result.success && result.vehicle) {
                    setScannedVehicle(result.vehicle);

                    // Auto-fill form fields from scan
                    if (result.vehicle.vin) setVin(result.vehicle.vin);
                    if (result.vehicle.make) {
                        // Map VOLKSWAGEN back to display name
                        const makeMap: Record<string, string> = {
                            'VOLKSWAGEN': 'Volkswagen', 'BMW': 'BMW', 'AUDI': 'Audi',
                            'MERCEDES-BENZ': 'Mercedes-Benz', 'OPEL': 'Opel', 'FORD': 'Ford',
                            'HYUNDAI': 'Hyundai', 'TOYOTA': 'Toyota', 'RENAULT': 'Renault',
                            'PORSCHE': 'Porsche', 'TESLA': 'Tesla',
                        };
                        const displayMake = makeMap[result.vehicle.make.toUpperCase()] || result.vehicle.make;
                        if (MAKES.includes(displayMake)) {
                            setMake(displayMake);
                        }
                    }

                    toast.success(`Fahrzeugschein erkannt: ${result.vehicle.make} ${result.vehicle.model || ''} (${result.elapsed})`);
                } else {
                    toast.error('Keine Fahrzeugdaten erkannt');
                }
            } catch (err: any) {
                toast.error(err?.message || 'Fahrzeugschein-Scan fehlgeschlagen');
            } finally {
                setScanning(false);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragActive(false), []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const clearScan = useCallback(() => {
        setScannedVehicle(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    // Search
    const handleSearch = useCallback(async () => {
        if (!partDesc.trim()) {
            toast.error('Bitte ein Ersatzteil eingeben');
            return;
        }
        setLoading(true);
        setResult(null);
        setPl24Result(null);

        // ── PartsLink24 Mode ──
        if (usePartsLink) {
            const vinValue = vin || scannedVehicle?.vin;
            if (!vinValue) {
                toast.error('PartsLink24 benötigt eine VIN/Fahrgestellnummer');
                setLoading(false);
                return;
            }
            try {
                const r = await lookupPartsLink24({
                    vin: vinValue,
                    part: partDesc.trim(),
                    brand: getMakeForApi() || undefined,
                });
                setPl24Result(r);
                if (r.success && r.results.length > 0) {
                    toast.success(`PartsLink24: ${r.results.length} OEM-Nummern gefunden`);
                } else {
                    toast.error(r.error || 'Keine Ergebnisse von PartsLink24');
                }
            } catch (err: any) {
                toast.error(err?.message || 'PartsLink24-Abfrage fehlgeschlagen');
            } finally {
                setLoading(false);
            }
            return;
        }

        // ── Hydra AI Mode (default) ──
        try {
            const engineCode = engine.match(/\(([^,]+)/)?.[1] || scannedVehicle?.motorcode || '';
            const r = await testOemPipeline({
                make: getMakeForApi() || 'UNKNOWN',
                model: scannedVehicle?.model || model || undefined,
                year: scannedVehicle?.year || (year ? Number(year) : undefined),
                part: partDesc.trim(),
                vin: vin || scannedVehicle?.vin || undefined,
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
    }, [make, model, year, engine, vin, partDesc, scannedVehicle, usePartsLink]);

    const resetAll = () => {
        setMake(''); setModel(''); setYear(''); setEngine('');
        setVin(''); setPartDesc(''); setResult(null); setPl24Result(null);
        clearScan();
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

                    {/* ── Fahrzeugschein Upload Zone ─────────────── */}
                    <div
                        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                                : scanning
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                                : scannedVehicle
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                                : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="fahrzeugschein-upload"
                        />

                        {scanning ? (
                            /* Scanning Animation */
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Camera className="w-7 h-7 text-amber-600 animate-pulse" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Gemini Vision analysiert…</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Fahrzeugdaten werden extrahiert</p>
                                </div>
                            </div>
                        ) : scannedVehicle ? (
                            /* Scanned Result */
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Preview Thumbnail */}
                                    {preview && (
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={preview}
                                                alt="Fahrzeugschein"
                                                className="w-20 h-20 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800"
                                            />
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                ✅ Fahrzeugschein erkannt
                                            </span>
                                            <button onClick={clearScan} className="ml-auto p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="text-lg font-bold mb-2">
                                            {scannedVehicle.make} {scannedVehicle.model}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                                            {scannedVehicle.year && (
                                                <div><span className="text-muted-foreground">Baujahr:</span> <span className="font-medium">{scannedVehicle.month ? `${scannedVehicle.month}/${scannedVehicle.year}` : scannedVehicle.year}</span></div>
                                            )}
                                            {scannedVehicle.vin && (
                                                <div className="col-span-2"><span className="text-muted-foreground">VIN:</span> <span className="font-mono font-medium">{scannedVehicle.vin}</span></div>
                                            )}
                                            {scannedVehicle.hsn && scannedVehicle.tsn && (
                                                <div><span className="text-muted-foreground">HSN/TSN:</span> <span className="font-mono font-medium">{scannedVehicle.hsn}/{scannedVehicle.tsn}</span></div>
                                            )}
                                            {scannedVehicle.motorcode && (
                                                <div><span className="text-muted-foreground">Motorcode:</span> <span className="font-mono font-medium">{scannedVehicle.motorcode}</span></div>
                                            )}
                                            {scannedVehicle.kw && (
                                                <div><span className="text-muted-foreground">Leistung:</span> <span className="font-medium">{scannedVehicle.kw} kW ({Math.round(scannedVehicle.kw * 1.36)} PS)</span></div>
                                            )}
                                            {scannedVehicle.displacement && (
                                                <div><span className="text-muted-foreground">Hubraum:</span> <span className="font-medium">{scannedVehicle.displacement} ccm</span></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Upload Zone */
                            <label htmlFor="fahrzeugschein-upload" className="flex flex-col items-center justify-center py-6 cursor-pointer gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">
                                        <span className="text-blue-600 dark:text-blue-400">Fahrzeugschein hochladen</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Foto ziehen oder klicken · JPG/PNG · Gemini Vision extrahiert alle Fahrzeugdaten
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <FileText className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Zulassungsbescheinigung Teil I</span>
                                </div>
                            </label>
                        )}
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">oder manuell</span>
                        <div className="flex-1 border-t border-border" />
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

                    {/* Vehicle Badge (from scan or manual) */}
                    {(scannedVehicle || (make && model)) && !scannedVehicle && (
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

                    {/* ── PartsLink24 Toggle ── */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                usePartsLink
                                    ? 'bg-amber-100 dark:bg-amber-900/30'
                                    : 'bg-muted/50'
                            }`}>
                                <ExternalLink className={`w-4 h-4 ${
                                    usePartsLink ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                                }`} />
                            </div>
                            <div>
                                <div className="text-sm font-bold">PartsLink24 Katalog</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {usePartsLink
                                        ? pl24Health?.status === 'healthy'
                                            ? '✅ Service verbunden · Echte OEM-Daten'
                                            : pl24Health === null
                                                ? '⏳ Verbindung prüfen…'
                                                : '⚠️ Service nicht erreichbar'
                                        : 'Statt Hydra AI direkt im PL24-Katalog nachschlagen (VIN nötig)'
                                    }
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setUsePartsLink(!usePartsLink)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${
                                usePartsLink ? 'bg-amber-500' : 'bg-muted'
                            }`}
                        >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                usePartsLink ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                    </div>

                    {/* VIN Warning for PartsLink Mode */}
                    {usePartsLink && !vin && !scannedVehicle?.vin && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-2.5 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>PartsLink24 benötigt eine VIN/Fahrgestellnummer — bitte oben eingeben oder Fahrzeugschein scannen</span>
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        className={`w-full rounded-xl py-6 shadow-lg text-sm font-bold text-white ${
                            usePartsLink
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                        }`}
                        onClick={handleSearch}
                        disabled={loading || !partDesc.trim() || (usePartsLink && !vin && !scannedVehicle?.vin)}
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {usePartsLink ? 'PartsLink24 sucht…' : 'Hydra analysiert…'}</>
                        ) : usePartsLink ? (
                            <><ExternalLink className="w-4 h-4 mr-2" /> OEM via PartsLink24 Katalog nachschlagen</>
                        ) : (
                            <><Zap className="w-4 h-4 mr-2" /> OEM-Nummer ermitteln (Hydra v2 Pipeline)</>
                        )}
                    </Button>
                </div>
            </div>

            {/* ═══ PARTSLINK24 RESULTS ═══ */}
            {pl24Result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`rounded-3xl p-6 border-2 ${
                        pl24Result.success && pl24Result.results.length > 0
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                            : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                    }`}>
                        {pl24Result.success && pl24Result.results.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                        <ExternalLink className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                                            PartsLink24 · {pl24Result.results.length} Ergebnisse
                                            {pl24Result.fromCache && <span className="ml-2 text-muted-foreground">(Cache)</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {pl24Result.elapsedMs && `${(pl24Result.elapsedMs / 1000).toFixed(1)}s`}
                                            {' · VIN: '}{pl24Result.vin}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {pl24Result.results.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-card rounded-2xl px-5 py-4 border border-amber-200 dark:border-amber-800 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                                    i === 0
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>#{i + 1}</span>
                                                <div>
                                                    <div className="font-mono font-black text-lg tracking-wider">{r.oem}</div>
                                                    <div className="text-sm text-muted-foreground">{r.description}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                                                {r.bildtafel && <span>Bildtafel: {r.bildtafel}</span>}
                                                {r.hg && r.fg && <span>HG {r.hg} / FG {r.fg}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <XCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
                                <div>
                                    <div className="font-bold text-red-700 dark:text-red-400 text-lg mb-1">Keine Ergebnisse</div>
                                    <div className="text-sm text-muted-foreground">{pl24Result.error || 'PartsLink24 hat keine Treffer gefunden.'}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ HYDRA AI RESULTS ═══ */}
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
