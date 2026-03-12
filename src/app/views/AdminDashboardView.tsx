import { useState, useEffect } from 'react';
import {
    Users, Shield, Smartphone, Activity, Server,
    Globe, LogOut, Plus, X,
    Settings, RefreshCcw
} from 'lucide-react';
import { getAdminStats, listActiveDevices, removeActiveDevice, updateTenantLimits, createTenantUser, AdminStats, ActiveDevice } from '../api/wws';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';

interface TenantInfo {
    id: number;
    name: string;
    slug: string;
    user_count: number;
    max_users: number;
    device_count: number;
    max_devices: number;
    is_active: boolean;
}

export function AdminDashboardView() {
    const { t } = useI18n();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
    const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showLimitsModal, setShowLimitsModal] = useState(false);
    const [limitsTenant, setLimitsTenant] = useState<TenantInfo | null>(null);
    const [limitsMaxUsers, setLimitsMaxUsers] = useState(0);
    const [limitsMaxDevices, setLimitsMaxDevices] = useState(0);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getAdminStats();
            setStats(data);
        } catch (_err: unknown) {
            toast.error(t('admin_error_loading'));
        } finally {
            setLoading(false);
        }
    };

    const loadDevices = async (tenantId: number) => {
        try {
            const data = await listActiveDevices(tenantId);
            setActiveDevices(data);
        } catch (_err) {
            toast.error(t('admin_error_devices'));
        }
    };

    const handleRemoveDevice = async (tenantId: number, deviceId: string) => {
        try {
            await removeActiveDevice(tenantId, deviceId);
            toast.success(t('admin_device_removed'));
            loadDevices(tenantId);
            loadStats();
        } catch (_err) {
            toast.error(t('admin_error_remove_device'));
        }
    };

    const handleUpdateLimits = async () => {
        if (!limitsTenant) return;
        try {
            await updateTenantLimits(limitsTenant.id, { max_users: limitsMaxUsers, max_devices: limitsMaxDevices });
            toast.success(t('admin_limits_updated'));
            setShowLimitsModal(false);
            loadStats();
        } catch (_err) {
            toast.error(t('admin_error_update_limits'));
        }
    };

    const handleCreateUser = async () => {
        if (!selectedTenant) return;
        try {
            await createTenantUser(selectedTenant.id, {
                email: newUserEmail,
                username: newUsername,
                password: newUserPassword,
                role: 'TENANT_ADMIN'
            });
            toast.success(t('admin_user_created'));
            setShowUserModal(false);
            setNewUserEmail('');
            setNewUsername('');
            setNewUserPassword('');
            loadStats();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t('admin_error_create_user'));
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center p-20">
                <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    {t('admin_title')}
                </h1>
                <p className="text-muted-foreground">{t('admin_subtitle')}</p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('admin_active_tenants')}</p>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.total_tenants}</h3>
                        </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-2/3" />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('admin_total_users')}</p>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.total_users}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Smartphone className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('admin_active_devices')}</p>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.total_devices}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenant Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-lg">{t('admin_tenant_overview')}</h3>
                    <button onClick={loadStats} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t('admin_tenant_shop')}</th>
                                <th className="px-6 py-4">{t('admin_users')}</th>
                                <th className="px-6 py-4">{t('admin_devices')}</th>
                                <th className="px-6 py-4">{t('orders_status')}</th>
                                <th className="px-6 py-4 text-right">{t('prices_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats?.tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{tenant.name}</div>
                                        <div className="text-xs text-muted-foreground">{tenant.slug}.autoteile-assistent.de</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={tenant.user_count >= tenant.max_users ? 'text-red-500 font-bold' : ''}>
                                                {tenant.user_count}
                                            </span>
                                            <span className="text-muted-foreground">/ {tenant.max_users}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={tenant.device_count >= tenant.max_devices ? 'text-red-500 font-bold' : ''}>
                                                {tenant.device_count}
                                            </span>
                                            <span className="text-muted-foreground">/ {tenant.max_devices}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.is_active ? (
                                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">{t('admin_status_active')}</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">{t('admin_status_inactive')}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setSelectedTenant(tenant as TenantInfo);
                                                    loadDevices(tenant.id);
                                                }}
                                                className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
                                                title={t('admin_manage_devices')}
                                            >
                                                <Smartphone className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedTenant(tenant as TenantInfo);
                                                    setShowUserModal(true);
                                                }}
                                                className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
                                                title={t('admin_create_user')}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const t = tenant as TenantInfo;
                                                    setLimitsTenant(t);
                                                    setLimitsMaxUsers(t.max_users);
                                                    setLimitsMaxDevices(t.max_devices);
                                                    setShowLimitsModal(true);
                                                }}
                                                className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
                                                title={t('admin_adjust_limits')}
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Device Management Section */}
            {selectedTenant && !showUserModal && (
                <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{t('admin_active_devices_for')}: {selectedTenant.name}</h3>
                        <button onClick={() => setSelectedTenant(null)} className="text-sm text-muted-foreground hover:text-foreground">{t('admin_close')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeDevices.map(device => (
                            <div key={device.id} className="bg-card border border-border rounded-xl p-4 relative group">
                                <button
                                    onClick={() => handleRemoveDevice(selectedTenant.id, device.device_id)}
                                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Smartphone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground">{device.user}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{device.device_id}</div>
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        <span>{t('admin_last_seen')}: {new Date(device.last_seen).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Server className="w-3 h-3" />
                                        <span>IP: {device.ip}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activeDevices.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                                {t('admin_no_devices')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Limits Modal — replaces window.prompt() */}
            {showLimitsModal && limitsTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">{t('admin_adjust_limits')}</h3>
                            <button onClick={() => setShowLimitsModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tenant</label>
                                <input disabled value={limitsTenant.name} className="w-full px-4 py-2 bg-muted border border-border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin_max_users')}</label>
                                <input
                                    type="number"
                                    value={limitsMaxUsers}
                                    onChange={e => setLimitsMaxUsers(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin_max_devices')}</label>
                                <input
                                    type="number"
                                    value={limitsMaxDevices}
                                    onChange={e => setLimitsMaxDevices(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    min={1}
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setShowLimitsModal(false)}
                                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleUpdateLimits}
                                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {t('admin_save_limits')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Create Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">{t('admin_new_user')}</h3>
                            <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tenant</label>
                                <input disabled value={selectedTenant?.name || ''} className="w-full px-4 py-2 bg-muted border border-border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin_email')}</label>
                                <input
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin_username')}</label>
                                <input
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="v.lastname"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('login_password')}</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleCreateUser}
                                className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {t('admin_create_user')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
