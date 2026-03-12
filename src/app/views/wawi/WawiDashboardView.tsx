import { useState, useEffect } from 'react';
import {
    Package, ShoppingCart, History,
    AlertTriangle, TrendingUp, ArrowRight
} from 'lucide-react';
import { MetricCard } from '../../components/MetricCard';
import { Button } from '../../components/ui/button';
import { wawiService, Part, StockMovement, PurchaseOrder } from '../../services/wawiService';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';

export function WawiDashboardView() {
    const navigate = useNavigate();
    const { t } = useI18n();
    const [stats, setStats] = useState({ totalArticles: 0, lowStockCount: 0, totalValue: 0 });
    const [criticalParts, setCriticalParts] = useState<Part[]>([]);
    const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
    const [openOrderCount, setOpenOrderCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const dashboardStats = await wawiService.getStats();
            const articles = await wawiService.getArticles();

            setStats(dashboardStats);
            setCriticalParts(articles.filter(p => p.total_in_stock < p.minimum_stock).slice(0, 5));

            // Load real recent movements
            try {
                const movements = await wawiService.getRecentMovements(5);
                setRecentMovements(movements);
            } catch { /* graceful */ }

            // Load real open order count
            try {
                const orders: PurchaseOrder[] = await wawiService.getPurchaseOrders();
                setOpenOrderCount(orders.filter(o => o.status !== 'received' && o.status !== 'cancelled').length);
            } catch { /* graceful */ }
        } catch {
            // Error loading dashboard data
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('wawi_title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('wawi_subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <MetricCard
                    label={t('wawi_articles')}
                    value={stats.totalArticles}
                    icon={<Package className="w-5 h-5" />}
                />
                <MetricCard
                    label={t('wawi_critical_stock')}
                    value={stats.lowStockCount}
                    variant={stats.lowStockCount > 0 ? 'error' : 'success'}
                    icon={<AlertTriangle className="w-5 h-5" />}
                />
                <MetricCard
                    label={t('wawi_open_orders')}
                    value={openOrderCount}
                    icon={<ShoppingCart className="w-5 h-5" />}
                />
                <MetricCard
                    label={t('wawi_stock_value')}
                    value={`${stats.totalValue.toLocaleString('de-DE')} €`}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Handlungsbedarf Section */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            {t('wawi_critical_stocks')}
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/wawi/artikel')}>
                            {t('wawi_view_all')} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="p-12 text-center text-muted-foreground">{t('wawi_loading')}</div>
                        ) : criticalParts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground italic">
                                {t('wawi_no_action_needed')}
                            </div>
                        ) : criticalParts.map(part => (
                            <div key={part.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <div className="font-semibold text-sm">{part.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{part.IPN}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-red-500">{part.total_in_stock} {t('wawi_pieces')}</div>
                                    <div className="text-[10px] text-muted-foreground">{t('wawi_min')}: {part.minimum_stock}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            {t('wawi_recent_movements')}
                        </h3>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="p-12 text-center text-muted-foreground">{t('wawi_loading')}</div>
                        ) : recentMovements.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground italic">
                                {t('wawi_no_action_needed')}
                            </div>
                        ) : recentMovements.map(mv => (
                            <div key={mv.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <div className="font-semibold text-sm">{mv.part_name || `#${mv.part_id}`}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {mv.type === 'IN' ? '📥 Zugang' : mv.type === 'OUT' ? '📤 Abgang' : mv.type === 'TRANSFER' ? '🔄 Transfer' : '✏️ Korrektur'}
                                        {mv.reference && ` · ${mv.reference}`}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${mv.type === 'IN' ? 'text-emerald-500' : mv.type === 'OUT' ? 'text-red-500' : 'text-foreground'}`}>
                                        {mv.type === 'IN' ? '+' : mv.type === 'OUT' ? '-' : ''}{mv.quantity} {t('wawi_pieces')}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {new Date(mv.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
