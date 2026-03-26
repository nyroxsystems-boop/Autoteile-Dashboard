import { useState, useEffect } from 'react';
import { CheckCircle2, Printer, TruckIcon, Calendar, Plus, Minus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ErrorState } from '../../components/ErrorState';
import { wawiService, PurchaseOrder, PurchaseOrderItem, WarehouseLocation } from '../../services/wawiService';
import { toast } from 'sonner';
import { useI18n } from '../../../i18n';

interface ReceiptItem extends PurchaseOrderItem {
    received_quantity: number;
    location_id?: number;
}

export function GoodsReceiptView() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const { t } = useI18n();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [locations, setLocations] = useState<WarehouseLocation[]>([]);

    useEffect(() => {
        loadOrders();
        wawiService.getLocations().then(setLocations);
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        setError(false);
        try {
            const orders = await wawiService.getPurchaseOrders();
            // Filter for confirmed/sent orders only
            setPurchaseOrders(orders.filter(o => ['sent', 'confirmed'].includes(o.status)));
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPO = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setReceiptItems(
            po.items.map(item => ({
                ...item,
                received_quantity: item.quantity, // Default to full receipt
                location_id: locations[0]?.id,
            }))
        );
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setReceiptItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, received_quantity: Math.max(0, item.received_quantity + delta) }
                    : item
            )
        );
    };

    const handleReceive = async () => {
        if (!selectedPO) return;

        try {
            // Create stock movements for each item
            for (const item of receiptItems) {
                if (item.received_quantity > 0) {
                    await wawiService.createMovement({
                        part_id: item.part_id ?? item.product,
                        type: 'IN',
                        quantity: item.received_quantity,
                        reference: `PO-${selectedPO.order_number}`,
                        to_location: item.location_id,
                        notes: `${t('wawi_goods_receipt')} ${selectedPO.supplier_name}`,
                    });
                }
            }

            toast.success(t('wawi_receipt_success'));
            setSelectedPO(null);
            setReceiptItems([]);
            loadOrders();
        } catch (err) {
            toast.error(t('error_goods_receipt'));
        }
    };

    const totalReceived = receiptItems.reduce((sum, item) => sum + item.received_quantity, 0);

    if (error && !loading) return <ErrorState onRetry={loadOrders} />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('wawi_goods_receipt')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('wawi_receipt_sub')}
                    </p>
                </div>
                {selectedPO && (
                    <Button
                        onClick={handleReceive}
                        disabled={totalReceived === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t('wawi_book_receipt')} ({totalReceived} {t('wawi_article_col')})
                    </Button>
                )}
            </div>

            {!selectedPO ? (
                <>
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold">{t('wawi_open_orders')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t('wawi_select_order')}
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {loading ? (
                                <div className="p-12 text-center text-muted-foreground animate-pulse">
                                    {t('wawi_loading')}...
                                </div>
                            ) : purchaseOrders.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm italic">{t('wawi_no_open_orders')}</p>
                                </div>
                            ) : (
                                purchaseOrders.map(po => (
                                    <button
                                        key={po.id}
                                        onClick={() => handleSelectPO(po)}
                                        className="w-full p-6 hover:bg-muted/20 transition-colors text-left group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-lg">{po.order_number}</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${po.status === 'confirmed'
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : 'bg-blue-500/10 text-blue-600'
                                                        }`}>
                                                        {po.status === 'confirmed' ? t('wawi_confirmed') : t('wawi_sent')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-1">
                                                    {t('suppliers_name')}: <span className="font-medium">{po.supplier_name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {t('wawi_ordered')}: {new Date(po.order_date).toLocaleDateString('de-DE')}
                                                    </div>
                                                    {po.expected_delivery && (
                                                        <div className="flex items-center gap-1">
                                                            <TruckIcon className="w-3 h-3" />
                                                            {t('wawi_expected')}: {new Date(po.expected_delivery).toLocaleDateString('de-DE')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{po.items.length} Pos.</div>
                                                <div className="text-sm text-muted-foreground">{(po.total_amount ?? 0).toFixed(2)} {po.currency}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-xl text-primary mb-1">{selectedPO.order_number}</h3>
                                <p className="text-sm text-primary/70">{t('wawi_from')} {selectedPO.supplier_name}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedPO(null);
                                    setReceiptItems([]);
                                }}
                                className="rounded-xl"
                            >
                                {t('wawi_cancel')}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                        <th className="px-6 py-4">{t('wawi_article_col')}</th>
                                        <th className="px-6 py-4">{t('wawi_ordered')}</th>
                                        <th className="px-6 py-4">{t('wawi_received')}</th>
                                        <th className="px-6 py-4">{t('wawi_location')}</th>
                                        <th className="px-6 py-4">{t('orders_price')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {receiptItems.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm">{item.part_name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{item.part_ipn}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold">{item.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-lg"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="font-bold text-lg min-w-[3ch] text-center">
                                                        {item.received_quantity}
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-lg"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.location_id}
                                                    onChange={(e) => setReceiptItems(prev =>
                                                        prev.map(i => i.id === item.id ? { ...i, location_id: parseInt(e.target.value) } : i)
                                                    )}
                                                    className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                >
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>
                                                            {loc.code} - {loc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">{(item.unit_price ?? 0).toFixed(2)} {selectedPO.currency}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Σ {(item.total_price ?? 0).toFixed(2)} {selectedPO.currency}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Printer className="w-8 h-8 text-muted-foreground/50" />
                                <div>
                                    <h4 className="font-bold text-sm">{t('wawi_print_labels')}</h4>
                                    <p className="text-xs text-muted-foreground">{t('wawi_print_labels_desc')}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-xl" disabled>
                                <Printer className="w-4 h-4 mr-2" />
                                {t('wawi_print_labels')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
