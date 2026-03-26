import { useState } from 'react';
import {
  User, Building2, Users, Bell, Shield,
  CreditCard, Headphones, FileText, Package
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useMe } from '../hooks/useMe';
import { useTenants } from '../hooks/useTenants';
import { useI18n } from '../../i18n';

import { ProfileTab } from './settings/ProfileTab';
import { CompanyTab } from './settings/CompanyTab';
import { TeamTab } from './settings/TeamTab';
import { SecurityTab } from './settings/SecurityTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { BillingTab } from './settings/BillingTab';
import { SupportTab } from './settings/SupportTab';
import { InvoiceTab } from './settings/InvoiceTab';
import { WholesalersTab } from './settings/WholesalersTab';

type SettingsTab = 'profile' | 'company' | 'team' | 'notifications' | 'security' | 'billing' | 'support' | 'invoice' | 'wholesalers';

const tabComponents: Record<SettingsTab, React.FC> = {
  profile: ProfileTab,
  company: CompanyTab,
  team: TeamTab,
  security: SecurityTab,
  notifications: NotificationsTab,
  billing: BillingTab,
  support: SupportTab,
  invoice: InvoiceTab,
  wholesalers: WholesalersTab,
};

export function SettingsView() {
  const { loading: meLoading } = useMe();
  const { loading: tenantsLoading } = useTenants();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { id: SettingsTab; label: string; shortLabel: string; icon: LucideIcon }[] = [
    { id: 'profile', label: t('settings_profile'), shortLabel: t('settings_profile'), icon: User },
    { id: 'company', label: t('settings_company'), shortLabel: t('settings_company'), icon: Building2 },
    { id: 'team', label: t('settings_team'), shortLabel: t('settings_team'), icon: Users },
    { id: 'notifications', label: t('settings_notifications'), shortLabel: t('settings_notifications'), icon: Bell },
    { id: 'security', label: t('settings_security'), shortLabel: t('settings_security'), icon: Shield },
    { id: 'billing', label: t('settings_billing'), shortLabel: t('settings_billing'), icon: CreditCard },
    { id: 'support', label: t('settings_support'), shortLabel: t('settings_support'), icon: Headphones },
    { id: 'invoice', label: t('settings_invoice'), shortLabel: t('settings_invoice'), icon: FileText },
    { id: 'wholesalers', label: t('wholesaler_title'), shortLabel: t('wholesaler_title'), icon: Package },
  ];

  if (meLoading || tenantsLoading) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-8 w-40 bg-muted rounded-lg animate-shimmer" />
        <div className="h-4 w-72 bg-muted/60 rounded mt-3 animate-shimmer" />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-20 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-2">
            <div className="flex flex-col gap-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 py-4 animate-shimmer" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-5 h-5 bg-muted rounded" />
                  <div className="w-10 h-2 bg-muted/60 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="h-6 w-36 bg-muted rounded animate-shimmer" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 animate-shimmer" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-3 w-24 bg-muted/60 rounded" />
                <div className="h-10 w-full bg-muted/40 rounded-lg" />
              </div>
            ))}
            <div className="h-10 w-40 bg-muted rounded-lg animate-shimmer" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    </div>
  );

  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground mb-2">{t('settings_title')}</h1>
        <p className="text-muted-foreground">{t('settings_subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap text-sm font-medium transition-all shrink-0 ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                    }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                  {tab.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Compact Sidebar */}
        <div className="hidden md:block w-20 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex flex-col items-center gap-1.5 py-4 rounded-lg transition-all duration-150 w-full ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    title={tab.label}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform duration-150 group-hover:scale-105"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span className={`text-[0.625rem] font-medium text-center leading-tight px-1 whitespace-pre-line ${isActive ? 'text-primary' : ''}`}>
                      {tab.shortLabel}
                    </span>
                    {isActive && (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}