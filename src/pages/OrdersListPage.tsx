import { useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import { listOrders } from '../api/orders';
import type { Order } from '../api/types';

const OrdersListPage = () => {
    const { timeframe } = useTimeframe();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await listOrders();
                setOrders(data || []);
            } catch (error) {
                console.error('Failed to load orders:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
            'new': { variant: 'warning', label: 'Neu' },
            'pending': { variant: 'warning', label: 'Ausstehend' },
            'processing': { variant: 'default', label: 'In Bearbeitung' },
            'completed': { variant: 'success', label: 'Abgeschlossen' },
            'done': { variant: 'success', label: 'Erledigt' },
            'cancelled': { variant: 'danger', label: 'Storniert' },
        };
        const config = statusMap[status?.toLowerCase()] || { variant: 'default' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-5">
                <PageHeader title="Bestellungen" subtitle="Lade..." />
                <Card hover={false}>
                    <div className="empty-state">
                        <div className="empty-state-title">Lade Bestellungen...</div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Bestellungen"
                subtitle={`Alle Bestellungen · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Export</Button>
                    </>
                }
            />

            <Card
                title={`${orders.length} Bestellungen`}
                hover={false}
            >
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <Package className="empty-state-icon" />
                        <div className="empty-state-title">Keine Bestellungen gefunden</div>
                        <div className="empty-state-description">Neue Bestellungen erscheinen hier</div>
                    </div>
                ) : (
                    <div className="-mx-5 -mb-5">
                        {orders.map((order) => (
                            <a
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="list-item group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="list-item-title truncate">
                                        {order.customer_name || 'Unbekannter Kunde'}
                                    </div>
                                    <div className="list-item-subtitle">
                                        {order.vehicle_make} {order.vehicle_model} · {order.part_name}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        {getStatusBadge(order.status)}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {new Date(order.created_at).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OrdersListPage;
