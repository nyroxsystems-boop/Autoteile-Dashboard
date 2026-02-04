import { useState, useEffect } from 'react';
import { AlertCircle, Package, Clock, FileText, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import { getDashboardSummary, getOrders, DashboardSummary } from '../app/api/wws';

interface StatCardProps {
    title: string;
    value: string | number;
    footer?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'success' | 'danger';
    loading?: boolean;
}

const StatCard = ({ title, value, footer, icon, variant = 'default', loading }: StatCardProps) => {
    const variantClass = variant === 'success' ? 'stat-card-success' : variant === 'danger' ? 'stat-card-danger' : '';

    return (
        <div className={`stat-card ${variantClass}`}>
            <div className="flex items-start justify-between">
                <div className="stat-card-label">{title}</div>
                {icon && <div className="text-muted-foreground/50">{icon}</div>}
            </div>
            <div className="stat-card-value">
                {loading ? <span className="opacity-40">—</span> : value}
            </div>
            {footer && !loading && (
                <div className="stat-card-footer">{footer}</div>
            )}
        </div>
    );
};

const OverviewPage = () => {
    const { timeframe } = useTimeframe();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardSummary | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [statsData, ordersData] = await Promise.all([
                    getDashboardSummary(),
                    getOrders()
                ]);
                setStats(statsData);
                setRecentOrders(ordersData.slice(0, 5));
            } catch (err: any) {
                console.error('Failed to load dashboard data:', err);
                setError(err.message || 'Fehler beim Laden der Daten');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Übersicht"
                subtitle={`Dashboard · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Bericht erstellen</Button>
                        <Button variant="primary" size="sm">Daten exportieren</Button>
                    </>
                }
            />

            {error && (
                <Card hover={false}>
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Neue Bestellungen"
                    value={stats?.ordersNew ?? 0}
                    icon={<Package className="w-4 h-4" />}
                    loading={loading}
                />
                <StatCard
                    title="In Bearbeitung"
                    value={stats?.ordersInProgress ?? 0}
                    icon={<Clock className="w-4 h-4" />}
                    loading={loading}
                />
                <StatCard
                    title="Umsatz heute"
                    value={stats ? formatCurrency(stats.revenueToday) : '—'}
                    variant="success"
                    loading={loading}
                />
                <StatCard
                    title="Entwurf-Rechnungen"
                    value={stats?.invoicesDraft ?? 0}
                    icon={<FileText className="w-4 h-4" />}
                    loading={loading}
                />
            </div>

            <Card title="Neueste Bestellungen" hover={false}>
                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-title">Lade Bestellungen...</div>
                    </div>
                ) : recentOrders.length > 0 ? (
                    <div className="-mx-5 -mb-5">
                        {recentOrders.map((order, i) => (
                            <div key={order.id} className="list-item">
                                <div>
                                    <div className="list-item-title">
                                        {order.part?.partCategory || 'Anfrage'}
                                        {order.vehicle?.make && ` - ${order.vehicle.make} ${order.vehicle.model || ''}`}
                                    </div>
                                    <div className="list-item-subtitle">
                                        {new Date(order.created_at || order.createdAt).toLocaleString('de-DE')}
                                    </div>
                                </div>
                                <Badge variant={order.status === 'new' ? 'warning' : order.status === 'done' ? 'success' : 'default'}>
                                    {order.status === 'new' ? 'Neu' : order.status === 'done' ? 'Erledigt' : order.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Package className="empty-state-icon" />
                        <div className="empty-state-title">Keine Bestellungen vorhanden</div>
                        <div className="empty-state-description">Neue Bestellungen werden hier angezeigt</div>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Letzte Synchronisierung" hover={false}>
                    <div className="text-center py-4">
                        {loading ? (
                            <span className="text-muted-foreground text-sm">Lade...</span>
                        ) : stats?.lastSync ? (
                            <div>
                                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Synchronisiert</div>
                                <div className="text-lg font-semibold">
                                    {new Date(stats.lastSync).toLocaleString('de-DE')}
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm">Keine Daten</span>
                        )}
                    </div>
                </Card>
                <Card title="System-Status" hover={false}>
                    <div className="flex items-center justify-center gap-2 py-4">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">System Online</span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OverviewPage;
