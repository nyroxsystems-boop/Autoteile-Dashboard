import {
  LayoutDashboard, Package, FileText, Receipt, Store,
  Activity, MessageSquare, Warehouse, Shield, Settings,
  DollarSign, Truck, RotateCcw, Star, Brain, X
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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({
  activeView,
  onNavigate,
  isOwner = false,
  mobileOpen = false,
  onMobileClose,
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
    { id: 'warenwirtschaft', label: t('nav_wawi_dashboard'), icon: LayoutDashboard, group: 'main' },
    { id: 'artikel', label: t('nav_wawi_articles'), icon: Package, group: 'main' },
    { id: 'lieferanten', label: t('nav_wawi_suppliers'), icon: Store, group: 'main' },
    { id: 'nachbestellung', label: t('nav_wawi_reorder'), icon: Receipt, group: 'main' },
    { id: 'wareneingang', label: t('nav_wawi_receipt'), icon: Truck, group: 'main' },
    { id: 'retouren', label: t('nav_wawi_returns'), icon: RotateCcw, group: 'features' },
    { id: 'bewertungen', label: t('nav_wawi_ratings'), icon: Star, group: 'features' },
    { id: 'ki-insights', label: t('nav_wawi_ai'), icon: Brain, group: 'features' },
    { id: 'berichte', label: t('nav_wawi_reports'), icon: Activity, group: 'system' },
    { id: 'settings', label: t('nav_wawi_settings'), icon: Settings, group: 'system' },
  ];

  const navItems = isWawi ? wawiNavItems : botNavItems;
  const allNavItems = [...navItems];

  if (isOwner) {
    allNavItems.push({ id: 'admin', label: 'Admin', icon: Shield, group: 'system' });
  }

  const handleNavClick = (id: string) => {
    onNavigate(id);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={`
          fixed left-0 top-0 h-screen w-20 backdrop-blur-md border-r border-sidebar-border/60 flex flex-col items-center py-8 z-50
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo + Mobile Close */}
        <div className="relative w-full flex justify-center mb-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer shadow-md"
            style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(240 80% 50%))' }}
          >
            <span className="text-white font-bold text-base">PU</span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="absolute right-2 top-0 w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center md:hidden"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 w-full px-3 overflow-y-auto">
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
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    relative flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all duration-150 w-full
                    ${isActive
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
                  <span className={`text-[0.6rem] font-medium leading-tight ${isActive ? 'text-primary font-semibold' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-sm" style={{ boxShadow: '2px 0 8px hsl(221 83% 53% / 0.3)' }} />
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}