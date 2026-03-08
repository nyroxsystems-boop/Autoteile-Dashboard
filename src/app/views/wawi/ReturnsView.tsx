import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, PackageCheck, CreditCard, XCircle, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { wawiService } from '../../services/wawiService';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    requested: { label: 'Angefragt', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: RotateCcw },
    approved: { label: 'Genehmigt', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
    received: { label: 'Empfangen', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: PackageCheck },
    refunded: { label: 'Erstattet', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CreditCard },
    rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export function ReturnsView() {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ product: '', quantity: 1, reason: '', notes: '' });

    useEffect(() => { loadReturns(); }, [filter]);

    const loadReturns = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getReturns(filter || undefined);
            setReturns(data);
        } catch { console.error('Failed to load returns'); }
        finally { setLoading(false); }
    };

    const handleAction = async (id: number, action: string) => {
        try {
            if (action === 'approve') await wawiService.approveReturn(id);
            if (action === 'receive') await wawiService.receiveReturn(id, true);
            if (action === 'refund') await wawiService.refundReturn(id, undefined, true);
            if (action === 'reject') await wawiService.rejectReturn(id);
            toast.success(`Retoure ${action === 'approve' ? 'genehmigt' : action === 'receive' ? 'empfangen' : action === 'refund' ? 'erstattet' : 'abgelehnt'}`);
            loadReturns();
        } catch { toast.error('Aktion fehlgeschlagen'); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Retouren</h1>
                    <p className="text-muted-foreground mt-2">Retourenmanagement mit Workflow und Gutschriften.</p>
                </div>
                <Button className="rounded-xl" onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 mr-2" /> Neue Retoure
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {['', 'requested', 'approved', 'received', 'refunded', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        {f === '' ? 'Alle' : STATUS_MAP[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold">Neue Retoure anlegen</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Produkt-ID" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
                        <input type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Menge" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                        <input className="px-4 py-3 rounded-xl border border-border bg-background text-sm" placeholder="Grund *" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                        <Button className="rounded-xl" onClick={async () => {
                            if (!form.reason) { toast.error('Grund erforderlich'); return; }
                            try {
                                await wawiService.createReturn({ product: Number(form.product) || undefined, quantity: form.quantity, reason: form.reason, notes: form.notes });
                                toast.success('Retoure angelegt');
                                setShowCreate(false);
                                loadReturns();
                            } catch { toast.error('Fehler'); }
                        }}>Anlegen</Button>
                    </div>
                </div>
            )}

            {/* Returns List */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse">Lade Retouren...</div>
                ) : returns.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic">Keine Retouren gefunden.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {returns.map((ret: any) => {
                            const st = STATUS_MAP[ret.status] || STATUS_MAP.requested;
                            const StIcon = st.icon;
                            return (
                                <div key={ret.id} className="p-5 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${st.color}`}>
                                                <StIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    Retoure #{ret.id} — {ret.product_name || ret.product_ipn || 'Unbekannt'}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {ret.quantity}x · {ret.reason} {ret.contact_name && `· ${ret.contact_name}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${st.color}`}>{st.label}</span>
                                            {ret.status === 'requested' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleAction(ret.id, 'approve')}>Genehmigen</Button>
                                                    <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleAction(ret.id, 'reject')}>Ablehnen</Button>
                                                </>
                                            )}
                                            {ret.status === 'approved' && (
                                                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleAction(ret.id, 'receive')}>Empfangen + Einlagern</Button>
                                            )}
                                            {ret.status === 'received' && (
                                                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleAction(ret.id, 'refund')}>Erstatten + Gutschrift</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
