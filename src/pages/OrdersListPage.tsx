import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
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

    if (loading) {
        return <div style={{ padding: 20 }}>Lade Bestellungen...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            <Card title={`${orders.length} Bestellungen`}>
                {orders.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Bestellungen gefunden
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {orders.map((order) => (
                            <a
                                key={order.id}
                                href={`/orders/${order.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 12,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{order.customer_name || 'Unbekannter Kunde'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                        {order.vehicle_make} {order.vehicle_model} · {order.part_name}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>{order.status}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                        {new Date(order.created_at).toLocaleDateString('de-DE')}
                                    </div>
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
