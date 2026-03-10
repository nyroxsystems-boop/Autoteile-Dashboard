import { useState } from 'react';
import {
  User, Building2, Users, Bell, Shield,
  CreditCard, Headphones, FileText, Package
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
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
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground mb-2">{t('settings_title')}</h1>
        <p className="text-muted-foreground">{t('settings_subtitle')}</p>
      </div>

      <div className="flex gap-6">
        {/* Compact Sidebar */}
        <div className="w-20 flex-shrink-0">
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
        <div className="flex-1">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}