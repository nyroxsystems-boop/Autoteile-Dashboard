import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { I18nProvider, useI18n, languageOptions } from './i18n';
import Button from './ui/Button';
import Badge from './ui/Badge';

const navItems = [
  { path: '/', label: 'Übersicht' },
  { path: '/orders', label: 'Bestellungen' },
  { path: '/wws', label: 'Warenwirtschaftssystem' }
];

const pageTitleMap: Record<string, string> = {
  '/': 'Übersicht',
  '/orders': 'Bestellungen',
  '/orders/': 'Bestellungen',
  '/wws': 'Warenwirtschaftssystem'
};

const App: React.FC = () => (
  <I18nProvider>
    <InnerApp />
  </I18nProvider>
);

const InnerApp: React.FC = () => {
  const location = useLocation();
  const auth = useAuth();
  const { t, lang, setLang } = useI18n();
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Top-right Profilmenü statt Sidebar
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const [langSearch, setLangSearch] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const pageTitle =
    pageTitleMap[location.pathname] ||
    (location.pathname.startsWith('/orders/') ? 'Bestelldetails' : t('brandTitle'));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" />
          <div>
            <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>PartsBot Dashboard</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t('brandSubtitle')}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => ['sidebar-link', isActive ? 'active' : ''].join(' ')}
            >
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-actions">
            <div style={{ position: 'relative' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLangMenu((v) => !v)}
                aria-label="Sprache wählen"
                style={{ minWidth: 120, justifyContent: 'space-between', display: 'inline-flex' }}
              >
                {languageOptions.find((l) => l.code === lang)?.label ?? 'Sprache'}
                <span style={{ marginLeft: 6, opacity: 0.7 }}>▾</span>
              </Button>
              {showLangMenu ? (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 42,
                    width: 220,
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                    padding: 10,
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <input
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Sprache suchen..."
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text)'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                    {languageOptions
                      .filter((l) =>
                        (l.label + l.code)
                          .toLowerCase()
                          .includes(langSearch.trim().toLowerCase())
                      )
                      .map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLang(l.code as any);
                            setShowLangMenu(false);
                            setLangSearch('');
                          }}
                          style={{
                            textAlign: 'left',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '8px 10px',
                            background: l.code === lang ? 'rgba(79,139,255,0.12)' : 'transparent',
                            color: 'var(--text)',
                            cursor: 'pointer'
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? 'Hell' : 'Dunkel'}
            </Button>
            {auth?.session ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((v) => !v)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #334155, #1e293b)',
                    border: '1px solid var(--border)',
                    color: '#e2e8f0',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  aria-label="Profilmenü öffnen"
                >
                  {auth.session.merchantId?.slice(0, 2).toUpperCase()}
                </button>
                {showProfileMenu ? (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 46,
                      minWidth: 200,
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      zIndex: 15
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{auth.session.merchantId}</div>
                    <Badge variant="success">Plan aktiv</Badge>
                    <Button variant="ghost" size="sm" fullWidth>
                      Marge & Shops
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth>
                      Billing & Konto
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth>
                      Mitarbeiteraccounts
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth onClick={() => auth.logout()}>
                      {t('logout')}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default App;
