import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import { getDashboardSummary, getOrders, DashboardSummary } from '../app/api/wws';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    loading?: boolean;
}

const KPICard = ({ title, value, change, trend, loading }: KPICardProps) => (
    <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
                {loading ? <span style={{ opacity: 0.5 }}>...</span> : value}
            </div>
            {change && !loading && (
                <Badge variant={trend === 'up' ? 'success' : 'danger'}>
                    {trend === 'up' ? '↗' : '↘'} {change}
                </Badge>
            )}
        </div>
    </Card>
);

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
                // Get 5 most recent orders
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <Card>
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--danger)' }}>
                        ⚠️ {error}
                    </div>
                </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <KPICard
                    title="Neue Bestellungen"
                    value={stats?.ordersNew ?? 0}
                    loading={loading}
                />
                <KPICard
                    title="In Bearbeitung"
                    value={stats?.ordersInProgress ?? 0}
                    loading={loading}
                />
                <KPICard
                    title="Umsatz heute"
                    value={stats ? formatCurrency(stats.revenueToday) : '—'}
                    loading={loading}
                />
                <KPICard
                    title="Entwurf-Rechnungen"
                    value={stats?.invoicesDraft ?? 0}
                    loading={loading}
                />
            </div>

            <Card title="Neueste Bestellungen">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Lade Bestellungen...
                    </div>
                ) : recentOrders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {recentOrders.map((order, i) => (
                            <div
                                key={order.id}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {order.part?.partCategory || 'Anfrage'}
                                        {order.vehicle?.make && ` - ${order.vehicle.make} ${order.vehicle.model || ''}`}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
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
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Bestellungen vorhanden
                    </div>
                )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Card title="Letzte Synchronisierung">
                    <div style={{ padding: 20, textAlign: 'center' }}>
                        {loading ? (
                            <span style={{ color: 'var(--muted)' }}>Lade...</span>
                        ) : stats?.lastSync ? (
                            <div>
                                <div style={{ fontSize: 14, color: 'var(--muted)' }}>Synchronisiert</div>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>
                                    {new Date(stats.lastSync).toLocaleString('de-DE')}
                                </div>
                            </div>
                        ) : (
                            <span style={{ color: 'var(--muted)' }}>Keine Daten</span>
                        )}
                    </div>
                </Card>
                <Card title="System-Status">
                    <div style={{ padding: 20, textAlign: 'center' }}>
                        <Badge variant="success">● Online</Badge>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OverviewPage;

