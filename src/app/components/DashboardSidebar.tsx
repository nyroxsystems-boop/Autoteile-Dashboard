import {
  LayoutDashboard, Package, FileText, Receipt, Store,
  Activity, MessageSquare, Warehouse, Shield, Settings,
  DollarSign, Truck, RotateCcw, Star, Brain
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

interface DashboardSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOwner?: boolean;
}

export function DashboardSidebar({
  activeView,
  onNavigate,
  isOwner = false
}: DashboardSidebarProps) {
  const isWawi = window.location.pathname.startsWith('/wawi');
  const { t } = useI18n();

  const botNavItems: NavItem[] = [
    { id: 'heute', label: t('nav_today'), icon: LayoutDashboard, group: 'main' },
    { id: 'kunden', label: t('nav_customers'), icon: MessageSquare, group: 'operations' },
    { id: 'auftraege', label: t('nav_orders'), icon: Package, group: 'operations' },
    { id: 'angebote', label: t('nav_offers'), icon: FileText, group: 'operations' },
    { id: 'preise', label: t('nav_prices'), icon: DollarSign, group: 'operations' },
    { id: 'belege', label: t('nav_documents'), icon: Receipt, group: 'operations' },
    { id: 'warenwirtschaft', label: t('nav_warehouse'), icon: Warehouse, group: 'partners' },
    { id: 'lieferanten', label: t('nav_suppliers'), icon: Store, group: 'partners' },
    { id: 'status', label: t('nav_status'), icon: Activity, group: 'system' },
    { id: 'settings', label: t('nav_settings'), icon: Settings, group: 'system' },
  ];

  const wawiNavItems: NavItem[] = [
    { id: 'warenwirtschaft', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
    { id: 'artikel', label: 'Artikel', icon: Package, group: 'main' },
    { id: 'lager', label: 'Lager', icon: Warehouse, group: 'main' },
    { id: 'lieferanten', label: 'Lieferanten', icon: Store, group: 'main' },
    { id: 'nachbestellung', label: 'Nachbestellung', icon: Receipt, group: 'main' },
    { id: 'wareneingang', label: 'Wareneingang', icon: Truck, group: 'main' },
    { id: 'retouren', label: 'Retouren', icon: RotateCcw, group: 'features' },
    { id: 'bewertungen', label: 'Bewertung', icon: Star, group: 'features' },
    { id: 'ki-insights', label: 'KI', icon: Brain, group: 'features' },
    { id: 'berichte', label: 'Berichte', icon: Activity, group: 'system' },
    { id: 'settings', label: 'Setup', icon: Settings, group: 'system' },
  ];

  const navItems = isWawi ? wawiNavItems : botNavItems;
  const allNavItems = [...navItems];

  if (isOwner) {
    allNavItems.push({ id: 'admin', label: 'Admin', icon: Shield, group: 'system' });
  }

  return (
    <div
      className="fixed left-0 top-0 h-screen w-20 bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/60 flex flex-col items-center py-8 z-50"
    >
      {/* Logo */}
      <div
        className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-10 cursor-pointer"
      >
        <span className="text-primary-foreground font-semibold text-base">AT</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 w-full px-3">
        {allNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const prevItem = index > 0 ? allNavItems[index - 1] : null;
          const showDivider = prevItem && prevItem.group !== item.group;

          return (
            <div key={item.id}>
              {showDivider && (
                <div className="h-px bg-border my-1.5" />
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`
                  relative flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors duration-150 w-full
                  ${isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                `}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[0.6rem] font-medium leading-tight ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-primary rounded-r-full" />
                )}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}