import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { StatusChip } from '../components/StatusChip';
import { Percent, DollarSign, TrendingUp, Edit2, Trash2, Plus } from 'lucide-react';
import { useMerchantSettings } from '../hooks/useMerchantSettings';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { PriceGroupModal } from '../components/PriceGroupModal';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';

export function PreisprofileView() {
  const { t } = useI18n();
  const { settings, loading, update: _update } = useMerchantSettings();
  const { summary, loading: _summaryLoading } = useDashboardSummary();
  const [profiles, setProfiles] = useState<{
    id: string | number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    isDefault?: boolean;
    appliesTo?: string;
    lastModified?: string;
  }[]>([]);
  const [showPriceGroupModal, setShowPriceGroupModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<typeof profiles[0] | null>(null);
  const [calcBase, setCalcBase] = useState(100);
  const [calcMargin, setCalcMargin] = useState(25);
  const [deleteProfileId, setDeleteProfileId] = useState<string | number | null>(null);
  const calcCustomerPrice = calcBase * (1 + calcMargin / 100);

  useEffect(() => {
    if (settings) {
      const fromSettings = (settings.priceProfiles || []) as typeof profiles;
      setProfiles(fromSettings);
    }
  }, [settings]);

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-44 bg-muted rounded-lg animate-shimmer" />
          <div className="h-4 w-72 bg-muted/60 rounded mt-3 animate-shimmer" />
        </div>
        <div className="h-10 w-40 bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="h-20 bg-primary/5 border border-primary/10 rounded-xl animate-shimmer" />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/50 h-12 border-b border-border animate-shimmer" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 border-b border-border animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="h-48 bg-card border border-border rounded-xl animate-shimmer" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-40 bg-card border border-border rounded-xl animate-shimmer" />
        <div className="h-40 bg-card border border-border rounded-xl animate-shimmer" style={{ animationDelay: '100ms' }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1>{t('prices_title')}</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {t('prices_subtitle')}
            </p>
          </div>
          <Button onClick={() => { setEditingProfile(null); setShowPriceGroupModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t('prices_create')}
          </Button>
        </div>
      </div>

      <PriceGroupModal
        open={showPriceGroupModal}
        onOpenChange={(open) => { setShowPriceGroupModal(open); if (!open) setEditingProfile(null); }}
        editProfile={editingProfile}
      />

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-foreground font-medium mb-1">{t('prices_live_info')}</h4>
            <p className="text-muted-foreground leading-relaxed">
              {t('prices_live_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Price Profiles Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_profile_name')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_type')}
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_value')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_application')}
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_last_modified')}
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {t('prices_actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {profile.type === 'percentage' ? (
                          <Percent className="w-5 h-5 text-primary" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        {profile.isDefault && (
                          <StatusChip
                            status="success"
                            label={t('prices_default')}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="px-2.5 py-1 bg-muted rounded-md text-sm font-medium w-fit">
                      {profile.type === 'percentage' ? t('prices_percentage') : t('prices_fixed')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--status-success-bg)] text-[var(--status-success-fg)] rounded-lg border border-[var(--status-success-border)] font-semibold">
                      {profile.type === 'percentage' ? `${profile.value}%` : `€${profile.value}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground">{profile.appliesTo}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {profile.lastModified}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingProfile(profile);
                        setShowPriceGroupModal(true);
                      }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        {t('prices_edit')}
                      </Button>
                      {!profile.isDefault && (
                        <Button size="sm" variant="outline" onClick={() => setDeleteProfileId(profile.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin Calculator */}
      <div>
        <h2 className="mb-5">{t('prices_calculator')}</h2>
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block mb-3">{t('prices_base_price')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-8 h-11"
                  value={calcBase}
                  onChange={(e) => setCalcBase(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-3">{t('prices_margin')}</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className="pr-8 h-11"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(Number(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <label className="block mb-3">{t('prices_customer_price')}</label>
              <div className="h-11 px-4 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-lg flex items-center">
                <span className="tabular-nums tracking-tight text-[var(--status-success-fg)]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  €{calcCustomerPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-5">
            {t('prices_calculator_desc')}
          </p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3>{t('prices_avg_margin')}</h3>
          </div>
          <div className="tabular-nums tracking-tight mb-2" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
            {summary?.avgMargin ? `${summary.avgMargin.toFixed(1)}%` : '---'}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            {t('prices_avg_margin_desc')}
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--status-success-bg)] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[var(--status-success)]" />
            </div>
            <h3>{t('prices_margin_revenue')}</h3>
          </div>
          <div className="tabular-nums tracking-tight mb-2" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
            €{summary?.marginRevenue ? summary.marginRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 }) : '---'}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            {t('prices_margin_revenue_desc')}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-muted-foreground leading-relaxed">
          {t('prices_priority_desc')}
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteProfileId !== null} onOpenChange={(open) => { if (!open) setDeleteProfileId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('confirm_title')}</DialogTitle>
            <DialogDescription>{t('confirm_delete_price')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProfileId(null)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={async () => {
              if (deleteProfileId === null) return;
              const updated = profiles.filter(p => p.id !== deleteProfileId);
              setProfiles(updated);
              await _update({ priceProfiles: updated });
              toast.success(t('prices_deleted'));
              setDeleteProfileId(null);
            }}>{t('prices_delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}