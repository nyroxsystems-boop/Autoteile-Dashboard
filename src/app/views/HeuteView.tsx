import { StatusChip } from '../components/StatusChip';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { RevenueChart } from '../components/RevenueChart';
import { TopCustomers } from '../components/TopCustomers';
import { ActivityFeed } from '../components/ActivityFeed';
import { Button } from '../components/ui/button';
import { Package, MessageSquare, TrendingUp, Clock, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../api/wws';
import { useI18n } from '../../i18n';

interface HeuteViewProps {
  onNavigate: (view: string, filter?: string) => void;
}

export function HeuteView({
  onNavigate
}: HeuteViewProps) {
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { orders, loading: ordersLoading } = useOrders();
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Chart data
  const chartData = summary?.revenueHistory || [];

  // Top customers
  const topCustomers = summary?.topCustomers?.map(c => ({
    name: c.name,
    revenue: `€${c.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
    orders: c.orders,
    change: 0,
    avatar: c.avatar
  })) || [];

  // Activity feed
  const activities = summary?.activities?.map(a => ({
    ...a,
    time: new Date(a.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  })) || [];

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  const columns = [
    {
      key: 'customer',
      header: t('orders_contact'),
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--status-success)]" />
          <span>{order.contact?.name || t('orders_unknown_customer')}</span>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: t('orders_vehicle'),
      render: (order: Order) => {
        const vehicle = order.vehicle || order.vehicle_json;
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>{vehicle?.make || ''} {vehicle?.model || ''}</span>
          </div>
        );
      },
    },
    {
      key: 'oem',
      header: t('orders_oem_number'),
      render: (order: Order) => (
        <code className="px-2 py-1 bg-muted rounded text-xs text-mono">
          {order.oem_number || order.part?.oemNumber || order.oem || '-'}
        </code>
      ),
    },
    {
      key: 'status',
      header: t('orders_status'),
      render: (order: Order) => {
        let status: 'waiting' | 'processing' | 'success' | 'error' = 'processing';
        if (order.status === 'new') status = 'processing';
        else if (order.status === 'collect_part') status = 'waiting';
        else if (order.status === 'done' || order.status === 'invoiced') status = 'success';

        return <StatusChip status={status} label={order.status} size="sm" />;
      },
    },
    {
      key: 'action',
      header: '',
      align: 'right' as const,
      render: (order: Order) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onNavigate('auftraege');
          }}
        >
          {order.status === 'new' ? t('orders_create_invoice') : 'Details'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  if (summaryLoading || ordersLoading) return <div className="p-20 text-center text-muted-foreground">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Header with subtle gradient accent */}
      <div className="relative">
        <div className="absolute -top-2 -left-2 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary/60" />
              <span className="text-sm font-medium text-primary/70">{greeting}</span>
            </div>
            <PageHeader
              title={t('today_title')}
              description={t('today_subtitle')}
            />
          </div>
        </div>
      </div>

      {/* Top Metrics with subtle gradient borders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label={t('today_new_orders')}
          value={summary?.ordersNew.toString() || "0"}
          change={12}
          changeLabel="vs. gestern"
          icon={<MessageSquare className="w-5 h-5" />}
          variant="primary"
        />
        <MetricCard
          label={t('today_in_progress')}
          value={summary?.ordersInProgress.toString() || "0"}
          change={2.3}
          changeLabel="vs. letzte Woche"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <MetricCard
          label={t('today_draft_invoices')}
          value={summary?.invoicesDraft?.toString() || "0"}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label={t('today_revenue')}
          value={`€${(summary?.revenueToday ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
          change={18}
          changeLabel="vs. gestern"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Revenue Chart — Full Width */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground font-semibold">{t('today_revenue')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {timeRange === '7d' && 'Letzte 7 Tage'}
              {timeRange === '30d' && 'Letzte 30 Tage'}
              {timeRange === '90d' && 'Letzte 90 Tage'}
              {timeRange === '1y' && 'Letztes Jahr'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
              {(['7d', '30d', '90d', '1y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${timeRange === range
                    ? 'bg-card text-foreground shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {range === '7d' ? '7T' : range === '30d' ? '30T' : range === '90d' ? '90T' : 'Jahr'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--status-processing)]"></div>
                <span className="text-sm text-muted-foreground">Umsatz</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--status-success)]"></div>
                <span className="text-sm text-muted-foreground">Bestellungen</span>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[280px] flex items-center justify-center">
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="text-muted-foreground text-sm italic">{t('orders_no_offers')}</div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Orders (left) + Top Customers & Activity (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders Table — Left 2/3 */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold">{t('today_recent_orders')}</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary hover:text-primary/80 gap-1"
                onClick={() => onNavigate('auftraege')}
              >
                Alle ansehen <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <DataTable
              columns={columns}
              data={orders.slice(0, 8)}
              onRowClick={() => onNavigate('auftraege')}
            />
          </div>
        </div>

        {/* Right Column — Top Customers + Activity Feed */}
        <div className="flex flex-col gap-4">
          <div className="flex-shrink-0">
            <TopCustomers customers={topCustomers} />
          </div>
          <div className="min-h-[400px]">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}