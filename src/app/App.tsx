import { useState, useEffect, Suspense, lazy } from 'react';
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
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Lazy-loaded views for code splitting
const LoginView = lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));
const HeuteView = lazy(() => import('./views/HeuteView').then(m => ({ default: m.HeuteView })));
const AuftraegeView = lazy(() => import('./views/AuftraegeView').then(m => ({ default: m.AuftraegeView })));
const AngeboteView = lazy(() => import('./views/AngeboteView').then(m => ({ default: m.AngeboteView })));
const PreisprofileView = lazy(() => import('./views/PreisprofileView').then(m => ({ default: m.PreisprofileView })));
const LieferantenView = lazy(() => import('./views/LieferantenView').then(m => ({ default: m.LieferantenView })));
const StatusView = lazy(() => import('./views/StatusView').then(m => ({ default: m.StatusView })));
const CustomersInquiriesView = lazy(() => import('./views/CustomersInquiriesView').then(m => ({ default: m.CustomersInquiriesView })));
const DocumentsInvoicesView = lazy(() => import('./views/DocumentsInvoicesView').then(m => ({ default: m.DocumentsInvoicesView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));
const WawiDashboardView = lazy(() => import('./views/wawi/WawiDashboardView').then(m => ({ default: m.WawiDashboardView })));
const ArticleListView = lazy(() => import('./views/wawi/ArticleListView').then(m => ({ default: m.ArticleListView })));
const ArticleDetailView = lazy(() => import('./views/wawi/ArticleDetailView').then(m => ({ default: m.ArticleDetailView })));
const InventoryMovementView = lazy(() => import('./views/wawi/InventoryMovementView').then(m => ({ default: m.InventoryMovementView })));
const SupplierListView = lazy(() => import('./views/wawi/SupplierListView').then(m => ({ default: m.SupplierListView })));
const ReorderWizardView = lazy(() => import('./views/wawi/ReorderWizardView').then(m => ({ default: m.ReorderWizardView })));
const GoodsReceiptView = lazy(() => import('./views/wawi/GoodsReceiptView').then(m => ({ default: m.GoodsReceiptView })));
const ReportsView = lazy(() => import('./views/wawi/ReportsView').then(m => ({ default: m.ReportsView })));
const ReturnsView = lazy(() => import('./views/wawi/ReturnsView').then(m => ({ default: m.ReturnsView })));
const SupplierRatingView = lazy(() => import('./views/wawi/SupplierRatingView').then(m => ({ default: m.SupplierRatingView })));
const AIInsightsView = lazy(() => import('./views/wawi/AIInsightsView').then(m => ({ default: m.AIInsightsView })));
const TaxDashboardView = lazy(() => import('./views/tax/TaxDashboardView'));
const InvoiceListView = lazy(() => import('./views/tax/InvoiceListView'));
const TaxProfileCreateView = lazy(() => import('./views/tax/TaxProfileCreateView'));

// Suspense fallback component
function PageLoader() {
  return (
    <div className="space-y-6 p-12 animate-shimmer">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-5 w-64 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/50 rounded-xl border border-border" />
        ))}
      </div>
      <div className="h-80 bg-muted/30 rounded-xl border border-border" />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  // Define activeView based on path for backward compatibility with components
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
    return 'heute';
  };

  const activeView = getActiveViewFromPath(location.pathname);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedLanguage = localStorage.getItem('language') as 'de' | 'en' | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Welcome message
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast.success('Willkommen im Dashboard! Drücke ⌘K für schnellen Zugriff.', {
          duration: 6000,
        });
        localStorage.setItem('hasSeenWelcome', 'true');
      }, 500);
    }
  }, []);

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Handle language change
  const handleLanguageChange = (newLang: 'de' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Handle view navigation
  const handleNavigate = (view: string) => {
    // Check if we're currently in WAWI workspace
    const isCurrentlyInWawi = location.pathname.startsWith('/wawi');

    const viewPaths: Record<string, string> = {
      heute: '/bot/heute',
      kunden: '/bot/kunden',
      angebote: '/bot/angebote',
      auftraege: '/bot/auftraege',
      preise: '/bot/preise',
      belege: '/bot/belege',
      // Context-aware navigation for shared views
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
  };

  // Settings modal handler
  const handleOpenSettings = () => {
    const event = new CustomEvent('open-settings');
    window.dispatchEvent(event);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: handleNavigate,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenSettings: handleOpenSettings,
  });

  // Listen for custom events
  useEffect(() => {
    const handleShowShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { tenants, currentTenant, switchTenant, loading: tenantsLoading } = useTenants();
  const { me } = useMe();

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <LoginView />
        </Suspense>
        <ToastProvider theme={theme} />
      </>
    );
  }

  const BotLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background page-gradient">
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
        language={language}
        onLanguageChange={handleLanguageChange}
        userName={me?.user?.first_name ? `${me.user.first_name} ${me.user.last_name}` : me?.user?.username || "Admin"}
        userEmail={me?.user?.email || "admin@autoteile-assistent.com"}
        companyName={currentTenant?.tenant_name || "Autoteile ERP"}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onNavigate={handleNavigate}
        tenants={tenants}
        currentTenant={currentTenant}
        onSwitchTenant={switchTenant}
        onLogout={logout}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
      />
      <main className="ml-0 md:ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-6 md:py-12 animate-fade-in">
          {children}
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

  const WawiLayout = ({ children }: { children: React.ReactNode }) => (
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
        language={language}
        onLanguageChange={handleLanguageChange}
        userName={me?.user?.first_name ? `${me.user.first_name} ${me.user.last_name}` : me?.user?.username || "Admin"}
        userEmail={me?.user?.email || "admin@autoteile-assistent.com"}
        companyName={currentTenant?.tenant_name || "WAWI Port"}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onNavigate={handleNavigate}
        tenants={tenants}
        currentTenant={currentTenant}
        onSwitchTenant={switchTenant}
        isWawi={true}
        onLogout={logout}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
      />
      <main className="ml-0 md:ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-6 md:py-12 animate-fade-in">
          <div className="mb-8">
            <h2 className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">WAWI Workspace</h2>
            <div className="h-1 w-12 bg-primary rounded-full" />
          </div>
          {children}
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

  if (tenantsLoading) return <div className="p-20 text-center">Lade Accounts...</div>;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Bot Workspace */}
          <Route path="/bot" element={<Navigate to="/bot/heute" replace />} />
          <Route path="/bot/heute" element={<BotLayout><HeuteView onNavigate={handleNavigate} /></BotLayout>} />
          <Route path="/bot/kunden" element={<BotLayout><CustomersInquiriesView onNavigate={handleNavigate} /></BotLayout>} />
          <Route path="/bot/auftraege" element={<BotLayout><AuftraegeView /></BotLayout>} />
          <Route path="/bot/angebote" element={<BotLayout><AngeboteView /></BotLayout>} />
          <Route path="/bot/preise" element={<BotLayout><PreisprofileView /></BotLayout>} />
          <Route path="/bot/belege" element={<BotLayout><DocumentsInvoicesView /></BotLayout>} />
          <Route path="/bot/lieferanten" element={<BotLayout><LieferantenView /></BotLayout>} />
          <Route path="/bot/status" element={<BotLayout><StatusView /></BotLayout>} />
          <Route path="/bot/settings" element={<BotLayout><SettingsView /></BotLayout>} />
          <Route path="/bot/admin" element={<BotLayout><AdminDashboardView /></BotLayout>} />

          {/* WAWI Workspace */}
          <Route path="/wawi" element={<Navigate to="/wawi/dashboard" replace />} />
          <Route path="/wawi/dashboard" element={<WawiLayout><WawiDashboardView /></WawiLayout>} />
          <Route path="/wawi/artikel" element={<WawiLayout><ArticleListView /></WawiLayout>} />
          <Route path="/wawi/artikel/:id" element={<WawiLayout><ArticleDetailView /></WawiLayout>} />
          <Route path="/wawi/lager" element={<WawiLayout><InventoryMovementView /></WawiLayout>} />
          <Route path="/wawi/lieferanten" element={<WawiLayout><SupplierListView /></WawiLayout>} />
          <Route path="/wawi/nachbestellung" element={<WawiLayout><ReorderWizardView /></WawiLayout>} />
          <Route path="/wawi/wareneingang" element={<WawiLayout><GoodsReceiptView /></WawiLayout>} />
          <Route path="/wawi/retouren" element={<WawiLayout><ReturnsView /></WawiLayout>} />
          <Route path="/wawi/bewertungen" element={<WawiLayout><SupplierRatingView /></WawiLayout>} />
          <Route path="/wawi/ki-insights" element={<WawiLayout><AIInsightsView /></WawiLayout>} />
          <Route path="/wawi/berichte" element={<WawiLayout><ReportsView /></WawiLayout>} />
          <Route path="/wawi/setup" element={<WawiLayout><SettingsView /></WawiLayout>} />

          {/* Tax Module */}
          <Route path="/bot/tax" element={<Navigate to="/bot/tax/dashboard" replace />} />
          <Route path="/bot/tax/dashboard" element={<BotLayout><TaxDashboardView /></BotLayout>} />
          <Route path="/bot/tax/profile/create" element={<BotLayout><TaxProfileCreateView /></BotLayout>} />
          <Route path="/bot/tax/invoices" element={<BotLayout><InvoiceListView /></BotLayout>} />

          {/* Catch all */}
          <Route path="/" element={<Navigate to="/bot/heute" replace />} />
          <Route path="*" element={<Navigate to="/bot/heute" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}