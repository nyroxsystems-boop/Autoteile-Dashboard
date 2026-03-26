
import { useState } from 'react';
import { login as apiLogin } from '../api/wws';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { User, Lock, Building2, Loader2, ShieldAlert, Phone, Sparkles, Shield, Globe, Zap } from 'lucide-react';
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
            setFieldError({ field: 'identifier', message: t('login_error_identifier') });
            return;
        }
        if (!password) {
            setFieldError({ field: 'password', message: t('login_error_password_required') });
            return;
        }

        setLoading(true);
        setDeviceLimitError(null);

        try {
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

            login({
                access: data.access,
                refresh: data.jwt?.refreshToken || data.refresh,
                user: data.user || {
                    id: '',
                    email: identifier,
                    username: identifier,
                    role: 'member',
                },
                tenant: data.tenant || null,
                expires_in: data.jwt?.expiresIn || data.expires_in,
            });

            toast.success(t('login_success'));
            onLoginSuccess?.();
        } catch (err: unknown) {
            const e = (typeof err === 'object' && err !== null ? err : {}) as Record<string, unknown>;
            const errMsg = String(e.message || '');
            const errCode = String(e.code || '');
            if (errCode === 'DEVICE_LIMIT_REACHED' || errMsg.includes('DEVICE_LIMIT_REACHED')) {
                setDeviceLimitError({
                    current_devices: Number(e.current_devices) || 0,
                    max_devices: Number(e.max_devices) || 2,
                    message: errMsg || t('login_error_device_limit'),
                });
            } else {
                const msg = errMsg.toLowerCase();
                if (msg.includes('invalid credentials') || msg.includes('ungültige')) {
                    setFieldError({ field: 'password', message: t('login_error_invalid') });
                } else if (msg.includes('not a member') || msg.includes('tenant')) {
                    setFieldError({ field: 'general', message: t('login_error_no_tenant') });
                } else if (msg.includes('not found') || msg.includes('no user')) {
                    setFieldError({ field: 'identifier', message: t('login_error_not_found') });
                } else {
                    setFieldError({ field: 'general', message: t('login_error_generic') });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Device Limit Screen ──────────────────────────────────────
    if (deviceLimitError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="w-full max-w-md space-y-6 animate-fade-in-up">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 mb-6">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {t('login_error_device_limit')}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {t('login_device_limit_desc')}
                        </p>
                    </div>

                    <div className="bg-card border border-red-500/20 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('login_active_devices')}</span>
                                <span className="font-bold text-red-500">
                                    {deviceLimitError.current_devices} / {deviceLimitError.max_devices}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                {t('login_contact_sales')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('login_device_limit_upgrade')}
                            </p>
                        </div>

                        <a
                            href="mailto:info@partsunion.de?subject=Gerätelimit%20erhöhen"
                            className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                            {t('login_contact_sales_btn')}
                        </a>

                        <button
                            onClick={() => setDeviceLimitError(null)}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            ← {t('login_back')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login ──────────────────────────────────────────────
    return (
        <div className="min-h-screen flex">
            {/* Left: Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(240 80% 40%) 50%, hsl(280 65% 35%) 100%)',
            }}>
                {/* Animated background shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse-soft" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo */}
                    <div className="animate-fade-in">
                        <img src="/logo.png" alt="PartsUnion" className="h-10 brightness-0 invert" />
                    </div>
                    {/* Main message */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight leading-tight">
                                {t('login_branding_title')}
                            </h2>
                            <p className="text-white/70 text-lg mt-4 max-w-md leading-relaxed">
                                {t('login_branding_subtitle')}
                            </p>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                {t('login_pill_ai_bot')}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                                <Globe className="w-4 h-4 text-emerald-300" />
                                {t('login_pill_multi_tenant')}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                                <Zap className="w-4 h-4 text-sky-300" />
                                {t('login_pill_realtime')}
                            </div>
                        </div>
                    </div>

                    {/* Trust signals */}
                    <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-6 text-white/40 text-xs">
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                {t('login_trust_gdpr')}
                            </div>
                            <div>•</div>
                            <div>{t('login_trust_uptime')}</div>
                            <div>•</div>
                            <div>{t('login_trust_enterprise')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-12">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    {/* Mobile logo (hidden on lg+) */}
                    <div className="text-center lg:hidden mb-4">
                        <img src="/logo.png" alt="PartsUnion" className="h-10 mx-auto" />
                    </div>

                    {/* Desktop title */}
                    <div className="hidden lg:block">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('login_title')}</h1>
                        <p className="text-muted-foreground mt-2">{t('login_subtitle')}</p>
                    </div>

                    {/* Mobile title */}
                    <div className="lg:hidden text-center">
                        <p className="text-muted-foreground">{t('login_subtitle')}</p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    {t('login_identifier')}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="name@company.com"
                                        className={`pl-10 h-11 ${fieldError?.field === 'identifier' ? 'border-red-500 ring-1 ring-red-500/30' : ''}`}
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
                                <label className="text-sm font-medium leading-none">
                                    {t('login_password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className={`pl-10 h-11 ${fieldError?.field === 'password' ? 'border-red-500 ring-1 ring-red-500/30' : ''}`}
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
                                <label className="text-sm font-medium leading-none">
                                    {t('login_tenant')}
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="company-name"
                                        className="pl-10 h-11"
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

                            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading} style={{
                                background: loading ? undefined : 'linear-gradient(135deg, hsl(221 83% 53%), hsl(240 80% 50%))',
                            }}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('login_logging_in')}
                                    </>
                                ) : (
                                    t('login')
                                )}
                            </Button>

                            <div className="text-right">
                                <a
                                    href="mailto:support@partsunion.de?subject=Passwort%20zurücksetzen"
                                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                    {t('login_forgot_password')}
                                </a>
                            </div>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            {t('login_no_account')}{' '}
                            <a
                                href="mailto:info@partsunion.de?subject=Neues%20Konto%20erstellen"
                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                {t('login_contact_us')}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
