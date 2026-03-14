import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { RevenueChart } from '../components/RevenueChart';
import { TopCustomers } from '../components/TopCustomers';
import { ActivityFeed } from '../components/ActivityFeed';
import { StatusChip } from '../components/StatusChip';
import { Button } from '../components/ui/button';
import {
  Package, MessageSquare, TrendingUp, Clock, CheckCircle2,
  ArrowRight, BarChart3, Users, Zap
} from 'lucide-react';
import { useState } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../api/wws';
import { useI18n } from '../../i18n';

interface HeuteViewProps {
  onNavigate: (view: string, filter?: string) => void;
}

export function HeuteView({ onNavigate }: HeuteViewProps) {
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { orders, loading: ordersLoading } = useOrders();
  const { t, lang } = useI18n();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const chartData = summary?.revenueHistory || [];
  const topCustomers = summary?.topCustomers?.map(c => ({
    name: c.name,
    revenue: `€${c.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
    orders: c.orders,
    change: 0,
    avatar: c.avatar
  })) || [];

  const activities = summary?.activities?.map(a => ({
    ...a,
    time: new Date(a.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  })) || [];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greeting_morning') : hour < 18 ? t('greeting_afternoon') : t('greeting_evening');

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
            <span>{(vehicle?.make || '') as string} {(vehicle?.model || '') as string}</span>
          </div>
        );
      },
    },
    {
      key: 'oem',
      header: t('orders_oem_number'),
      render: (order: Order) => (
        <code className="px-2 py-1 bg-muted rounded text-xs">
          {order.oem_number || order.part?.oemNumber || order.oem || '-'}
        </code>
      ),
    },
    {
      key: 'status',
      header: t('orders_status'),
      render: (order: Order) => {
        return <StatusChip status={order.status} size="sm" />;
      },
    },
    {
      key: 'action',
      header: '',
      align: 'right' as const,
      render: (_order: Order) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-primary hover:text-primary/80 gap-1"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onNavigate('auftraege');
          }}
        >
          Details <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  if (summaryLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-shimmer" />
        <div className="h-5 w-64 bg-muted rounded animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl border border-border animate-shimmer" />
          ))}
        </div>
        <div className="h-80 bg-muted/30 rounded-xl border border-border animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 md:p-10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary/70 tracking-wide uppercase">
              {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {greeting} 👋
            </h1>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
              {t('today_subtitle')}
            </p>
          </div>
          
          {/* Quick summary pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{summary?.ordersNew || 0}</span>
              <span className="text-xs text-muted-foreground">{t('today_new_requests')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">€{(summary?.revenueToday ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 0 })}</span>
              <span className="text-xs text-muted-foreground">{t('today_revenue')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics — with stagger entrance animations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="animate-fade-in-up stagger-1">
        <MetricCard
          label={t('today_new_orders')}
          value={summary?.ordersNew.toString() || "0"}
          icon={<MessageSquare className="w-5 h-5" />}
          variant="primary"
        />
        </div>
        <div className="animate-fade-in-up stagger-2">
        <MetricCard
          label={t('today_in_progress')}
          value={summary?.ordersInProgress.toString() || "0"}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        </div>
        <div className="animate-fade-in-up stagger-3">
        <MetricCard
          label={t('today_draft_invoices')}
          value={summary?.invoicesDraft?.toString() || "0"}
          icon={<Clock className="w-5 h-5" />}
        />
        </div>
        <div className="animate-fade-in-up stagger-4">
        <MetricCard
          label={t('today_revenue')}
          value={`€${(summary?.revenueToday ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
        </div>
      </div>

      {/* Revenue Chart — full width */}
      {chartData.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground font-semibold">{t('today_revenue')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {timeRange === '7d' && t('time_7d')}
                {timeRange === '30d' && t('time_30d')}
                {timeRange === '90d' && t('time_90d')}
                {timeRange === '1y' && t('time_1y')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                {(['7d', '30d', '90d', '1y'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === range
                      ? 'bg-card text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {range === '7d' ? (lang === 'en' ? '7D' : '7T') : range === '30d' ? (lang === 'en' ? '30D' : '30T') : range === '90d' ? (lang === 'en' ? '90D' : '90T') : t('time_year_short')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--status-processing)]" />
                  <span className="text-xs text-muted-foreground">{t('today_revenue')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--status-success)]" />
                  <span className="text-xs text-muted-foreground">{t('today_new_orders')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <RevenueChart data={chartData} />
          </div>
        </div>
      ) : (
        /* Empty chart state — don't show a blank white box */
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-primary/40" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">{t('today_revenue_chart')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('today_revenue_chart_empty')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom: Orders (2/3) + Right Column (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders Table */}
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
                {t('today_view_all')} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            {orders.length > 0 ? (
              <DataTable
                columns={columns}
                data={orders.slice(0, 8)}
                onRowClick={() => onNavigate('auftraege')}
              />
            ) : (
              <div className="py-12 text-center">
                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('orders_none_yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Top Customers — only show if we have data */}
          {topCustomers.length > 0 ? (
            <TopCustomers customers={topCustomers} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary/40" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium text-sm mb-0.5">{t('today_top_customers')}</h3>
                  <p className="text-xs text-muted-foreground">{t('today_top_customers_empty')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed — or Quick Actions if empty */}
          {activities.length > 0 ? (
            <div className="min-h-[400px]">
              <ActivityFeed activities={activities} />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-foreground font-semibold text-sm mb-4">{t('today_quick_access')}</h3>
              <button
                onClick={() => onNavigate('auftraege')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--status-processing-bg)] flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-[var(--status-processing-fg)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t('orders_title')}</div>
                  <div className="text-xs text-muted-foreground">{summary?.ordersNew || 0} {t('today_new_requests')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('kunden')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-[var(--status-success-fg)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t('customers_title')}</div>
                  <div className="text-xs text-muted-foreground">{t('customers_all_contacts')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => onNavigate('angebote')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--status-waiting-bg)] flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-[var(--status-waiting-fg)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t('offers_title')}</div>
                  <div className="text-xs text-muted-foreground">{t('offers_manage')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}