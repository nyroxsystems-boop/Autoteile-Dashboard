import { useState, useEffect } from 'react';
import { Star, Plus, Clock, Truck, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { wawiService } from '../../services/wawiService';

export function SupplierRatingView() {
    const [ratings, setRatings] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        supplier: '', period: '', orders_total: 0, orders_on_time: 0, orders_late: 0,
        avg_delivery_days: 0, quality_score: 0, return_rate: 0, communication_score: 0, notes: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [r, s] = await Promise.all([
                wawiService.getSupplierRatings(),
                wawiService.getSuppliers(),
            ]);
            setRatings(r);
            setSuppliers(s);
        } catch { console.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const scoreColor = (score: number) =>
        score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-yellow-600' : 'text-red-500';

    const scoreBar = (score: number, max = 10) => (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(score / max) * 100}%` }} />
            </div>
            <span className={`text-xs font-bold ${scoreColor(score)}`}>{score}</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lieferanten-Bewertung</h1>
                    <p className="text-muted-foreground mt-2">Performance-Tracking nach Zeitraum mit gewichtetem Score.</p>
                </div>
                <Button className="rounded-xl" onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 mr-2" /> Neue Bewertung
                </Button>
            </div>

            {showCreate && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold">Neue Periode bewerten</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <select className="px-4 py-3 rounded-xl border border-border bg-background text-sm" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                            <option value="">Lieferant wählen</option>
                            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Periode (z.B. 2026-Q1)" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Bestellungen gesamt" value={form.orders_total || ''} onChange={e => setForm({ ...form, orders_total: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Pünktlich" value={form.orders_on_time || ''} onChange={e => setForm({ ...form, orders_on_time: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Verspätet" value={form.orders_late || ''} onChange={e => setForm({ ...form, orders_late: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Ø Liefertage" value={form.avg_delivery_days || ''} onChange={e => setForm({ ...form, avg_delivery_days: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Qualität (0-10)" value={form.quality_score || ''} onChange={e => setForm({ ...form, quality_score: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Retourenquote %" value={form.return_rate || ''} onChange={e => setForm({ ...form, return_rate: Number(e.target.value) })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Kommunikation (0-10)" value={form.communication_score || ''} onChange={e => setForm({ ...form, communication_score: Number(e.target.value) })} />
                        <Button className="rounded-xl" onClick={async () => {
                            if (!form.supplier || !form.period) { toast.error('Lieferant und Periode erforderlich'); return; }
                            try {
                                await wawiService.createSupplierRating({ ...form, supplier: Number(form.supplier) });
                                toast.success('Bewertung gespeichert');
                                setShowCreate(false);
                                loadData();
                            } catch { toast.error('Fehler'); }
                        }}>Speichern</Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Lade Bewertungen...</div>
            ) : ratings.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground italic shadow-sm">
                    <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    Noch keine Bewertungen vorhanden.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ratings.map((r: any) => (
                        <div key={r.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{r.supplier_name}</h3>
                                    <span className="text-xs text-muted-foreground">{r.period}</span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-bold ${scoreColor(Number(r.overall_score))}`}>{r.overall_score}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase">/ 10</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pünktlichkeit</span></div>
                                {scoreBar(r.orders_total > 0 ? (r.orders_on_time / r.orders_total) * 10 : 0)}

                                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Star className="w-3 h-3" /> Qualität</span></div>
                                {scoreBar(Number(r.quality_score))}

                                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Retourenquote</span></div>
                                {scoreBar(Math.max(0, 10 - Number(r.return_rate)))}

                                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Kommunikation</span></div>
                                {scoreBar(Number(r.communication_score))}
                            </div>

                            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <span>{r.orders_total} Bestellungen · {r.orders_on_time} pünktlich · {r.orders_late} verspätet</span>
                                <span>Ø {r.avg_delivery_days} Tage</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
