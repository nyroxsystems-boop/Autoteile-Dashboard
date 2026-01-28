import {
  LayoutDashboard, Package, FileText, Receipt, Store,
  Activity, MessageSquare, Warehouse, Shield, Settings,
  DollarSign, Truck
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

interface DashboardSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  botStatus?: 'online' | 'degraded' | 'offline';
  environment?: 'demo' | 'live';
  isOwner?: boolean;
}

// Navigation item configuration is now handled inside the component based on workspace

export function DashboardSidebar({
  activeView,
  onNavigate,
  botStatus = 'online',
  environment = 'demo',
  isOwner = false
}: DashboardSidebarProps) {
  const isWawi = window.location.pathname.startsWith('/wawi');

  const botNavItems: NavItem[] = [
    { id: 'heute', label: 'Heute', icon: LayoutDashboard, group: 'main' },
    { id: 'kunden', label: 'Kunden', icon: MessageSquare, group: 'operations' },
    { id: 'auftraege', label: 'Aufträge', icon: Package, group: 'operations' },
    { id: 'angebote', label: 'Angebote', icon: FileText, group: 'operations' },
    { id: 'preise', label: 'Preise', icon: DollarSign, group: 'operations' },
    { id: 'belege', label: 'Belege', icon: Receipt, group: 'operations' },
    { id: 'warenwirtschaft', label: 'WAWI', icon: Warehouse, group: 'partners' },
    { id: 'lieferanten', label: 'Lieferanten', icon: Store, group: 'partners' },
    { id: 'status', label: 'Status', icon: Activity, group: 'system' },
    { id: 'settings', label: 'Einstellungen', icon: Settings, group: 'system' },
  ];

  const wawiNavItems: NavItem[] = [
    { id: 'warenwirtschaft', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
    { id: 'artikel', label: 'Artikel', icon: Package, group: 'main' },
    { id: 'lager', label: 'Lager', icon: Warehouse, group: 'main' },
    { id: 'lieferanten', label: 'Lieferanten', icon: Store, group: 'main' },
    { id: 'nachbestellung', label: 'Nachbestellung', icon: Receipt, group: 'main' },
    { id: 'wareneingang', label: 'Wareneingang', icon: Truck, group: 'main' },
    { id: 'berichte', label: 'Berichte', icon: Activity, group: 'main' },
    { id: 'settings', label: 'Setup', icon: Settings, group: 'system' },
  ];

  const navItems = isWawi ? wawiNavItems : botNavItems;
  const allNavItems = [...navItems];

  if (isOwner) {
    allNavItems.push({ id: 'admin', label: 'Admin', icon: Shield, group: 'system' });
  }

  const statusColors = {
    online: 'bg-[var(--status-success)]',
    degraded: 'bg-[var(--status-waiting)]',
    offline: 'bg-[var(--status-error)]'
  };

  const statusLabels = {
    online: 'Online',
    degraded: 'Eingeschränkt',
    offline: 'Offline'
  };

  return (
    <div
      className="fixed left-0 top-0 h-screen w-20 bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/60 flex flex-col items-center py-8 z-50"
    >
      {/* Logo/Brand */}
      <div
        className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-12 transition-all duration-300 hover:shadow-glow-primary hover:scale-105 cursor-pointer group"
      >
        <span className="text-primary-foreground font-semibold text-base">AT</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-3">
        {allNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const prevItem = index > 0 ? allNavItems[index - 1] : null;
          const showDivider = prevItem && prevItem.group !== item.group;

          return (
            <div key={item.id}>
              {showDivider && (
                <div className="h-px bg-border my-2" />
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`
                  group relative flex flex-col items-center gap-1.5 py-4 rounded-lg transition-all duration-150 w-full
                  ${isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                `}
                title={item.label}
              >
                <Icon className="w-5 h-5 transition-transform duration-150 group-hover:scale-105" />
                <span className={`text-[0.625rem] font-medium ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-r-full animate-fade-in" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer Actions & Status */}
      <div className="flex flex-col items-center gap-4 mt-auto pt-6 border-t border-sidebar-border w-full px-3">
        {/* Workspace indicator or padding */}
        <div className="py-2" />

        {/* Bot Health */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${statusColors[botStatus]}`}
            style={{
              animation: botStatus === 'online' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}
          />
          <span className="text-[0.625rem] text-muted-foreground font-medium">
            {statusLabels[botStatus]}
          </span>
        </div>

        {/* Environment */}
        <div className={`
          px-2.5 py-1 rounded-md text-[0.625rem] font-semibold tracking-wide border
          ${environment === 'live'
            ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-border)]'
            : 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-[var(--status-neutral-border)]'
          }
        `}>
          {environment === 'live' ? 'LIVE' : 'DEMO'}
        </div>
      </div>
    </div>
  );
}