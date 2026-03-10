
import { useState } from 'react';
import { login as apiLogin } from '../api/wws';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { User, Lock, Building2, Loader2, ShieldAlert, Phone } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../auth/AuthContext';

interface LoginViewProps {
    onLoginSuccess?: () => void;
}

interface DeviceLimitError {
    current_devices: number;
    max_devices: number;
    message: string;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
    const { t } = useI18n();
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [tenant, setTenant] = useState('');
    const [loading, setLoading] = useState(false);
    const [deviceLimitError, setDeviceLimitError] = useState<DeviceLimitError | null>(null);
    const [fieldError, setFieldError] = useState<{ field: 'identifier' | 'password' | 'general'; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);

        if (!identifier) {
            setFieldError({ field: 'identifier', message: 'Bitte Benutzername oder E-Mail eingeben' });
            return;
        }
        if (!password) {
            setFieldError({ field: 'password', message: 'Bitte Passwort eingeben' });
            return;
        }

        setLoading(true);
        setDeviceLimitError(null);

        try {
            // Send both username and email so Django can match either
            const isEmail = identifier.includes('@');
            const data = await apiLogin({
                email: isEmail ? identifier : undefined,
                username: !isEmail ? identifier : undefined,
                password,
                tenant: tenant || undefined,
            });

            if (!data.access) {
                throw new Error(t('login_failed'));
            }

            // Use AuthContext.login() — single source of truth
            login({
                access: data.access,
                refresh: data.refresh,
                user: data.user || {
                    id: '',
                    email: identifier,
                    username: identifier,
                    role: 'member',
                },
                tenant: data.tenant || null,
                expires_in: data.expires_in,
            });

            toast.success(t('login_success'));
            onLoginSuccess?.();
        } catch (err: unknown) {
            const e = (typeof err === 'object' && err !== null ? err : {}) as Record<string, unknown>;
            const errMsg = String(e.message || '');
            const errCode = String(e.code || '');
            // Check for device limit error
            if (errCode === 'DEVICE_LIMIT_REACHED' || errMsg.includes('DEVICE_LIMIT_REACHED')) {
                setDeviceLimitError({
                    current_devices: Number(e.current_devices) || 0,
                    max_devices: Number(e.max_devices) || 2,
                    message: errMsg || 'Gerätelimit erreicht',
                });
            } else {
                const msg = errMsg.toLowerCase();
                if (msg.includes('invalid credentials') || msg.includes('ungültige')) {
                    setFieldError({ field: 'password', message: 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.' });
                } else if (msg.includes('not a member') || msg.includes('tenant')) {
                    setFieldError({ field: 'general', message: 'Dieser Benutzer ist keinem Mandanten zugeordnet. Bitte kontaktieren Sie Ihren Administrator.' });
                } else if (msg.includes('not found') || msg.includes('no user')) {
                    setFieldError({ field: 'identifier', message: 'Benutzer nicht gefunden. Bitte überprüfen Sie Ihren Benutzernamen.' });
                } else {
                    setFieldError({ field: 'general', message: errMsg || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Paywall Screen ──────────────────────────────────────────
    if (deviceLimitError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 mb-6">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Gerätelimit erreicht
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Ihr Konto hat die maximale Anzahl gleichzeitiger Geräte erreicht.
                        </p>
                    </div>

                    <div className="bg-card border border-red-500/20 rounded-2xl p-6 shadow-xl space-y-4">
                        {/* Usage Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Aktive Geräte</span>
                                <span className="font-bold text-red-500">
                                    {deviceLimitError.current_devices} / {deviceLimitError.max_devices}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Für weitere Zugänge kontaktieren Sie Ihren Verkäufer
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Ihr aktuelles Paket erlaubt {deviceLimitError.max_devices} gleichzeitige Geräte.
                                Upgraden Sie Ihr Paket um weitere Mitarbeiter hinzuzufügen.
                            </p>
                        </div>

                        {/* Contact Sales Button */}
                        <a
                            href="mailto:info@partsunion.de?subject=Gerätelimit%20erhöhen"
                            className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                            Verkäufer kontaktieren
                        </a>

                        {/* Back to Login */}
                        <button
                            onClick={() => setDeviceLimitError(null)}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            ← Zurück zum Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login Form ──────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('login_title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('login_subtitle')}</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('login_identifier')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="admin"
                                    className={`pl-10 ${fieldError?.field === 'identifier' ? 'border-red-500 ring-1 ring-red-500/30' : ''}`}
                                    value={identifier}
                                    onChange={(e) => { setIdentifier(e.target.value); setFieldError(null); }}
                                    disabled={loading}
                                />
                            </div>
                            {fieldError?.field === 'identifier' && (
                                <p className="text-sm text-red-500 mt-1">{fieldError.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('login_password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className={`pl-10 ${fieldError?.field === 'password' ? 'border-red-500 ring-1 ring-red-500/30' : ''}`}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
                                    disabled={loading}
                                />
                            </div>
                            {fieldError?.field === 'password' && (
                                <p className="text-sm text-red-500 mt-1">{fieldError.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('login_tenant')}
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="demo"
                                    className="pl-10"
                                    value={tenant}
                                    onChange={(e) => setTenant(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {fieldError?.field === 'general' && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-500">
                                {fieldError.message}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('login_logging_in')}
                                </>
                            ) : (
                                t('login')
                            )}
                        </Button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('login_no_account')}
                    </p>
                </div>
            </div>
        </div>
    );
}
