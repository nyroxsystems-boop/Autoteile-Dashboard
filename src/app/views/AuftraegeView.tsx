
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '../components/StatusChip';
import { OrderTimeline } from '../components/OrderTimeline';
import { Button } from '../components/ui/button';
import { Car, MessageSquare, User, Truck, Clock, AlertCircle, FileText } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { getOrderOffers, publishOffers, getOrderMessages, sendMessage, Offer, Order, Message, createInvoiceFromOrder } from '../api/wws';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { useMerchantSettings } from '../hooks/useMerchantSettings';

export function AuftraegeView() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { settings: merchantSettings } = useMerchantSettings();
  const hasWholesaler = (merchantSettings?.wholesalers?.length || 0) > 0;
  const { orders, loading, error, refresh } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  useEffect(() => {
    if (selectedOrder) {
      setSelectedOrderId(selectedOrder.id);
      loadOffers(selectedOrder.id);
      loadMessages(selectedOrder.id);
    }
  }, [selectedOrder?.id]);

  const loadOffers = async (id: string | number) => {
    setOffersLoading(true);
    try {
      const data = await getOrderOffers(id);
      setOffers(data || []);
    } catch {
      toast.error(t('error'));
    } finally {
      setOffersLoading(false);
    }
  };

  const loadMessages = async (id: string | number) => {
    try {
      const msgs = await getOrderMessages(id);
      setMessages(msgs || []);
    } catch {
      toast.error(t('error'));
    }
  };

  const handleSendMessage = async () => {
    if (!selectedOrderId || !newMessageText.trim()) return;
    try {
      const sent = await sendMessage(selectedOrderId, newMessageText);
      setMessages([...messages, sent]);
      setNewMessageText('');
      toast.success(t('orders_message_sent'));
    } catch {
      toast.error(t('error'));
    }
  };

  const handlePublish = async () => {
    if (!selectedOrderId) return;
    try {
      // Get draft offer IDs - keep as strings (UUIDs)
      const ids = offers.filter(o => o.status === 'draft').map(o => o.id);
      if (ids.length === 0) {
        toast.error(t('orders_no_offers_publish'));
        return;
      }
      await publishOffers(selectedOrderId, ids);
      toast.success(t('orders_offers_sent'));
      loadOffers(selectedOrderId as number);
    } catch (err) {
      toast.error(t('error'));
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) return;

    // Guard: prevent invoice creation if no offers exist for this order
    if (offers.length === 0) {
      toast.error(t('orders_no_offers_invoice'));
      return;
    }

    try {
      const invoice = await createInvoiceFromOrder(selectedOrderId as string);
      toast.success(t('orders_invoice_created'));

      // Trigger global invoice list refresh
      window.dispatchEvent(new CustomEvent('invoiceCreated', { detail: invoice }));

      refresh(); // update order status
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('already exists')) {
        toast.info(t('orders_invoice_exists'));
      } else if (errMsg.includes('500') || errMsg.includes('Server')) {
        toast.error(t('orders_invoice_server_error'));
      } else {
        toast.error(t('orders_invoice_error'));
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      <div className="lg:col-span-5 space-y-6">
        <div>
          <div className="h-8 w-32 bg-muted rounded-lg animate-shimmer" />
          <div className="h-4 w-64 bg-muted/60 rounded mt-3 animate-shimmer" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-card animate-shimmer" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted/60 rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-5 w-32 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-7 bg-card border border-border rounded-xl p-8 animate-shimmer">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/40 rounded" style={{ width: `${80 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-error bg-error/5 rounded-2xl border border-error/20 py-20 flex flex-col items-center gap-3"><AlertCircle className="w-8 h-8" /> <span>{error}</span></div>;

  const timelineSteps = (order: Order) => [
    { label: t('status_request_received'), completed: true },
    { label: t('status_oem_checked'), completed: !!(order.oem_number || order.oem) },
    { label: t('status_offers_found'), completed: offers.length > 0 },
    { label: t('status_customer_waiting'), completed: order.status === 'collect_part', current: order.status === 'collect_part' },
    { label: t('status_order_confirmed'), completed: order.status === 'done' },
    { label: t('status_receipt_created'), completed: order.status === 'invoiced' },
  ];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Order List - Left Side */}
      <div className="lg:col-span-5 space-y-6 lg:overflow-y-auto lg:pr-2">
        <div>
          <h1>{t('orders_title')}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            {t('orders_subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {orders.map((order) => {
            // Helper accessor for legacy/mixed types
            const vehicle = order.vehicle || order.vehicle_json;
            const make = (vehicle?.make || '') as string;
            const model = (vehicle?.model || '') as string;
            const partText = order.part?.partText || order.part_json?.rawText;
            const oem = order.oem_number || order.oem;

            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`
                  w-full p-5 rounded-xl border transition-all duration-200 text-left
                  ${selectedOrderId === order.id
                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="font-medium">{order.contact?.name || order.customerPhone || t('orders_unknown_customer')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Car className="w-3.5 h-3.5" />
                      <span>{make} {model}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusChip status={order.status} size="sm" />
                    {order.generated_invoice_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/bot/belege');
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                        title="Zur Rechnung navigieren"
                      >
                        <FileText className="w-3 h-3" />
                        {t('orders_invoice')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1 bg-muted rounded-md text-xs font-mono font-medium">
                    {oem || t('orders_no_oem')}
                  </code>
                  <span className="text-muted-foreground text-sm truncate">
                    {String(partText || t('orders_part_unknown'))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Details - Right Side */}
      <div className="lg:col-span-7 bg-card border border-border rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm">
        {selectedOrder ? (
          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2>{selectedOrder.contact?.name || selectedOrder.customerPhone || t('orders_details')}</h2>
                <StatusChip status={selectedOrder.status} />
              </div>
              <p className="text-muted-foreground">ID: {selectedOrder.external_ref || selectedOrder.id}</p>
            </div>

            <div className="space-y-5">
              <h3>{t('orders_context')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">{t('orders_contact')}</div>
                    <div className="font-medium">{selectedOrder.contact?.name || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">WhatsApp ID</div>
                    <div className="font-medium">{selectedOrder.contact?.wa_id || selectedOrder.customerPhone || 'Keine'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">{t('orders_vehicle')}</div>
                    <div className="font-medium">
                      {String((selectedOrder.vehicle || selectedOrder.vehicle_json)?.make || '')} {String((selectedOrder.vehicle || selectedOrder.vehicle_json)?.model || '')} ({String((selectedOrder.vehicle || selectedOrder.vehicle_json)?.year || '')})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3>{t('orders_parts_oem')}</h3>
              <div className="p-5 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-2">{t('orders_oem_number')}</div>
                    <code className="px-3 py-1.5 bg-background border border-border rounded-md font-mono font-medium">
                      {(selectedOrder.oem_number || selectedOrder.oem) || t('orders_not_found')}
                    </code>
                  </div>
                  {(selectedOrder.oem_number || selectedOrder.oem) && (
                    <div className="px-3 py-1.5 bg-success/10 text-success rounded-md text-sm font-medium border border-success/20">
                      {t('orders_verified')}
                    </div>
                  )}
                </div>
                <div className="mt-4 font-medium">{String(selectedOrder.part?.partText || selectedOrder.part_json?.rawText || '')}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                {t('orders_found_offers')}
              </h3>
              {offersLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Clock className="w-4 h-4 animate-spin" />
                  {t('orders_searching')}
                </div>
              ) : (
                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{t('orders_supplier_product')}</th>
                        <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{t('orders_status')}</th>
                        <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[10px]">{t('orders_price')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {offers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center">
                            {!hasWholesaler ? (
                              <div className="space-y-3">
                                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                                <p className="font-medium text-foreground">{t('wholesaler_none')}</p>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('wholesaler_none_desc')}</p>
                                <button
                                  onClick={() => navigate('/bot/settings')}
                                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                  {t('wholesaler_setup')} →
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">{t('orders_no_offers')}</span>
                            )}
                          </td>
                        </tr>
                      ) : (
                        offers.map((offer) => (
                          <tr key={offer.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold">{offer.shopName || offer.supplierName}</div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {offer.productName || offer.product_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusChip
                                status={offer.status === 'published' ? 'success' : 'waiting'}
                                label={offer.status === 'published' ? t('orders_sent') : t('orders_ready')}
                                size="sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              €{typeof offer.basePrice === 'number' ? offer.basePrice.toFixed(2) : parseFloat(offer.price || '0').toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <h3>{t('orders_communication')}</h3>
              <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="h-[300px] overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                      <p>{t('orders_no_messages')}</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.direction === 'OUT'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card border border-border rounded-bl-none text-foreground'
                          }`}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={`text-[10px] mt-1 ${msg.direction === 'OUT' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-border bg-background flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('orders_write_message')}
                    className="flex-1 bg-muted/50 border-none rounded-lg px-4 focus:ring-1 focus:ring-primary outline-none"
                  />
                  <Button size="sm" onClick={handleSendMessage} disabled={!newMessageText.trim()}>
                    {t('orders_send')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3>{t('orders_progress')}</h3>
              <OrderTimeline steps={timelineSteps(selectedOrder)} />
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              {selectedOrder.status === 'collect_part' ? (
                <Button size="lg" className="w-full" onClick={handlePublish}>
                  {t('orders_send_to_customer')}
                </Button>
              ) : (selectedOrder.status === 'done' || selectedOrder.status === 'shipped' || selectedOrder.status === 'confirmed') ? (
                <Button size="lg" variant="outline" className="w-full" onClick={handleCreateInvoice}>
                  {t('orders_create_invoice')}
                </Button>
              ) : (
                <Button size="lg" variant="ghost" className="w-full" disabled>
                  {t('orders_no_action')}
                </Button>
              )}
            </div>
          </div>
        ) : <div className="h-full flex items-center justify-center text-muted-foreground italic">{t('orders_select_order')}</div>}
      </div>
    </div>
  );
}

// mapStatus is no longer needed — StatusChip handles all status mappings internally