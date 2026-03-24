import { X, Phone, MapPin, Building2, FileText, MessageSquare, User, Wrench, Handshake, AlertTriangle, PersonStanding } from 'lucide-react';
import { StatusChip } from './StatusChip';
import { toast } from 'sonner';
import { apiFetch } from '../api/client';
import { useI18n } from '../../i18n';
import { openExternal } from '../utils/desktop';

interface Message {
  id: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  oemNumbers?: string[];
}

interface Address {
  street: string;
  zip: string;
  city: string;
}

interface CustomerProfile {
  id: string | number;
  customerName: string;
  whatsappNumber: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  customerType?: 'werkstatt' | 'endkunde' | 'partner';
  shippingAddress?: Address;
  billingAddress?: Address;
  deliveryMethod?: 'lieferung' | 'abholung';
  invoiceRequired?: boolean;
  vatId?: string;
  poReference?: string;
  status: 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending';
  messages: Message[];
  totalOrders: number;
  totalRevenue: string;
}

interface CustomerDetailPanelProps {
  customer: CustomerProfile;
  onClose: () => void;
  onCreateQuote: () => void;
  onCustomerUpdated?: () => void;
}

export function CustomerDetailPanel({ customer, onClose, onCreateQuote, onCustomerUpdated }: CustomerDetailPanelProps) {
  const { t } = useI18n();

  const customerTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    werkstatt: { label: t('customer_workshop'), icon: <Wrench className="w-3.5 h-3.5 inline mr-1" /> },
    partner: { label: t('customer_partner'), icon: <Handshake className="w-3.5 h-3.5 inline mr-1" /> },
    endkunde: { label: t('customer_end_user'), icon: <User className="w-3.5 h-3.5 inline mr-1" /> },
  };

  const handleSetCustomerType = async (type: 'werkstatt' | 'partner' | 'endkunde') => {
    try {
      await apiFetch(`/api/conversations/${customer.id}/customer-type`, {
        method: 'PATCH',
        body: JSON.stringify({ customer_type: type }),
      });
      toast.success(t('customer_type_saved'));
      onCustomerUpdated?.();
    } catch {
      toast.error(t('customer_type_error'));
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-semibold text-foreground">{customer.customerName}</h2>
            <StatusChip status={customer.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
            <span>{customer.whatsappNumber}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Customer Profile */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="w-4 h-4 text-primary" strokeWidth={2} />
            {t('customer_profile')}
          </div>

          <div className="space-y-3">
            {customer.customerType && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1.5">{t('customer_type_label')}</div>
                  <div className="flex gap-2">
                    {(['werkstatt', 'partner', 'endkunde'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSetCustomerType(type)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${customer.customerType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          }`}
                      >
                        {customerTypeConfig[type]?.icon}{customerTypeConfig[type]?.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {t('customer_type_hint')}
                  </div>
                </div>
              </div>
            )}

            {!customer.customerType && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-400 mb-1">{t('customer_type_not_set')}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-500 mb-3">
                      {t('customer_type_set_hint')}
                    </div>
                    <div className="flex gap-2">
                      {(['werkstatt', 'partner', 'endkunde'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => handleSetCustomerType(type)}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-amber-500/30 bg-card text-sm font-medium text-foreground hover:border-amber-500 hover:bg-amber-500/5 transition-all"
                        >
                          {customerTypeConfig[type]?.icon}{customerTypeConfig[type]?.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {customer.contactPerson && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{t('customer_contact')}</div>
                  <div className="text-sm text-foreground">{customer.contactPerson}</div>
                </div>
              </div>
            )}

            {/* D6 FIX: Always show phone — fall back to WhatsApp number */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">{t('customer_phone')}</div>
                <div className="text-sm text-foreground">{customer.phone || customer.whatsappNumber}</div>
              </div>
            </div>

            {/* D6 FIX: Always show email row */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">E-Mail</div>
                <div className={`text-sm ${customer.email ? 'text-foreground' : 'text-muted-foreground italic'}`}>{customer.email || '—'}</div>
              </div>
            </div>

            {customer.shippingAddress && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {customer.deliveryMethod === 'abholung' ? t('customer_pickup') : t('customer_shipping')}
                  </div>
                  <div className="text-sm text-foreground">
                    {customer.shippingAddress.street}<br />
                    {customer.shippingAddress.zip} {customer.shippingAddress.city}
                  </div>
                  {customer.deliveryMethod === 'abholung' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 mt-1.5">
                      <PersonStanding className="w-3.5 h-3.5 inline mr-1" /> {t('customer_pickup_badge')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {customer.billingAddress && customer.invoiceRequired && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{t('customer_billing')}</div>
                  <div className="text-sm text-foreground">
                    {customer.billingAddress.street}<br />
                    {customer.billingAddress.zip} {customer.billingAddress.city}
                  </div>
                </div>
              </div>
            )}

            {customer.vatId && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{t('customer_vat')}</div>
                  <div className="text-sm text-foreground font-mono">{customer.vatId}</div>
                </div>
              </div>
            )}

            {customer.poReference && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{t('customer_po_ref')}</div>
                  <div className="text-sm text-foreground font-mono">{customer.poReference}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t('customer_total_orders')}</div>
              <div className="font-semibold text-foreground tabular-nums">{customer.totalOrders}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">{t('customer_revenue')}</div>
              <div className="font-semibold text-foreground tabular-nums">{customer.totalRevenue}</div>
            </div>
          </div>
        </div>

        {/* WhatsApp Chat History */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="w-4 h-4 text-primary" strokeWidth={2} />
              {t('customer_chat_history')}
            </div>
            <button
              onClick={() => {
                const phoneNumber = customer.whatsappNumber.replace(/\s/g, '').replace(/\+/g, '');
                openExternal(`https://wa.me/${phoneNumber}`);
              }}
              className="text-xs text-[#25D366] hover:text-[#1fb855] font-medium flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3 h-3" strokeWidth={2} />
              {t('customer_open_chat')}
            </button>
          </div>

          <div className="space-y-3">
            {customer.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${message.sender === 'customer'
                    ? 'bg-muted border border-border'
                    : message.sender === 'bot'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-accent border border-border'
                    }`}
                >
                  <div className="text-sm text-foreground mb-1">{message.text}</div>
                  {message.oemNumbers && message.oemNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {message.oemNumbers.map((oem, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-background border border-border text-foreground"
                        >
                          {oem}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1.5">{message.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border bg-muted/30 space-y-3">
        {customer.status === 'oem_pending' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">{t('customer_oem_check')}</div>
                <div className="text-xs text-red-700 dark:text-red-500">
                  {t('customer_oem_desc')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Button */}
        <button
          onClick={() => {
            const phoneNumber = customer.whatsappNumber.replace(/\s/g, '').replace(/\+/g, '');
            openExternal(`https://wa.me/${phoneNumber}`);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1fb855] transition-colors font-medium"
        >
          <MessageSquare className="w-4 h-4" strokeWidth={2} />
          {customer.status === 'oem_pending' ? t('customer_wa_oem') : t('customer_wa_open')}
        </button>

        <button
          onClick={onCreateQuote}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${customer.status === 'oem_pending'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
        >
          <FileText className="w-4 h-4" strokeWidth={2} />
          {customer.status === 'oem_pending' ? t('customer_oem_create') : t('customer_create_quote')}
        </button>
      </div>
    </div>
  );
}