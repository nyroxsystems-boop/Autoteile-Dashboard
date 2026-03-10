import { useI18n } from '../../i18n';

type BaseVariant = 'waiting' | 'processing' | 'success' | 'error' | 'neutral';
type OrderStatus = 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending'
  | 'collect_vehicle' | 'collect_part' | 'oem_lookup' | 'pricing'
  | 'offer_ready' | 'offer_sent' | 'done' | 'invoiced' | 'cancelled' | 'rejected';

interface StatusChipProps {
  status: BaseVariant | OrderStatus | string;
  label?: string;
  size?: 'sm' | 'md';
  withDot?: boolean;
}

const statusMapping: Record<string, { variant: BaseVariant; labelKey: string }> = {
  new: { variant: 'processing', labelKey: 'customers_new' },
  in_progress: { variant: 'processing', labelKey: 'customers_in_progress' },
  quoted: { variant: 'neutral', labelKey: 'customers_quoted' },
  confirmed: { variant: 'success', labelKey: 'status_order_confirmed' },
  oem_pending: { variant: 'waiting', labelKey: 'customers_oem_pending' },
  collect_vehicle: { variant: 'processing', labelKey: 'orders_vehicle' },
  collect_part: { variant: 'processing', labelKey: 'orders_parts_oem' },
  oem_lookup: { variant: 'waiting', labelKey: 'status_oem_lookup' },
  pricing: { variant: 'processing', labelKey: 'prices_title' },
  offer_ready: { variant: 'success', labelKey: 'orders_ready' },
  offer_sent: { variant: 'success', labelKey: 'offers_published' },
  done: { variant: 'success', labelKey: 'status_done' },
  invoiced: { variant: 'success', labelKey: 'status_invoiced' },
  cancelled: { variant: 'error', labelKey: 'cancel' },
  rejected: { variant: 'error', labelKey: 'offers_empty' },
};

export function StatusChip({ status, label, size = 'md', withDot = true }: StatusChipProps) {
  const { t } = useI18n();
  // Map customer/order status to base variant
  const mapped = statusMapping[status];
  const actualVariant: BaseVariant = mapped?.variant || (status as BaseVariant) || 'neutral';
  const actualLabel = label || (mapped ? t(mapped.labelKey) : status);

  const variants = {
    waiting: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)] border-[var(--status-waiting-border)]',
    processing: 'bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)] border-[var(--status-processing-border)]',
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-border)]',
    error: 'bg-[var(--status-error-bg)] text-[var(--status-error-fg)] border-[var(--status-error-border)]',
    neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-[var(--status-neutral-border)]'
  };

  const dotColors = {
    waiting: 'bg-[var(--status-waiting)]',
    processing: 'bg-[var(--status-processing)]',
    success: 'bg-[var(--status-success)]',
    error: 'bg-[var(--status-error)]',
    neutral: 'bg-[var(--status-neutral)]'
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`
      inline-flex items-center rounded-md border font-medium
      ${variants[actualVariant]}
      ${sizes[size]}
    `}>
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[actualVariant]}`} />
      )}
      {actualLabel}
    </span>
  );
}