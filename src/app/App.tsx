import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { ToastProvider } from './components/ToastProvider';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTenants } from './hooks/useTenants';
import { useMe } from './hooks/useMe';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HeuteView } from './views/HeuteView';
import { LoginView } from './views/LoginView';
import { AuftraegeView } from './views/AuftraegeView';
import { AngeboteView } from './views/AngeboteView';
import { PreisprofileView } from './views/PreisprofileView';
import { LieferantenView } from './views/LieferantenView';
import { StatusView } from './views/StatusView';
import { CustomersInquiriesView } from './views/CustomersInquiriesView';
import { DocumentsInvoicesView } from './views/DocumentsInvoicesView';
import { WawiDashboardView } from './views/wawi/WawiDashboardView';
import { ArticleListView } from './views/wawi/ArticleListView';
import { ArticleDetailView } from './views/wawi/ArticleDetailView';
import { InventoryMovementView } from './views/wawi/InventoryMovementView';
import { SupplierListView } from './views/wawi/SupplierListView';
import { ReorderWizardView } from './views/wawi/ReorderWizardView';
import { GoodsReceiptView } from './views/wawi/GoodsReceiptView';
import { ReportsView } from './views/wawi/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AdminDashboardView } from './views/AdminDashboardView';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));

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
    const viewPaths: Record<string, string> = {
      heute: '/bot/heute',
      kunden: '/bot/kunden',
      angebote: '/bot/angebote',
      auftraege: '/bot/auftraege',
      preise: '/bot/preise',
      belege: '/bot/belege',
      lieferanten: '/bot/lieferanten',
      status: '/bot/status',
      warenwirtschaft: '/wawi/dashboard',
      bot_heute: '/bot/heute',
      artikel: '/wawi/artikel',
      lager: '/wawi/lager',
      einkauf: '/wawi/einkauf',
      lieferanten: '/wawi/lieferanten',
      nachbestellung: '/wawi/nachbestellung',
      wareneingang: '/wawi/wareneingang',
      berichte: '/wawi/berichte',
      admin: '/bot/admin',
      settings: '/bot/settings',
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

  const { tenants, currentTenant, switchTenant, loading: tenantsLoading } = useTenants();
  const { me } = useMe();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
        <ToastProvider theme={theme} />
      </>
    );
  }

  const BotLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOwner={me?.user?.is_owner}
        botStatus="online"
        environment={currentTenant ? 'live' : 'demo'}
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
      />
      <main className="ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-12 py-12">
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
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOwner={me?.user?.is_owner}
        botStatus="online"
        environment={currentTenant ? 'live' : 'demo'}
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
      />
      <main className="ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-12 py-12">
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
      <Route path="/wawi/berichte" element={<WawiLayout><ReportsView /></WawiLayout>} />

      {/* Catch all - Redirect to Bot */}
      <Route path="/" element={<Navigate to="/bot/heute" replace />} />
      <Route path="*" element={<Navigate to="/bot/heute" replace />} />
    </Routes>
  );
}