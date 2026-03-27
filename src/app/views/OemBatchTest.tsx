import { useState, useCallback, useRef } from 'react';
import {
    Pause, Trash2, Download, Upload, FileSpreadsheet, Loader2,
    CheckCircle2, XCircle, Clock, Zap, BarChart3, Play,
    AlertTriangle, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { testOemPipeline } from '../api/wws';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface BatchRow {
    id: string;
    make: string;
    model: string;
    year: string;
    motor: string;
    vin: string;
    part: string;
    oem: string | null;
    confidence: number | null;
    resolvedBy: string | null;
    elapsed: string | null;
    status: 'pending' | 'processing' | 'found' | 'not_found' | 'error';
    difficulty: 'easy' | 'medium' | 'hard' | 'exotic';
}

// ═══════════════════════════════════════════════════════════════════
// Pre-built Test Dataset — 30 rows, easy → exotic
// ═══════════════════════════════════════════════════════════════════

const PRESET_DATA: Omit<BatchRow, 'id' | 'oem' | 'confidence' | 'resolvedBy' | 'elapsed' | 'status'>[] = [
    // 🟢 EASY (10) — Common parts, popular cars
    { make: 'VW', model: 'Golf VII', year: '2017', motor: 'DFGA', vin: '', part: 'Bremsscheibe vorne', difficulty: 'easy' },
    { make: 'VW', model: 'Golf VII', year: '2016', motor: 'CRLB', vin: '', part: 'Ölfilter', difficulty: 'easy' },
    { make: 'BMW', model: '3er F30', year: '2016', motor: 'B47', vin: '', part: 'Bremsbelag vorne', difficulty: 'easy' },
    { make: 'BMW', model: '3er F30', year: '2017', motor: 'B47', vin: '', part: 'Luftfilter', difficulty: 'easy' },
    { make: 'MERCEDES', model: 'C-Klasse W205', year: '2016', motor: 'OM654', vin: '', part: 'Bremsscheibe hinten', difficulty: 'easy' },
    { make: 'AUDI', model: 'A4 B9', year: '2017', motor: 'DETA', vin: '', part: 'Ölfilter', difficulty: 'easy' },
    { make: 'OPEL', model: 'Astra K', year: '2017', motor: 'B14XFT', vin: '', part: 'Bremsbelag hinten', difficulty: 'easy' },
    { make: 'FORD', model: 'Focus IV', year: '2019', motor: 'M1DA', vin: '', part: 'Luftfilter', difficulty: 'easy' },
    { make: 'VW', model: 'Passat B8', year: '2017', motor: 'DFGA', vin: '', part: 'Bremsscheibe vorne', difficulty: 'easy' },
    { make: 'VW', model: 'Tiguan II', year: '2018', motor: 'DFGA', vin: '', part: 'Bremsbelag vorne', difficulty: 'easy' },

    // 🟡 MEDIUM (10) — Platform-specific, less common parts
    { make: 'BMW', model: '5er G30', year: '2018', motor: 'B57', vin: '', part: 'Turbolader', difficulty: 'medium' },
    { make: 'VW', model: 'Golf VII', year: '2015', motor: 'CHHB', vin: '', part: 'Kupplung', difficulty: 'medium' },
    { make: 'MERCEDES', model: 'E-Klasse W213', year: '2017', motor: 'OM654', vin: '', part: 'Stoßdämpfer vorne', difficulty: 'medium' },
    { make: 'AUDI', model: 'Q5 FY', year: '2018', motor: 'DTUA', vin: '', part: 'Querlenker vorne links', difficulty: 'medium' },
    { make: 'BMW', model: 'X3 G01', year: '2018', motor: 'B47', vin: '', part: 'Wasserpumpe', difficulty: 'medium' },
    { make: 'VW', model: 'Passat B8', year: '2016', motor: 'DFHA', vin: '', part: 'Lichtmaschine', difficulty: 'medium' },
    { make: 'OPEL', model: 'Insignia B', year: '2018', motor: 'B20DTH', vin: '', part: 'Klimakompressor', difficulty: 'medium' },
    { make: 'FORD', model: 'Kuga II', year: '2017', motor: 'T7CL', vin: '', part: 'Radlager vorne', difficulty: 'medium' },
    { make: 'MERCEDES', model: 'GLC X253', year: '2017', motor: 'OM654', vin: '', part: 'Thermostat', difficulty: 'medium' },
    { make: 'AUDI', model: 'A3 8V', year: '2016', motor: 'DFGA', vin: '', part: 'Spurstange', difficulty: 'medium' },

    // 🔴 HARD (5) — Niche parts, specific sub-assemblies
    { make: 'BMW', model: '3er F30', year: '2015', motor: 'N57', vin: '', part: 'Nockenwellensensor Einlass', difficulty: 'hard' },
    { make: 'VW', model: 'Golf VII', year: '2014', motor: 'CRLB', vin: '', part: 'AGR-Ventil', difficulty: 'hard' },
    { make: 'MERCEDES', model: 'C-Klasse W205', year: '2017', motor: 'M276', vin: '', part: 'Ansaugkrümmer', difficulty: 'hard' },
    { make: 'AUDI', model: 'A4 B9', year: '2016', motor: 'CVKB', vin: '', part: 'Steuerkettensatz', difficulty: 'hard' },
    { make: 'BMW', model: '5er G30', year: '2017', motor: 'B58', vin: '', part: 'Differentialsperre', difficulty: 'hard' },

    // 🟣 EXOTIC (5) — Rare models, unusual brands
    { make: 'PORSCHE', model: 'Macan 95B', year: '2019', motor: '', vin: '', part: 'Bremsscheibe vorne', difficulty: 'exotic' },
    { make: 'HYUNDAI', model: 'Tucson TL', year: '2017', motor: 'D4HA', vin: '', part: 'Turbolader', difficulty: 'exotic' },
    { make: 'TOYOTA', model: 'Corolla E210', year: '2019', motor: '2ZR-FXE', vin: '', part: 'Wasserpumpe', difficulty: 'exotic' },
    { make: 'RENAULT', model: 'Mégane IV', year: '2017', motor: 'K9K', vin: '', part: 'Klimakompressor', difficulty: 'exotic' },
    { make: 'TESLA', model: 'Model 3', year: '2019', motor: '', vin: '', part: 'Bremsbelag vorne', difficulty: 'exotic' },
];

function createId() {
    return `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function presetToRow(preset: typeof PRESET_DATA[number]): BatchRow {
    return {
        ...preset,
        id: createId(),
        oem: null,
        confidence: null,
        resolvedBy: null,
        elapsed: null,
        status: 'pending',
    };
}

// ═══════════════════════════════════════════════════════════════════
// CSV helpers (zero-dependency)
// ═══════════════════════════════════════════════════════════════════

function parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) { cells.push(current.trim()); current = ''; }
            else { current += ch; }
        }
        cells.push(current.trim());
        return cells;
    });
}

function rowsToCSV(rows: BatchRow[]): string {
    const header = 'Marke;Modell;Baujahr;Motor;VIN;Teil;OEM;Confidence;Status';
    const lines = rows.map(r =>
        [r.make, r.model, r.year, r.motor, r.vin, r.part, r.oem || '', r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '', r.status].join(';')
    );
    return [header, ...lines].join('\n');
}

function downloadCSV(content: string, filename: string) {
    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// DIFFICULTY BADGE
// ═══════════════════════════════════════════════════════════════════

function DifficultyBadge({ d }: { d: string }) {
    const cfg: Record<string, { bg: string; text: string; label: string }> = {
        easy: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: '🟢 Easy' },
        medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: '🟡 Medium' },
        hard: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: '🔴 Hard' },
        exotic: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: '🟣 Exotic' },
    };
    const c = cfg[d] || cfg.easy;
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
}

// ═══════════════════════════════════════════════════════════════════
// STATUS CELL
// ═══════════════════════════════════════════════════════════════════

function StatusCell({ status }: { status: BatchRow['status'] }) {
    switch (status) {
        case 'pending':
            return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Wartend</span>;
        case 'processing':
            return <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Analysiert…</span>;
        case 'found':
            return <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="w-3 h-3" /> Gefunden</span>;
        case 'not_found':
            return <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium"><XCircle className="w-3 h-3" /> Nicht gefunden</span>;
        case 'error':
            return <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-medium"><AlertTriangle className="w-3 h-3" /> Fehler</span>;
    }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function OemBatchTest() {
    const [rows, setRows] = useState<BatchRow[]>([]);
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const pauseRef = useRef(false);
    const abortRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const [currentIdx, setCurrentIdx] = useState(-1);

    // Stats
    const total = rows.length;
    const done = rows.filter(r => r.status === 'found' || r.status === 'not_found' || r.status === 'error').length;
    const found = rows.filter(r => r.status === 'found').length;
    const avgConf = rows.filter(r => r.confidence != null).reduce((s, r) => s + (r.confidence || 0), 0) / (rows.filter(r => r.confidence != null).length || 1);
    const avgTime = rows.filter(r => r.elapsed != null).reduce((s, r) => {
        const ms = parseInt(r.elapsed || '0');
        return s + (isNaN(ms) ? 0 : ms);
    }, 0) / (rows.filter(r => r.elapsed != null).length || 1);

    // Load preset
    const loadPreset = () => {
        setRows(PRESET_DATA.map(presetToRow));
        setCurrentIdx(-1);
        toast.success('30 Test-Zeilen geladen (Easy → Exotic)');
    };

    // Import CSV
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const parsed = parseCSV(text);

            // Find header row
            const headerIdx = parsed.findIndex(row =>
                row.some(c => /marke|make|brand/i.test(c))
            );
            const dataRows = headerIdx >= 0 ? parsed.slice(headerIdx + 1) : parsed.slice(1);

            // Map columns (flexible — try common names)
            const header = headerIdx >= 0 ? parsed[headerIdx].map(h => h.toLowerCase()) : [];
            const colIdx = {
                make: header.findIndex(h => /marke|make|brand/i.test(h)),
                model: header.findIndex(h => /modell|model/i.test(h)),
                year: header.findIndex(h => /baujahr|year|jahr/i.test(h)),
                motor: header.findIndex(h => /motor|engine|motorcode/i.test(h)),
                vin: header.findIndex(h => /vin|fin|fahrgestell/i.test(h)),
                part: header.findIndex(h => /teil|part|ersatzteil/i.test(h)),
            };

            // Default to positional if headers not found
            const get = (row: string[], key: keyof typeof colIdx, fallbackIdx: number) => {
                const idx = colIdx[key] >= 0 ? colIdx[key] : fallbackIdx;
                return (row[idx] || '').trim();
            };

            const imported: BatchRow[] = dataRows
                .filter(row => row.some(c => c.trim()))
                .map(row => ({
                    id: createId(),
                    make: get(row, 'make', 0),
                    model: get(row, 'model', 1),
                    year: get(row, 'year', 2),
                    motor: get(row, 'motor', 3),
                    vin: get(row, 'vin', 4),
                    part: get(row, 'part', 5),
                    oem: null,
                    confidence: null,
                    resolvedBy: null,
                    elapsed: null,
                    status: 'pending' as const,
                    difficulty: 'medium' as const,
                }));

            if (imported.length === 0) {
                toast.error('Keine gültigen Zeilen gefunden');
                return;
            }

            setRows(imported);
            setCurrentIdx(-1);
            toast.success(`${imported.length} Zeilen importiert`);
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Download template
    const downloadTemplate = () => {
        const csv = rowsToCSV(PRESET_DATA.map(presetToRow));
        downloadCSV(csv, 'oem_batch_test_template.csv');
        toast.success('Template heruntergeladen');
    };

    // Export results
    const exportResults = () => {
        const csv = rowsToCSV(rows);
        const ts = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        downloadCSV(csv, `oem_batch_ergebnis_${ts}.csv`);
        toast.success('Ergebnisse exportiert');
    };

    // Run batch
    const runBatch = useCallback(async () => {
        setRunning(true);
        setPaused(false);
        pauseRef.current = false;
        abortRef.current = false;

        for (let i = 0; i < rows.length; i++) {
            if (abortRef.current) break;

            // Skip already processed
            if (rows[i].status === 'found' || rows[i].status === 'not_found') continue;

            // Pause loop
            while (pauseRef.current && !abortRef.current) {
                await new Promise(r => setTimeout(r, 300));
            }
            if (abortRef.current) break;

            setCurrentIdx(i);

            // Mark processing
            setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r));

            // Scroll active row into view
            setTimeout(() => {
                const el = document.getElementById(`batch-row-${i}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);

            try {
                const row = rows[i];
                const r = await testOemPipeline({
                    make: row.make || 'UNKNOWN',
                    model: row.model || undefined,
                    year: row.year ? Number(row.year) : undefined,
                    part: row.part,
                    vin: row.vin || undefined,
                    motorcode: row.motor || undefined,
                });

                setRows(prev => prev.map((rr, idx) => idx === i ? {
                    ...rr,
                    oem: r.result?.bestOem || null,
                    confidence: r.result?.confidence ?? null,
                    resolvedBy: r.result?.resolvedBy || null,
                    elapsed: r.elapsed || null,
                    status: r.result?.bestOem ? 'found' : 'not_found',
                } : rr));
            } catch (err: any) {
                setRows(prev => prev.map((rr, idx) => idx === i ? {
                    ...rr,
                    status: 'error',
                    resolvedBy: err?.message?.slice(0, 50) || 'Pipeline error',
                } : rr));
            }

            // Small delay between requests to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        }

        setRunning(false);
        setCurrentIdx(-1);
        toast.success(`Batch abgeschlossen: ${rows.filter(r => r.status === 'found').length}/${rows.length} gefunden`);
    }, [rows]);

    const togglePause = () => {
        pauseRef.current = !pauseRef.current;
        setPaused(pauseRef.current);
    };

    const stopBatch = () => {
        abortRef.current = true;
        pauseRef.current = false;
        setRunning(false);
        setPaused(false);
    };

    const clearAll = () => {
        stopBatch();
        setRows([]);
        setCurrentIdx(-1);
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-wrap gap-2">
                    {/* Load Preset */}
                    <Button
                        variant="outline"
                        className="rounded-xl text-xs gap-1.5"
                        onClick={loadPreset}
                        disabled={running}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        30 Test-Datensätze laden
                    </Button>

                    {/* Separator */}
                    <div className="w-px bg-border mx-1" />

                    {/* Import CSV */}
                    <Button
                        variant="outline"
                        className="rounded-xl text-xs gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={running}
                    >
                        <Upload className="w-3.5 h-3.5" />
                        CSV importieren
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt,.tsv"
                        onChange={handleImport}
                        className="hidden"
                    />

                    {/* Download Template */}
                    <Button
                        variant="outline"
                        className="rounded-xl text-xs gap-1.5"
                        onClick={downloadTemplate}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Vorlage herunterladen
                    </Button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Controls */}
                    {rows.length > 0 && !running && (
                        <Button
                            className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg"
                            onClick={runBatch}
                        >
                            <Play className="w-3.5 h-3.5" />
                            ▶️ Alle starten ({rows.filter(r => r.status === 'pending').length} ausstehend)
                        </Button>
                    )}

                    {running && (
                        <>
                            <Button
                                variant="outline"
                                className={`rounded-xl text-xs gap-1.5 ${paused ? 'border-yellow-400 text-yellow-600' : ''}`}
                                onClick={togglePause}
                            >
                                <Pause className="w-3.5 h-3.5" />
                                {paused ? 'Fortsetzen' : 'Pause'}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                                onClick={stopBatch}
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Stopp
                            </Button>
                        </>
                    )}

                    {rows.length > 0 && done > 0 && (
                        <Button
                            variant="outline"
                            className="rounded-xl text-xs gap-1.5"
                            onClick={exportResults}
                        >
                            <Download className="w-3.5 h-3.5" />
                            Ergebnisse exportieren
                        </Button>
                    )}

                    {rows.length > 0 && !running && (
                        <Button
                            variant="outline"
                            className="rounded-xl text-xs gap-1.5 border-red-200 text-red-500 hover:bg-red-50"
                            onClick={clearAll}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Löschen
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress / Summary Banner */}
            {rows.length > 0 && (
                <div className={`rounded-2xl border-2 p-4 transition-all duration-500 ${
                    running
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                        : done === total && total > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                            : 'bg-card border-border'
                }`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6">
                            {/* Progress */}
                            <div className="flex items-center gap-3">
                                {running ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : done === total && total > 0 ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                )}
                                <div>
                                    <div className="text-sm font-bold">
                                        {running ? `Verarbeite ${currentIdx + 1}/${total}…` : done === total && total > 0 ? 'Batch abgeschlossen' : `${total} Zeilen bereit`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {done}/{total} verarbeitet
                                        {paused && ' · ⏸️ Pausiert'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            {done > 0 && (
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <CheckCircle2 className="w-3 h-3" /> {found} gefunden
                                    </span>
                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                        <XCircle className="w-3 h-3" /> {done - found} nicht
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Zap className="w-3 h-3" /> Ø {Math.round(avgConf * 100)}%
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="w-3 h-3" /> Ø {Math.round(avgTime)}ms
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {total > 0 && (
                            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${(done / total) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {rows.length === 0 && (
                <div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center">
                    <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Noch keine Testdaten geladen</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        Lade die vorbereiteten 30 Test-Datensätze (Easy → Exotic) oder importiere deine eigene CSV-Datei mit Fahrzeugdaten.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Button
                            className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                            onClick={loadPreset}
                        >
                            <Sparkles className="w-4 h-4" />
                            30 Test-Datensätze laden
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4" />
                            CSV importieren
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4">
                        CSV-Format: Marke;Modell;Baujahr;Motor;VIN;Teil (Semikolon-getrennt, UTF-8)
                    </p>
                </div>
            )}

            {/* ═══ TABLE ═══ */}
            {rows.length > 0 && (
                <div ref={tableRef} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">#</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schwierigk.</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marke</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modell</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bj.</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Motor</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ersatzteil</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-w-[140px]">OEM-Nummer</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conf.</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Zeit</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        id={`batch-row-${i}`}
                                        className={`
                                            border-b border-border/50 transition-all duration-500
                                            ${row.status === 'processing'
                                                ? 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 ring-inset animate-pulse'
                                                : row.status === 'found'
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10'
                                                    : row.status === 'not_found'
                                                        ? 'bg-red-50/30 dark:bg-red-950/10'
                                                        : row.status === 'error'
                                                            ? 'bg-orange-50/30 dark:bg-orange-950/10'
                                                            : 'hover:bg-muted/30'
                                            }
                                        `}
                                        style={{
                                            animationDelay: row.status === 'found' || row.status === 'not_found' ? `${i * 50}ms` : undefined,
                                        }}
                                    >
                                        <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{i + 1}</td>
                                        <td className="px-3 py-2.5"><DifficultyBadge d={row.difficulty} /></td>
                                        <td className="px-3 py-2.5 font-bold text-xs">{row.make}</td>
                                        <td className="px-3 py-2.5 text-xs">{row.model}</td>
                                        <td className="px-3 py-2.5 text-xs font-mono">{row.year}</td>
                                        <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{row.motor || '—'}</td>
                                        <td className="px-3 py-2.5 text-xs font-medium">{row.part}</td>
                                        <td className="px-3 py-2.5">
                                            {row.oem ? (
                                                <span className="font-mono font-black text-sm tracking-wide text-foreground animate-in fade-in duration-700">
                                                    {row.oem}
                                                </span>
                                            ) : row.status === 'processing' ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '200ms' }} />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '400ms' }} />
                                                </span>
                                            ) : row.status === 'not_found' ? (
                                                <span className="text-xs text-red-400 italic">—</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/40">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {row.confidence != null ? (
                                                <span className={`text-xs font-bold ${
                                                    row.confidence >= 0.9 ? 'text-emerald-500' :
                                                    row.confidence >= 0.7 ? 'text-yellow-500' : 'text-red-500'
                                                }`}>
                                                    {Math.round(row.confidence * 100)}%
                                                </span>
                                            ) : <span className="text-xs text-muted-foreground/30">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                                            {row.elapsed || '—'}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusCell status={row.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>{total} Zeilen · {done} verarbeitet</span>
                        {found > 0 && (
                            <span className="font-bold text-emerald-600">
                                Erfolgsrate: {Math.round((found / Math.max(done, 1)) * 100)}%
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
