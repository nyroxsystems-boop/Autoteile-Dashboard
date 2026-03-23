import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTenants } from './hooks/useTenants';
import { useMe } from './hooks/useMe';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';


// ── Resilient lazy loading — handles stale CDN cache / chunk mismatches ──
// If a lazy chunk fails to load (e.g. CDN serves old chunk names), retry once
// with a cache-bust query param. If that also fails, force a full page reload
// so the browser fetches the latest index.html with correct chunk references.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRetry(
  importFn: () => Promise<any>,
  namedExport?: string,
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(() =>
    importFn()
      .then((mod) => {
        const component = namedExport ? mod[namedExport] : mod.default;
        if (component === undefined) {
          console.error(`[LazyRetry] Component ${String(namedExport || 'default')} is undefined in module`, mod);
          // Force reload if component is undefined — likely stale cache
          if (!sessionStorage.getItem('chunk_reload')) {
            sessionStorage.setItem('chunk_reload', '1');
            window.location.reload();
          }
          // Return a placeholder to prevent crash
          return { default: () => null };
        }
        return { default: component };
      })
      .catch((err) => {
        console.error('[LazyRetry] Chunk load failed, reloading page...', err);
        // Chunk failed to load — likely stale cache. Force reload once.
        if (!sessionStorage.getItem('chunk_reload')) {
          sessionStorage.setItem('chunk_reload', '1');
          window.location.reload();
        }
        // Return a placeholder to prevent crash loop
        return { default: () => null } as { default: React.ComponentType };
      }),
  );
}

// Clear the reload flag after successful page load
if (sessionStorage.getItem('chunk_reload')) {
  sessionStorage.removeItem('chunk_reload');
}

// ── Lazy-loaded views — each becomes a separate chunk for better performance ──
const LoginView = lazyRetry(() => import('./views/LoginView'), 'LoginView');
const HeuteView = lazyRetry(() => import('./views/HeuteView'), 'HeuteView');
const AuftraegeView = lazyRetry(() => import('./views/AuftraegeView'), 'AuftraegeView');
const AngeboteView = lazyRetry(() => import('./views/AngeboteView'), 'AngeboteView');
const PreisprofileView = lazyRetry(() => import('./views/PreisprofileView'), 'PreisprofileView');
const LieferantenView = lazyRetry(() => import('./views/LieferantenView'), 'LieferantenView');
const StatusView = lazyRetry(() => import('./views/StatusView'), 'StatusView');
const CustomersInquiriesView = lazyRetry(() => import('./views/CustomersInquiriesView'), 'CustomersInquiriesView');
const DocumentsInvoicesView = lazyRetry(() => import('./views/DocumentsInvoicesView'), 'DocumentsInvoicesView');
const SettingsView = lazyRetry(() => import('./views/SettingsView'), 'SettingsView');
const AdminDashboardView = lazyRetry(() => import('./views/AdminDashboardView'), 'AdminDashboardView');
const WawiDashboardView = lazyRetry(() => import('./views/wawi/WawiDashboardView'), 'WawiDashboardView');
const ArticleListView = lazyRetry(() => import('./views/wawi/ArticleListView'), 'ArticleListView');
const ArticleDetailView = lazyRetry(() => import('./views/wawi/ArticleDetailView'), 'ArticleDetailView');
const InventoryMovementView = lazyRetry(() => import('./views/wawi/InventoryMovementView'), 'InventoryMovementView');
const SupplierListView = lazyRetry(() => import('./views/wawi/SupplierListView'), 'SupplierListView');
const ReorderWizardView = lazyRetry(() => import('./views/wawi/ReorderWizardView'), 'ReorderWizardView');
const GoodsReceiptView = lazyRetry(() => import('./views/wawi/GoodsReceiptView'), 'GoodsReceiptView');
const ReportsView = lazyRetry(() => import('./views/wawi/ReportsView'), 'ReportsView');
const ReturnsView = lazyRetry(() => import('./views/wawi/ReturnsView'), 'ReturnsView');
const SupplierRatingView = lazyRetry(() => import('./views/wawi/SupplierRatingView'), 'SupplierRatingView');
const AIInsightsView = lazyRetry(() => import('./views/wawi/AIInsightsView'), 'AIInsightsView');
const TaxDashboardView = lazyRetry(() => import('./views/tax/TaxDashboardView'));
const InvoiceListView = lazyRetry(() => import('./views/tax/InvoiceListView'));
const TaxProfileCreateView = lazyRetry(() => import('./views/tax/TaxProfileCreateView'));


// ── View loading fallback ──
function ViewSuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Laden…</span>
      </div>
    </div>
  );
}

// ── Shared navigation helper ──
function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = useCallback((view: string) => {
    const isCurrentlyInWawi = location.pathname.startsWith('/wawi');

    const viewPaths: Record<string, string> = {
      heute: '/bot/heute',
      kunden: '/bot/kunden',
      angebote: '/bot/angebote',
      auftraege: '/bot/auftraege',
      preise: '/bot/preise',
      belege: '/bot/belege',
      lieferanten: isCurrentlyInWawi ? '/wawi/lieferanten' : '/bot/lieferanten',
      status: isCurrentlyInWawi ? '/wawi/berichte' : '/bot/status',
      settings: isCurrentlyInWawi ? '/wawi/setup' : '/bot/settings',
      warenwirtschaft: '/wawi/dashboard',
      bot_heute: '/bot/heute',
      artikel: '/wawi/artikel',
      lager: '/wawi/lager',
      nachbestellung: '/wawi/nachbestellung',
      wareneingang: '/wawi/wareneingang',
      retouren: '/wawi/retouren',
      bewertungen: '/wawi/bewertungen',
      'ki-insights': '/wawi/ki-insights',
      berichte: '/wawi/berichte',
      admin: '/bot/admin',
    };

    if (viewPaths[view]) {
      navigate(viewPaths[view]);
    }
  }, [navigate, location.pathname]);


  return handleNavigate;
}

function useActiveView() {
  const location = useLocation();

  const getActiveViewFromPath = (path: string) => {
    if (path.startsWith('/bot/heute')) return 'heute';
    if (path.startsWith('/bot/kunden')) return 'kunden';
    if (path.startsWith('/bot/auftraege')) return 'auftraege';
    if (path.startsWith('/bot/angebote')) return 'angebote';
    if (path.startsWith('/bot/preise')) return 'preise';
    if (path.startsWith('/bot/belege')) return 'belege';
    if (path.startsWith('/bot/lieferanten')) return 'lieferanten';
    if (path.startsWith('/bot/status')) return 'status';
    if (path.startsWith('/bot/settings')) return 'settings';
    if (path.startsWith('/bot/admin')) return 'admin';
    if (path.startsWith('/wawi/dashboard')) return 'warenwirtschaft';
    if (path.startsWith('/wawi/artikel')) return 'artikel';
    if (path.startsWith('/wawi/lieferanten')) return 'lieferanten';
    if (path.startsWith('/wawi/nachbestellung')) return 'nachbestellung';
    if (path.startsWith('/wawi/wareneingang')) return 'wareneingang';
    if (path.startsWith('/wawi/retouren')) return 'retouren';
    if (path.startsWith('/wawi/bewertungen')) return 'bewertungen';
    if (path.startsWith('/wawi/ki-insights')) return 'ki-insights';
    if (path.startsWith('/wawi/berichte')) return 'berichte';
    if (path.startsWith('/wawi/setup')) return 'settings';
    return 'heute';
  };

  return getActiveViewFromPath(location.pathname);
}

// ── Layout Shell (shared sidebar + header) — defined OUTSIDE App for stable identity ──

function AppShell() {
  const location = useLocation();
  const isWawi = location.pathname.startsWith('/wawi');
  const { logout } = useAuth();
  const { tenants, currentTenant, switchTenant } = useTenants();
  const { me } = useMe();
  const handleNavigate = useAppNavigate();
  const activeView = useActiveView();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, []);



  const handleOpenSettings = useCallback(() => {
    const event = new CustomEvent('open-settings');
    window.dispatchEvent(event);
  }, []);

  useKeyboardShortcuts({
    onNavigate: handleNavigate,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenSettings: handleOpenSettings,
  });

  useEffect(() => {
    const handleShowShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast.success('Willkommen im Dashboard! Drücke ⌘K für schnellen Zugriff.', { duration: 6000 });
        localStorage.setItem('hasSeenWelcome', 'true');
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground page-gradient">
      <DashboardSidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOwner={me?.user?.is_owner}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <DashboardHeader
        theme={theme}
        onThemeChange={handleThemeChange}
        userName={me?.user?.first_name ? `${me.user.first_name} ${me.user.last_name}` : me?.user?.username || "Admin"}
        userEmail={me?.user?.email || ""}
        companyName={currentTenant?.tenant_name || (isWawi ? "WAWI Port" : "Partsunion ERP")}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onNavigate={handleNavigate}
        tenants={tenants}
        currentTenant={currentTenant}
        onSwitchTenant={switchTenant}
        isWawi={isWawi}
        onLogout={logout}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
      />
      <main className="ml-0 md:ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-6 md:py-12">
          {isWawi && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">WAWI Workspace</h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>
          )}
          <Suspense fallback={<ViewSuspenseFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
        theme={theme}
      />
      <ShortcutsOverlay
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <ToastProvider theme={theme} />
    </div>
  );
}

// ── Single unified layout — stable identity, never remounts ──

function UnifiedLayout() {
  return <AppShell />;
}

// ── View wrappers for components that need onNavigate prop ──

function HeuteViewWithNav() {
  const handleNavigate = useAppNavigate();
  return <HeuteView onNavigate={handleNavigate} />;
}

function CustomersWithNav() {
  const handleNavigate = useAppNavigate();
  return <CustomersInquiriesView onNavigate={handleNavigate} />;
}

// ── Main App Component ──

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  // Show a loading spinner while auth state is being resolved.
  // Without this guard, isAuthenticated is false during init,
  // causing a premature LoginView render followed by a full tree swap
  // once auth resolves — which triggers React Error #130 in production.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Laden…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={<ViewSuspenseFallback />}>
          <LoginView />
        </Suspense>
        <ToastProvider theme="light" />
      </>
    );
  }

  return (
    <ErrorBoundary>
        <Routes>
          {/* All routes under ONE layout — sidebar/header never unmount */}
          <Route element={<UnifiedLayout />}>
            {/* Bot Workspace */}
            <Route path="/bot" element={<Navigate to="/bot/heute" replace />} />
            <Route path="/bot/heute" element={<HeuteViewWithNav />} />
            <Route path="/bot/kunden" element={<CustomersWithNav />} />
            <Route path="/bot/auftraege" element={<AuftraegeView />} />
            <Route path="/bot/angebote" element={<AngeboteView />} />
            <Route path="/bot/preise" element={<PreisprofileView />} />
            <Route path="/bot/belege" element={<DocumentsInvoicesView />} />
            <Route path="/bot/lieferanten" element={<LieferantenView />} />
            <Route path="/bot/status" element={<StatusView />} />
            <Route path="/bot/settings" element={<SettingsView />} />
            <Route path="/bot/admin" element={<AdminDashboardView />} />
            <Route path="/bot/tax" element={<Navigate to="/bot/tax/dashboard" replace />} />
            <Route path="/bot/tax/dashboard" element={<TaxDashboardView />} />
            <Route path="/bot/tax/profile/create" element={<TaxProfileCreateView />} />
            <Route path="/bot/tax/invoices" element={<InvoiceListView />} />

            {/* WAWI Workspace */}
            <Route path="/wawi" element={<Navigate to="/wawi/dashboard" replace />} />
            <Route path="/wawi/dashboard" element={<WawiDashboardView />} />
            <Route path="/wawi/artikel" element={<ArticleListView />} />
            <Route path="/wawi/artikel/:id" element={<ArticleDetailView />} />
            <Route path="/wawi/lager" element={<InventoryMovementView />} />
            <Route path="/wawi/lieferanten" element={<SupplierListView />} />
            <Route path="/wawi/nachbestellung" element={<ReorderWizardView />} />
            <Route path="/wawi/wareneingang" element={<GoodsReceiptView />} />
            <Route path="/wawi/retouren" element={<ReturnsView />} />
            <Route path="/wawi/bewertungen" element={<SupplierRatingView />} />
            <Route path="/wawi/ki-insights" element={<AIInsightsView />} />
            <Route path="/wawi/berichte" element={<ReportsView />} />
            <Route path="/wawi/setup" element={<SettingsView />} />
          </Route>

          {/* Catch all */}
          <Route path="/" element={<Navigate to="/bot/heute" replace />} />
          <Route path="*" element={<Navigate to="/bot/heute" replace />} />
        </Routes>
    </ErrorBoundary>
  );
}