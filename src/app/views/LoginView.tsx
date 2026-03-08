
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.error(t('login_enter_credentials'));
            return;
        }

        setLoading(true);
        setDeviceLimitError(null);

        try {
            const data = await apiLogin({
                email: identifier,
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
        } catch (err: any) {
            // Check for device limit error
            if (err.code === 'DEVICE_LIMIT_REACHED' || err.message?.includes('DEVICE_LIMIT_REACHED')) {
                setDeviceLimitError({
                    current_devices: err.current_devices || 0,
                    max_devices: err.max_devices || 2,
                    message: err.message || 'Gerätelimit erreicht',
                });
            } else {
                toast.error(err.message || t('login_failed'));
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
                            href="mailto:vertrieb@partsunion.de?subject=Gerätelimit%20erhöhen"
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
                                    className="pl-10"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
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
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
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
