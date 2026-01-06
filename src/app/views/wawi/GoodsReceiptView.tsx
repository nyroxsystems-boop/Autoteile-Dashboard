import { useState, useEffect } from 'react';
import { CheckCircle2, Printer, TruckIcon, Calendar, Plus, Minus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, PurchaseOrder, PurchaseOrderItem } from '../../services/wawiService';
import { toast } from 'sonner';

interface ReceiptItem extends PurchaseOrderItem {
    received_quantity: number;
    location_id?: number;
}

export function GoodsReceiptView() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        loadOrders();
        wawiService.getLocations().then(setLocations);
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const orders = await wawiService.getPurchaseOrders();
            // Filter for confirmed/sent orders only
            setPurchaseOrders(orders.filter(o => ['sent', 'confirmed'].includes(o.status)));
        } catch (err) {
            console.error('Failed to load orders', err);
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
                        part_id: item.part_id,
                        type: 'IN',
                        quantity: item.received_quantity,
                        reference: `PO-${selectedPO.order_number}`,
                        to_location: locations.find(l => l.id === item.location_id)?.name,
                        notes: `Wareneingang von ${selectedPO.supplier_name}`,
                    });
                }
            }

            toast.success('Wareneingang erfolgreich gebucht!');
            setSelectedPO(null);
            setReceiptItems([]);
            loadOrders();
        } catch (err) {
            toast.error('Fehler beim Buchen');
            console.error(err);
        }
    };

    const totalReceived = receiptItems.reduce((sum, item) => sum + item.received_quantity, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Wareneingang</h1>
                    <p className="text-muted-foreground mt-1">
                        Empfange Bestellungen und aktualisiere den Lagerbestand.
                    </p>
                </div>
                {selectedPO && (
                    <Button
                        onClick={handleReceive}
                        disabled={totalReceived === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Wareneingang buchen ({totalReceived} Artikel)
                    </Button>
                )}
            </div>

            {!selectedPO ? (
                <>
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold">Offene Bestellungen</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Wähle eine Bestellung zum Empfang aus
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {loading ? (
                                <div className="p-12 text-center text-muted-foreground animate-pulse">
                                    Lade Bestellungen...
                                </div>
                            ) : purchaseOrders.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm italic">Keine offenen Bestellungen</p>
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
                                                        {po.status === 'confirmed' ? 'Bestätigt' : 'Gesendet'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-1">
                                                    Lieferant: <span className="font-medium">{po.supplier_name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Bestellt: {new Date(po.order_date).toLocaleDateString('de-DE')}
                                                    </div>
                                                    {po.expected_delivery && (
                                                        <div className="flex items-center gap-1">
                                                            <TruckIcon className="w-3 h-3" />
                                                            Erwartet: {new Date(po.expected_delivery).toLocaleDateString('de-DE')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{po.items.length} Pos.</div>
                                                <div className="text-sm text-muted-foreground">{po.total_amount.toFixed(2)} {po.currency}</div>
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
                                <p className="text-sm text-primary/70">von {selectedPO.supplier_name}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedPO(null);
                                    setReceiptItems([]);
                                }}
                                className="rounded-xl"
                            >
                                Abbrechen
                            </Button>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                        <th className="px-6 py-4">Artikel</th>
                                        <th className="px-6 py-4">Bestellt</th>
                                        <th className="px-6 py-4">Empfangen</th>
                                        <th className="px-6 py-4">Lagerort</th>
                                        <th className="px-6 py-4">Preis</th>
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
                                                <div className="text-sm">{item.unit_price.toFixed(2)} {selectedPO.currency}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Σ {item.total_price.toFixed(2)} {selectedPO.currency}
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
                                    <h4 className="font-bold text-sm">Labels drucken (Optional)</h4>
                                    <p className="text-xs text-muted-foreground">Lager-Etiketten für empfangene Artikel</p>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-xl" disabled>
                                <Printer className="w-4 h-4 mr-2" />
                                Etiketten drucken
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
