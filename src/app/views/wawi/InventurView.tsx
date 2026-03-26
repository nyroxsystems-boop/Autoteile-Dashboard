import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Search, AlertTriangle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useI18n } from '../../../i18n';
import { apiFetch } from '../../api/client';
import { toast } from 'sonner';

interface PartCount {
  id: string;
  part_id: string;
  part_name: string;
  oem_number: string;
  expected_qty: number;
  counted_qty: number;
  difference: number;
  counted_at?: string;
  notes?: string;
}

interface InventorySession {
  id: string;
  status: string;
  startedAt: string;
  startedBy?: string;
}

type Phase = 'idle' | 'counting' | 'review';

export function InventurView() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<InventorySession | null>(null);
  const [parts, setParts] = useState<{ id: string; name: string; oem_number: string; expected_qty: number; category: string }[]>([]);
  const [counts, setCounts] = useState<PartCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [countInput, setCountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  // Check for active session on mount
  const checkActive = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/inventory/active');
      if (data.active) {
        setSession(data.session);
        setCounts(data.counts || []);
        setPhase('counting');
      } else {
        setPhase('idle');
      }
    } catch { /* no active session */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { checkActive(); }, [checkActive]);

  const startInventory = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<any>('/api/inventory/start', { method: 'POST' });
      setSession(data.session);
      setParts(data.parts || []);
      setCounts([]);
      setPhase('counting');
      toast.success('Inventur gestartet');
    } catch (err: any) {
      toast.error(err?.message || 'Fehler beim Starten der Inventur');
    } finally { setLoading(false); }
  };

  const submitCount = async () => {
    if (!selectedPart || countInput === '') return;
    try {
      const result = await apiFetch<PartCount>('/api/inventory/count', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session?.id,
          part_id: selectedPart,
          counted_qty: parseInt(countInput),
          notes: noteInput || undefined,
        }),
      });

      setCounts(prev => {
        const existing = prev.findIndex(c => c.part_id === selectedPart);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = result;
          return updated;
        }
        return [...prev, result];
      });

      setSelectedPart(null);
      setCountInput('');
      setNoteInput('');
      toast.success(`${result.part_name}: ${result.counted_qty} gezählt (Diff: ${result.difference >= 0 ? '+' : ''}${result.difference})`);
    } catch {
      toast.error('Fehler beim Speichern der Zählung');
    }
  };

  const finalizeInventory = async () => {
    if (!session) return;
    try {
      const result = await apiFetch<any>('/api/inventory/finalize', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      });
      setPhase('review');
      toast.success(`Inventur abgeschlossen: ${result.summary.corrections} Korrekturen`);
    } catch {
      toast.error('Fehler beim Abschließen der Inventur');
    }
  };

  const cancelInventory = async () => {
    if (!session) return;
    try {
      await apiFetch('/api/inventory/cancel', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      });
      setSession(null);
      setCounts([]);
      setPhase('idle');
      toast.info('Inventur abgebrochen');
    } catch {
      toast.error('Fehler beim Abbrechen');
    }
  };

  const filteredParts = parts.filter(p =>
    searchTerm
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.oem_number?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const countedPartIds = new Set(counts.map(c => c.part_id));
  const uncountedParts = filteredParts.filter(p => !countedPartIds.has(p.id));
  const countedParts = filteredParts.filter(p => countedPartIds.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Lade Inventur...</div>
      </div>
    );
  }

  // ─── Phase: Idle ─────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              Inventur
            </h1>
            <p className="text-muted-foreground mt-1">Bestandsaufnahme und Korrekturbuchungen</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-20 text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Inventur starten</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Zählen Sie Ihren gesamten Lagerbestand. Abweichungen werden automatisch als Korrekturbuchungen verbucht und im Audit-Trail dokumentiert.
          </p>
          <Button onClick={startInventory} size="lg" className="bg-primary text-white rounded-xl px-10 py-6 text-lg font-bold">
            <ClipboardCheck className="w-5 h-5 mr-2" /> Inventur starten
          </Button>
        </div>
      </div>
    );
  }

  // ─── Phase: Review ───────────────────────────────────────────────────
  if (phase === 'review') {
    const withDiff = counts.filter(c => c.difference !== 0);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              Inventur abgeschlossen
            </h1>
            <p className="text-muted-foreground mt-1">{counts.length} Artikel gezählt, {withDiff.length} Korrekturen</p>
          </div>
          <Button variant="outline" onClick={() => { setPhase('idle'); setSession(null); setCounts([]); }} className="rounded-xl">
            <RotateCcw className="w-4 h-4 mr-2" /> Neue Inventur
          </Button>
        </div>

        {withDiff.length > 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-amber-500/10 border-b border-border">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Abweichungen ({withDiff.length})
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <th className="px-6 py-3">Artikel</th>
                  <th className="px-6 py-3 text-center">Erwartet</th>
                  <th className="px-6 py-3 text-center">Gezählt</th>
                  <th className="px-6 py-3 text-center">Differenz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withDiff.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{c.part_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.oem_number}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono">{c.expected_qty}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold">{c.counted_qty}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold font-mono px-3 py-1 rounded-lg ${
                        c.difference > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {c.difference > 0 ? '+' : ''}{c.difference}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {withDiff.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Keine Abweichungen</h3>
            <p className="text-muted-foreground">Ihr Lagerbestand stimmt perfekt überein.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Phase: Counting ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Inventur
          </h1>
          <p className="text-muted-foreground mt-1">
            {counts.length} von {parts.length} Artikeln gezählt
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={cancelInventory} className="rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10">
            <XCircle className="w-4 h-4 mr-2" /> Abbrechen
          </Button>
          <Button onClick={finalizeInventory} className="bg-primary text-white rounded-xl" disabled={counts.length === 0}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Abschließen ({counts.length})
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${parts.length > 0 ? (counts.length / parts.length) * 100 : 0}%` }}
        />
      </div>

      {/* Count Input */}
      {selectedPart && (
        <div className="bg-card border-2 border-primary rounded-2xl p-6 shadow-lg animate-in fade-in duration-300">
          <h3 className="font-bold mb-4 text-lg">
            {parts.find(p => p.id === selectedPart)?.name}
          </h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1 block">Gezählte Menge</label>
              <input
                type="number"
                min="0"
                autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-2xl font-mono font-bold text-center focus:ring-2 focus:ring-primary focus:outline-none"
                value={countInput}
                onChange={e => setCountInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitCount()}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1 block">Notiz (optional)</label>
              <input
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="z.B. beschädigt, falsch einsortiert..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitCount()}
              />
            </div>
            <Button onClick={submitCount} className="bg-primary text-white rounded-xl px-6 py-3" disabled={countInput === ''}>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Artikel suchen (Name oder OEM-Nr.)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Uncounted Parts */}
      {uncountedParts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-bold text-sm text-muted-foreground">NOCH NICHT GEZÄHLT ({uncountedParts.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {uncountedParts.map(part => (
              <button
                key={part.id}
                onClick={() => { setSelectedPart(part.id); setCountInput(''); }}
                className={`w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors flex items-center gap-4 ${
                  selectedPart === part.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                  {part.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{part.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{part.oem_number || '–'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-muted-foreground">Soll: {part.expected_qty}</div>
                  <div className="text-xs text-muted-foreground">{part.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already Counted */}
      {countedParts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-green-500/5">
            <h3 className="font-bold text-sm text-green-600">✅ GEZÄHLT ({countedParts.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {countedParts.map(part => {
              const count = counts.find(c => c.part_id === part.id);
              return (
                <button
                  key={part.id}
                  onClick={() => { setSelectedPart(part.id); setCountInput(String(count?.counted_qty || '')); }}
                  className="w-full text-left px-6 py-3 hover:bg-muted/30 transition-colors flex items-center gap-4 opacity-70"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <span className="text-sm">{part.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{count?.counted_qty}</span>
                    {count?.difference !== 0 && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        (count?.difference || 0) > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {(count?.difference || 0) > 0 ? '+' : ''}{count?.difference}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
