import { useSuppliers } from '../hooks/useSuppliers';
import { ErrorState } from '../components/ErrorState';
import { StatusChip } from '../components/StatusChip';
import { MetricCard } from '../components/MetricCard';
import { Store, Clock, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { useI18n } from '../../i18n';
import { toast } from 'sonner';

export function LieferantenView() {
  const { suppliers, loading, error } = useSuppliers();
  const { t } = useI18n();

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
        return 'success' as const;
      case 'degraded':
      case 'warning':
        return 'waiting' as const;
      case 'offline':
      case 'disabled':
        return 'error' as const;
      default:
        return 'waiting' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
        return 'Online';
      case 'degraded':
      case 'warning':
        return t('suppliers_degraded');
      case 'offline':
      case 'disabled':
        return 'Offline';
      default:
        return status;
    }
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground">{t('suppliers_loading')}</div>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>{t('suppliers_title')}</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          {t('suppliers_subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label={t('suppliers_active')}
          value={suppliers.filter(s => s.status?.toLowerCase() === 'online' || s.status?.toLowerCase() === 'active').length}
          icon={<Store className="w-5 h-5" />}
          variant="success"
        />
        <MetricCard
          label={t('suppliers_reliability')}
          value={suppliers.length > 0
            ? (suppliers.reduce((acc, s) => acc + (parseFloat(s.rating) || 5.0), 0) / suppliers.length * 20).toFixed(1) + "%"
            : "100%"}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="primary"
        />
        <MetricCard
          label={t('suppliers_total')}
          value={suppliers.length}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('suppliers_name')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('suppliers_type')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('suppliers_status')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('suppliers_last_seen')}
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('suppliers_reliability_col')}
                </th>
                <th className="text-center px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="px-2.5 py-1 bg-muted rounded-md text-sm font-medium w-fit">
                      {supplier.api_type || t('suppliers_manual')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip
                      status={getStatusVariant(supplier.status || 'online')}
                      label={getStatusLabel(supplier.status || 'online')}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{supplier.lastUpdate || t('today')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold
                      ${(parseFloat(supplier.rating) || 5.0) >= 4.5
                        ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border border-[var(--status-success-border)]'
                        : (parseFloat(supplier.rating) || 5.0) >= 4.0
                          ? 'bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)] border border-[var(--status-processing-border)]'
                          : 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)] border border-[var(--status-waiting-border)]'
                      }
                    `}>
                      {((parseFloat(supplier.rating) || 0) * 20).toFixed(0)}%
                    </div>
                  </td>
                  {/* D4 FIX: Action buttons */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const newStatus = supplier.status === 'offline' ? 'online' : 'offline';
                          supplier.status = newStatus;
                          toast.success(`${supplier.name}: ${newStatus === 'online' ? 'Aktiviert' : 'Deaktiviert'}`);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title={supplier.status === 'offline' ? 'Aktivieren' : 'Deaktivieren'}
                      >
                        {supplier.status === 'offline'
                          ? <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          : <ToggleRight className="w-5 h-5 text-green-500" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-muted-foreground leading-relaxed">
          {t('suppliers_info')}
        </p>
      </div>
    </div>
  );
}