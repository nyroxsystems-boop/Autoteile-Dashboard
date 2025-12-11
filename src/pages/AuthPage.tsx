import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { languageOptions, useI18n } from '../i18n';

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Erzwinge das helle Theme auf der Login-Seite, damit Farben/Buttons wie im Mock bleiben
  useEffect(() => {
    const prevTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = 'light';
    return () => {
      if (prevTheme) document.documentElement.dataset.theme = prevTheme;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!merchantId) return setError('Bitte gib deine Merchant-ID ein.');
    if (!password) return setError('Bitte gib dein Passwort ein.');
    let ok = false;
    try {
      if (isRegister) ok = await auth.register(merchantId.trim(), password);
      else ok = await auth.login(merchantId.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
      return;
    }
    if (!ok)
      return setError(
        isRegister
          ? 'Registrierung fehlgeschlagen. Existiert der Account bereits?'
          : 'Login fehlgeschlagen. Bitte prüfe deine Eingaben.'
      );
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        // Festes, ruhiges Gradient-Backdrop wie im gewünschten Preview
        background:
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12), transparent 34%), ' +
          'radial-gradient(circle at 80% 10%, rgba(16,185,129,0.12), transparent 30%), ' +
          'radial-gradient(circle at 50% 90%, rgba(79,139,255,0.08), transparent 38%), ' +
          '#e9f2f9'
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
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
                background: '#ffffff',
                border: '1px solid #d1d9e6',
                borderRadius: 12,
                boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
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
                  border: '1px solid #d1d9e6',
                  padding: '8px 10px',
                  background: '#f8fbff',
                  color: '#0f172a'
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
                        border: '1px solid #d1d9e6',
                        borderRadius: 10,
                        padding: '8px 10px',
                        background: l.code === lang ? 'rgba(79,139,255,0.14)' : 'transparent',
                        color: '#0f172a',
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
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        <Card
          title="Anmelden im PartsBot-Dashboard"
          subtitle="Verwalte deine Anfragen, Bestellungen und Händler an einem Ort."
          className="ui-card-padded"
        >
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="button"
                variant={!isRegister ? 'primary' : 'ghost'}
                fullWidth
                onClick={() => setIsRegister(false)}
              >
                Einloggen
              </Button>
              <Button
                type="button"
                variant={isRegister ? 'primary' : 'ghost'}
                fullWidth
                onClick={() => setIsRegister(true)}
              >
                Account erstellen
              </Button>
            </div>

            <Input
              label="Merchant-ID"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="z.B. demo-haendler"
            />
            <Input
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••"
            />

            {error ? <div className="error-box">{error}</div> : null}

            <Button type="submit" variant="primary" fullWidth>
              {isRegister ? 'Account erstellen' : 'Einloggen'}
            </Button>

            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {isRegister ? 'Schon einen Account?' : 'Noch keinen Account?'}{' '}
              <button
                type="button"
                onClick={() => setIsRegister((v) => !v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isRegister ? 'Zum Login' : 'Jetzt registrieren'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
