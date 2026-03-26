import { useState, useEffect } from 'react';
import {
    Brain, TrendingUp, AlertTriangle, RefreshCw, ChevronDown,
    ChevronUp, DollarSign, Search, Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService } from '../../services/wawiService';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

interface BriefingProduct { name: string; sold: number }
interface Briefing {
    orders?: { today: number };
    revenue?: { today: number };
    inventory?: { low_stock_alerts: number };
    returns?: { open: number };
    top_products?: BriefingProduct[];
    briefing_text?: string;
}
interface ReorderSuggestion {
    product?: { name: string; IPN: string };
    urgency: string;
    reorder_quantity: number;
    days_of_stock_remaining: number;
    daily_rate: number;
    suggested_supplier?: { name: string; price: number; lead_time_days: number };
    estimated_cost?: number;
}
interface ReorderData {
    suggestions: ReorderSuggestion[];
    lookback_days: number;
    forecast_days: number;
    total_estimated_cost?: number;
}
interface PriceOptItem {
    product?: { name: string; IPN: string };
    current_price: number;
    suggested_price: number;
    price_change_pct: number;
    action: 'increase' | 'decrease';
    current_margin_pct: number;
    new_margin_pct: number;
    reason: string;
}
interface AnomalyItem {
    product?: { name: string; IPN: string };
    movement_type: 'OUT' | 'IN';
    severity: 'high' | 'medium' | 'low';
    deviation_factor: number;
    recent_daily_qty: number;
    historical_daily_avg: number;
    possible_causes?: string[];
}
interface AnomalyData { total_anomalies: number; anomalies: AnomalyItem[] }
interface OemResult {
    product?: { name: string; IPN: string };
    match_type: string;
    matched_number: string;
    matched_brand?: string;
    confidence: number;
}

export function AIInsightsView() {
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const { t } = useI18n();
    const [reorder, setReorder] = useState<ReorderData | null>(null);
    const [priceOpt, setPriceOpt] = useState<PriceOptItem[]>([]);
    const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
    const [oemQuery, setOemQuery] = useState('');
    const [oemResults, setOemResults] = useState<OemResult[]>([]);
    const [loading, setLoading] = useState({ briefing: true, reorder: false, priceOpt: false, anomaly: false, oem: false });
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ briefing: true, reorder: false, price: false, anomaly: false });

    useEffect(() => { loadBriefing(); }, []);

    const loadBriefing = async () => {
        setLoading(l => ({ ...l, briefing: true }));
        try {
            const data = await wawiService.getBriefing();
            setBriefing(data as Briefing);
        } catch (err) {
            console.error('Briefing load failed:', err);
            toast.error(t('error_load_insights'));
        }
        finally { setLoading(l => ({ ...l, briefing: false })); }
    };

    const loadReorder = async () => {
        setLoading(l => ({ ...l, reorder: true }));
        try {
            const data = await wawiService.getSmartReorder(90, 30);
            setReorder(data as unknown as ReorderData);
        } catch (err) {
            console.error('Reorder load failed:', err);
            toast.error(t('error_load_insights'));
        }
        finally { setLoading(l => ({ ...l, reorder: false })); }
    };

    const loadPriceOpt = async () => {
        setLoading(l => ({ ...l, priceOpt: true }));
        try {
            const data = await wawiService.getPriceOptimization() as unknown as PriceOptItem[];
            setPriceOpt(data);
        } catch (err) {
            console.error('Price opt load failed:', err);
            toast.error(t('error_load_insights'));
        }
        finally { setLoading(l => ({ ...l, priceOpt: false })); }
    };

    const loadAnomalies = async () => {
        setLoading(l => ({ ...l, anomaly: true }));
        try {
            const data = await wawiService.getAnomalies(7, 3.0);
            setAnomalies(data as unknown as AnomalyData);
        } catch (err) {
            console.error('Anomaly load failed:', err);
            toast.error(t('error_load_insights'));
        }
        finally { setLoading(l => ({ ...l, anomaly: false })); }
    };

    const searchOem = async () => {
        if (!oemQuery || oemQuery.length < 3) return;
        setLoading(l => ({ ...l, oem: true }));
        try {
            const data = await wawiService.fuzzyOemSearch(oemQuery) as OemResult[];
            setOemResults(data);
        } catch (err) {
            console.error('OEM search failed:', err);
            toast.error(t('error_load_insights'));
        }
        finally { setLoading(l => ({ ...l, oem: false })); }
    };

    const toggle = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }));

    const urgencyColor = (u: string) => u === 'critical' ? 'text-red-500 bg-red-50 border-red-200' : u === 'warning' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t('wawi_ai_insights')}</h1>
                            <p className="text-muted-foreground text-sm">{t('wawi_ai_insights_sub')}</p>
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={loadBriefing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading.briefing ? 'animate-spin' : ''}`} /> {t('wawi_refresh')}
                </Button>
            </div>

            {/* ═══ Tagesbriefing ═══ */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <button className="w-full p-6 flex items-center justify-between text-left" onClick={() => toggle('briefing')}>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">{t('wawi_daily_briefing')}</h3>
                    </div>
                    {expanded.briefing ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {expanded.briefing && (
                    <div className="px-6 pb-6 space-y-4">
                        {loading.briefing ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">{t('wawi_loading_briefing')}</div>
                        ) : briefing ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-bold">{briefing.orders?.today ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{t('wawi_orders_today')}</div>
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-bold">{briefing.revenue?.today?.toLocaleString('de-DE') ?? 0} €</div>
                                        <div className="text-xs text-muted-foreground mt-1">{t('wawi_revenue_today')}</div>
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                                        <div className={`text-2xl font-bold ${(briefing.inventory?.low_stock_alerts ?? 0) > 0 ? 'text-red-500' : ''}`}>{briefing.inventory?.low_stock_alerts ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{t('wawi_stock_alerts')}</div>
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-bold">{briefing.returns?.open ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{t('wawi_open_returns')}</div>
                                    </div>
                                </div>
                                {(briefing.top_products?.length ?? 0) > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('wawi_top_products')}</h4>
                                        <div className="flex gap-3 flex-wrap">
                                            {briefing.top_products!.map((tp: BriefingProduct, i: number) => (
                                                <div key={i} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-sm">
                                                    <span className="font-bold">{tp.name}</span> <span className="text-muted-foreground ml-1">{tp.sold}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {briefing.briefing_text && (
                                    <div className="bg-gradient-to-r from-violet-500/5 to-pink-500/5 border border-violet-500/10 rounded-2xl p-4">
                                        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{briefing.briefing_text}</pre>
                                    </div>
                                )}
                            </>
                        ) : <div className="text-center text-muted-foreground">{t('wawi_no_briefing')}</div>}
                    </div>
                )}
            </div>

            {/* ═══ Intelligente OEM-Suche ═══ */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">{t('wawi_oem_search')}</h3>
                </div>
                <div className="flex gap-3">
                    <input
                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm"
                        placeholder={t('wawi_oem_placeholder')}
                        value={oemQuery}
                        onChange={e => setOemQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchOem()}
                    />
                    <Button className="rounded-xl px-6" onClick={searchOem} disabled={loading.oem}>
                        {loading.oem ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('wawi_search_btn')}
                    </Button>
                </div>
                {oemResults.length > 0 && (
                    <div className="mt-4 divide-y divide-border">
                        {oemResults.map((r: OemResult, i: number) => (
                            <div key={i} className="py-3 flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-sm">{r.product?.name || t('wawi_unknown')}</span>
                                    <span className="ml-3 font-mono text-xs text-muted-foreground">{r.product?.IPN}</span>
                                    <span className="ml-3 text-xs text-muted-foreground">via {r.match_type} · "{r.matched_number}"</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {r.matched_brand && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{r.matched_brand}</span>}
                                    <span className={`text-xs font-bold ${r.confidence >= 0.95 ? 'text-emerald-500' : r.confidence >= 0.7 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                        {Math.round(r.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ Smart Reorder ═══ */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <button className="w-full p-6 flex items-center justify-between text-left" onClick={() => { toggle('reorder'); if (!reorder) loadReorder(); }}>
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-lg">{t('wawi_smart_reorder')}</h3>
                        {reorder?.suggestions && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{reorder.suggestions.length}</span>}
                    </div>
                    {expanded.reorder ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {expanded.reorder && (
                    <div className="px-6 pb-6">
                        {loading.reorder ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">{t('wawi_analyzing_demand')}</div>
                        ) : (reorder?.suggestions?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                    <span>Basierend auf {reorder!.lookback_days} Tagen · Prognose {reorder!.forecast_days} Tage</span>
                                    <span className="font-bold">Geschätzte Kosten: {reorder!.total_estimated_cost?.toLocaleString('de-DE')} €</span>
                                </div>
                                {reorder!.suggestions.map((s: ReorderSuggestion, i: number) => (
                                    <div key={i} className={`p-4 rounded-2xl border ${urgencyColor(s.urgency)}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-sm">{s.product?.name}</span>
                                                <span className="ml-2 font-mono text-xs">{s.product?.IPN}</span>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-sm font-bold">{s.reorder_quantity} Stk bestellen</div>
                                                <div className="text-xs">{s.days_of_stock_remaining}d Restbestand · {s.daily_rate}/Tag</div>
                                            </div>
                                        </div>
                                        {s.suggested_supplier && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                → {s.suggested_supplier.name} · {s.suggested_supplier.price} €/Stk · {s.suggested_supplier.lead_time_days}d Lieferzeit
                                                {s.estimated_cost && ` · Gesamt: ${s.estimated_cost.toLocaleString('de-DE')} €`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <div className="text-center py-8 text-muted-foreground italic">{t('wawi_no_reorder')}</div>}
                    </div>
                )}
            </div>

            {/* ═══ Preisoptimierung ═══ */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <button className="w-full p-6 flex items-center justify-between text-left" onClick={() => { toggle('price'); if (!priceOpt.length) loadPriceOpt(); }}>
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-lg">{t('wawi_price_opt')}</h3>
                        {priceOpt.length > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{priceOpt.length}</span>}
                    </div>
                    {expanded.price ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {expanded.price && (
                    <div className="px-6 pb-6">
                        {loading.priceOpt ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">{t('wawi_analyzing_prices')}</div>
                        ) : priceOpt.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-border text-left text-xs font-bold uppercase text-muted-foreground">
                                        <th className="py-3 px-2">{t('wawi_article_col')}</th><th className="py-3 px-2">{t('wawi_current_price')}</th><th className="py-3 px-2">{t('wawi_suggestion')}</th><th className="py-3 px-2">{t('wawi_change')}</th><th className="py-3 px-2">{t('wawi_margin')}</th><th className="py-3 px-2">{t('wawi_reason')}</th>
                                    </tr></thead>
                                    <tbody>
                                        {priceOpt.map((p: PriceOptItem, i: number) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                                                <td className="py-3 px-2"><span className="font-bold">{p.product?.name}</span> <span className="block text-xs text-muted-foreground font-mono">{p.product?.IPN}</span></td>
                                                <td className="py-3 px-2">{p.current_price} €</td>
                                                <td className="py-3 px-2 font-bold">{p.suggested_price} €</td>
                                                <td className={`py-3 px-2 font-bold ${p.action === 'increase' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {p.price_change_pct > 0 ? '+' : ''}{p.price_change_pct}%
                                                </td>
                                                <td className="py-3 px-2 text-xs">{p.current_margin_pct}% → {p.new_margin_pct}%</td>
                                                <td className="py-3 px-2 text-xs text-muted-foreground max-w-[200px]">{p.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <div className="text-center py-8 text-muted-foreground italic">{t('wawi_no_price_suggestions')}</div>}
                    </div>
                )}
            </div>

            {/* ═══ Anomalie-Erkennung ═══ */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <button className="w-full p-6 flex items-center justify-between text-left" onClick={() => { toggle('anomaly'); if (!anomalies) loadAnomalies(); }}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-lg">{t('wawi_anomaly')}</h3>
                        {(anomalies?.total_anomalies ?? 0) > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{anomalies!.total_anomalies}</span>}
                    </div>
                    {expanded.anomaly ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {expanded.anomaly && (
                    <div className="px-6 pb-6">
                        {loading.anomaly ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">{t('wawi_analyzing_movements')}</div>
                        ) : (anomalies?.anomalies?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {anomalies!.anomalies.map((a: AnomalyItem, i: number) => (
                                    <div key={i} className={`p-4 rounded-2xl border ${a.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-sm">{a.product?.name}</span>
                                                <span className="ml-2 font-mono text-xs">{a.product?.IPN}</span>
                                                <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-muted">{a.movement_type === 'OUT' ? t('wawi_outgoing') : t('wawi_incoming')}</span>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">{a.deviation_factor}x Abweichung</span>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Aktuell: {a.recent_daily_qty}/Tag vs. Ø {a.historical_daily_avg}/Tag
                                        </div>
                                        {(a.possible_causes?.length ?? 0) > 0 && (
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                {a.possible_causes?.map((c: string, j: number) => (
                                                    <span key={j} className="text-[11px] bg-white/80 border border-border px-2 py-0.5 rounded-full">{c}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <div className="text-center py-8 text-muted-foreground italic">{t('wawi_no_anomalies')}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
