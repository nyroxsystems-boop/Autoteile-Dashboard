import { useState, useEffect, useMemo } from 'react';
import {
    Users, Shield, Smartphone, Activity, Server,
    Globe, LogOut, Plus, X, Search,
    Settings, RefreshCcw, TrendingUp, ShoppingCart,
    MessageSquare, Hash, Building2, UserPlus,
    ChevronDown, ChevronUp, Eye, Phone
} from 'lucide-react';
import {
    getAdminStats, listActiveDevices, removeActiveDevice,
    updateTenantLimits, createTenantUser, createTenant,
    getAdminKpis, AdminStats, ActiveDevice, AdminKpis
} from '../api/wws';
import { ErrorState } from '../components/ErrorState';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';

// ── Types ───────────────────────────────────────────────────────────────────
interface TenantInfo {
    id: number;
    name: string;
    slug: string;
    user_count: number;
    max_users: number;
    device_count: number;
    max_devices: number;
    is_active: boolean;
    onboarding_status?: string;
    payment_status?: string;
    whatsapp_number?: string;
}

type Tab = 'haendler' | 'kpis' | 'system';

// ── Main Component ──────────────────────────────────────────────────────────
export function AdminDashboardView() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>('haendler');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [kpis, setKpis] = useState<AdminKpis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(false);
            const [statsData, kpisData] = await Promise.all([
                getAdminStats().catch(() => null),
                getAdminKpis().catch(() => null),
            ]);
            if (statsData) setStats(statsData);
            if (kpisData) setKpis(kpisData);
            if (!statsData && !kpisData) setError(true);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center p-20">
                <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !stats) return <ErrorState onRetry={loadData} />;

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'haendler', label: 'Händler', icon: Building2 },
        { id: 'kpis', label: 'KPIs', icon: TrendingUp },
        { id: 'system', label: 'System', icon: Server },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        {t('admin_title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">{t('admin_subtitle')}</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-border"
                    title="Aktualisieren"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Globe} label={t('admin_active_tenants')} value={stats?.total_tenants ?? 0} color="primary" />
                <StatCard icon={Users} label={t('admin_total_users')} value={stats?.total_users ?? 0} color="blue" />
                <StatCard icon={Smartphone} label={t('admin_active_devices')} value={stats?.total_devices ?? 0} color="purple" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'haendler' && <HaendlerTab stats={stats} onRefresh={loadData} />}
            {activeTab === 'kpis' && <KpisTab kpis={kpis} stats={stats} />}
            {activeTab === 'system' && <SystemTab stats={stats} onRefresh={loadData} />}
        </div>
    );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
        green: 'bg-emerald-500/10 text-emerald-500',
        orange: 'bg-orange-500/10 text-orange-500',
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1: HÄNDLER
// ════════════════════════════════════════════════════════════════════════════
function HaendlerTab({ stats, onRefresh }: { stats: AdminStats | null; onRefresh: () => void }) {
    const { t } = useI18n();
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showLimitsModal, setShowLimitsModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
    const [expandedTenant, setExpandedTenant] = useState<number | null>(null);
    const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

    // Limits modal state
    const [limitsMaxUsers, setLimitsMaxUsers] = useState(10);
    const [limitsMaxDevices, setLimitsMaxDevices] = useState(5);

    // User modal state
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    // Create tenant state
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantEmail, setNewTenantEmail] = useState('');
    const [newTenantPhone, setNewTenantPhone] = useState('');
    const [newTenantPassword, setNewTenantPassword] = useState('');
    const [creatingTenant, setCreatingTenant] = useState(false);

    const tenants = useMemo(() => {
        if (!stats?.tenants) return [];
        if (!search) return stats.tenants;
        const q = search.toLowerCase();
        return stats.tenants.filter(t =>
            t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
        );
    }, [stats?.tenants, search]);

    const loadDevices = async (tenantId: number) => {
        try {
            const data = await listActiveDevices(tenantId);
            setActiveDevices(data);
        } catch {
            toast.error('Geräte konnten nicht geladen werden');
        }
    };

    const handleExpand = (tenant: TenantInfo) => {
        if (expandedTenant === tenant.id) {
            setExpandedTenant(null);
        } else {
            setExpandedTenant(tenant.id);
            loadDevices(tenant.id);
        }
    };

    const handleRemoveDevice = async (tenantId: number, deviceId: string) => {
        try {
            await removeActiveDevice(tenantId, deviceId);
            toast.success(t('admin_device_removed'));
            loadDevices(tenantId);
            onRefresh();
        } catch {
            toast.error('Gerät konnte nicht entfernt werden');
        }
    };

    const handleUpdateLimits = async () => {
        if (!selectedTenant) return;
        try {
            await updateTenantLimits(selectedTenant.id, { max_users: limitsMaxUsers, max_devices: limitsMaxDevices });
            toast.success(t('admin_limits_updated'));
            setShowLimitsModal(false);
            onRefresh();
        } catch {
            toast.error('Limits konnten nicht aktualisiert werden');
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
            setNewUserEmail(''); setNewUsername(''); setNewUserPassword('');
            onRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Fehler beim Erstellen');
        }
    };

    const handleCreateTenant = async () => {
        if (!newTenantName || !newTenantEmail) {
            toast.error('Name und E-Mail sind erforderlich');
            return;
        }
        try {
            setCreatingTenant(true);
            const result = await createTenant({
                name: newTenantName,
                email: newTenantEmail,
                phone: newTenantPhone || undefined,
                password: newTenantPassword || undefined,
                whatsapp_number: newTenantPhone || undefined,
            });
            toast.success(`Händler "${newTenantName}" erstellt!`);
            if (result?.user_created?.initial_password) {
                toast.info(`Passwort: ${result.user_created.initial_password}`, { duration: 15000 });
            }
            setShowCreateModal(false);
            setNewTenantName(''); setNewTenantEmail(''); setNewTenantPhone(''); setNewTenantPassword('');
            onRefresh();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Fehler beim Erstellen');
        } finally {
            setCreatingTenant(false);
        }
    };

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Händler suchen..."
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Händler anlegen
                </button>
            </div>

            {/* Results count */}
            <p className="text-xs text-muted-foreground">
                {tenants.length} Händler{search && ` (gefiltert von ${stats?.tenants?.length || 0})`}
            </p>

            {/* Tenant Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5">Händler</th>
                                <th className="px-6 py-3.5">Benutzer</th>
                                <th className="px-6 py-3.5">Geräte</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map((tenant) => (
                                <TenantRow
                                    key={tenant.id}
                                    tenant={tenant as TenantInfo}
                                    isExpanded={expandedTenant === tenant.id}
                                    devices={expandedTenant === tenant.id ? activeDevices : []}
                                    onToggleExpand={() => handleExpand(tenant as TenantInfo)}
                                    onManageDevices={(t) => handleExpand(t)}
                                    onCreateUser={(t) => { setSelectedTenant(t); setShowUserModal(true); }}
                                    onEditLimits={(t) => {
                                        setSelectedTenant(t);
                                        setLimitsMaxUsers(t.max_users);
                                        setLimitsMaxDevices(t.max_devices);
                                        setShowLimitsModal(true);
                                    }}
                                    onRemoveDevice={handleRemoveDevice}
                                />
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                                        {search ? 'Keine Händler gefunden' : 'Noch keine Händler vorhanden'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Tenant Modal */}
            {showCreateModal && (
                <Modal title="Neuen Händler anlegen" onClose={() => setShowCreateModal(false)}>
                    <div className="space-y-4">
                        <InputField label="Firmenname *" value={newTenantName} onChange={setNewTenantName} placeholder="Autohaus Müller GmbH" />
                        <InputField label="E-Mail *" value={newTenantEmail} onChange={setNewTenantEmail} placeholder="info@autohaus-mueller.de" type="email" />
                        <InputField label="Telefon / WhatsApp" value={newTenantPhone} onChange={setNewTenantPhone} placeholder="+49 170 1234567" />
                        <InputField label="Passwort (optional)" value={newTenantPassword} onChange={setNewTenantPassword} placeholder="Wird automatisch generiert" type="password" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm">
                            Abbrechen
                        </button>
                        <button
                            onClick={handleCreateTenant}
                            disabled={creatingTenant || !newTenantName || !newTenantEmail}
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
                        >
                            {creatingTenant ? 'Wird erstellt...' : 'Händler erstellen'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Limits Modal */}
            {showLimitsModal && selectedTenant && (
                <Modal title={t('admin_adjust_limits')} onClose={() => setShowLimitsModal(false)}>
                    <div className="space-y-4">
                        <InputField label="Tenant" value={selectedTenant.name} onChange={() => {}} disabled />
                        <InputField label={t('admin_max_users')} value={String(limitsMaxUsers)} onChange={v => setLimitsMaxUsers(Number(v))} type="number" />
                        <InputField label={t('admin_max_devices')} value={String(limitsMaxDevices)} onChange={v => setLimitsMaxDevices(Number(v))} type="number" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setShowLimitsModal(false)} className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm">{t('cancel')}</button>
                        <button onClick={handleUpdateLimits} className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">{t('admin_save_limits')}</button>
                    </div>
                </Modal>
            )}

            {/* User Create Modal */}
            {showUserModal && selectedTenant && (
                <Modal title={t('admin_new_user')} onClose={() => setShowUserModal(false)}>
                    <div className="space-y-4">
                        <InputField label="Tenant" value={selectedTenant.name} onChange={() => {}} disabled />
                        <InputField label={t('admin_email')} value={newUserEmail} onChange={setNewUserEmail} placeholder="email@example.com" />
                        <InputField label={t('admin_username')} value={newUsername} onChange={setNewUsername} placeholder="v.nachname" />
                        <InputField label={t('login_password')} value={newUserPassword} onChange={setNewUserPassword} type="password" />
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm">{t('cancel')}</button>
                        <button onClick={handleCreateUser} className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">{t('admin_create_user')}</button>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ── Tenant Row with expandable device section ───────────────────────────────
function TenantRow({
    tenant, isExpanded, devices, onToggleExpand, onManageDevices: _onManageDevices, onCreateUser, onEditLimits, onRemoveDevice
}: {
    tenant: TenantInfo;
    isExpanded: boolean;
    devices: ActiveDevice[];
    onToggleExpand: () => void;
    onManageDevices: (t: TenantInfo) => void;
    onCreateUser: (t: TenantInfo) => void;
    onEditLimits: (t: TenantInfo) => void;
    onRemoveDevice: (tenantId: number, deviceId: string) => void;
}) {
    return (
        <>
            <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-medium text-foreground">{tenant.name}</div>
                            <div className="text-xs text-muted-foreground">{tenant.slug}.autoteile-assistent.de</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <UsageBar current={tenant.user_count} max={tenant.max_users} />
                </td>
                <td className="px-6 py-4">
                    <UsageBar current={tenant.device_count} max={tenant.max_devices} />
                </td>
                <td className="px-6 py-4">
                    {tenant.is_active ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Aktiv</span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">Inaktiv</span>
                    )}
                </td>
                <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                        <ActionButton icon={isExpanded ? ChevronUp : ChevronDown} onClick={onToggleExpand} title="Geräte anzeigen" />
                        <ActionButton icon={UserPlus} onClick={() => onCreateUser(tenant)} title="Benutzer erstellen" />
                        <ActionButton icon={Settings} onClick={() => onEditLimits(tenant)} title="Limits bearbeiten" />
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={5} className="bg-muted/20 px-6 py-4">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Aktive Geräte</div>
                        {devices.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {devices.map(device => (
                                    <div key={device.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Smartphone className="w-4 h-4 text-primary" />
                                            <div>
                                                <div className="text-sm font-medium">{device.user}</div>
                                                <div className="text-[10px] text-muted-foreground">{new Date(device.last_seen).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveDevice(tenant.id, device.device_id)}
                                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
                                Keine aktiven Geräte
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2: KPIs
// ════════════════════════════════════════════════════════════════════════════
function KpisTab({ kpis, stats }: { kpis: AdminKpis | null; stats: AdminStats | null }) {
    if (!kpis) {
        return (
            <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                KPI-Daten werden geladen...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sales KPIs */}
            <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Vertrieb</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={ShoppingCart} label="Bestellungen" value={String(kpis.sales.totalOrders)} sub={`${kpis.sales.ordersToday} heute`} color="primary" />
                    <KpiCard icon={TrendingUp} label="Umsatz" value={`€${kpis.sales.revenue.toLocaleString()}`} sub={`${kpis.sales.conversionRate}% Conversion`} color="green" />
                    <KpiCard icon={Hash} label="OEM gelöst" value={String(kpis.oem.resolvedCount)} sub={`${kpis.oem.successRate}% Erfolg`} color="blue" />
                    <KpiCard icon={MessageSquare} label="Nachrichten" value={String(kpis.team.messagesSent)} sub={`${kpis.team.activeUsers} Benutzer`} color="purple" />
                </div>
            </div>

            {/* Revenue History Chart (simple bar chart) */}
            {kpis.history && kpis.history.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Bestellverlauf</h3>
                    <div className="flex items-end gap-3 h-40">
                        {kpis.history.map((h, i) => {
                            const maxOrders = Math.max(...kpis.history.map(x => x.orders), 1);
                            const height = (h.orders / maxOrders) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground font-medium">{h.orders}</span>
                                    <div className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max(height, 4)}%` }}>
                                        <div className="absolute inset-0 bg-primary rounded-t-lg opacity-80" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{h.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tenant breakdown */}
            {stats && stats.tenants.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Händler-Übersicht</h3>
                    <div className="space-y-3">
                        {stats.tenants.map(t => (
                            <div key={t.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        {t.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-sm">{t.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{t.user_count} User</span>
                                    <span>{t.device_count} Geräte</span>
                                    <span className={t.is_active ? 'text-emerald-500' : 'text-red-500'}>
                                        {t.is_active ? '● Aktiv' : '● Inaktiv'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
    const colorMap: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
        green: 'bg-emerald-500/10 text-emerald-500',
    };
    return (
        <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.primary}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 3: SYSTEM
// ════════════════════════════════════════════════════════════════════════════
function SystemTab({ stats, onRefresh: _onRefresh }: { stats: AdminStats | null; onRefresh: () => void }) {
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Systemstatus</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SystemInfoCard label="Tenants registriert" value={String(stats?.total_tenants ?? 0)} icon={Building2} />
                    <SystemInfoCard label="Benutzer gesamt" value={String(stats?.total_users ?? 0)} icon={Users} />
                    <SystemInfoCard label="Aktive Geräte" value={String(stats?.total_devices ?? 0)} icon={Smartphone} />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Schnellaktionen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <QuickAction icon={Eye} label="API Health Check" description="Backend-Status überprüfen" />
                    <QuickAction icon={Phone} label="WhatsApp-Bot Status" description="Verbindungsstatus prüfen" />
                    <QuickAction icon={Hash} label="OEM Register" description="OEM-Datenbank verwalten" href="/bot/oem-register" />
                    <QuickAction icon={Activity} label="Systemlogs" description="Letzte Aktivitäten anzeigen" />
                </div>
            </div>
        </div>
    );
}

function SystemInfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div>
                <div className="text-lg font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}

function QuickAction({ icon: Icon, label, description, href }: { icon: React.ElementType; label: string; description: string; href?: string }) {
    const content = (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
            </div>
        </div>
    );
    if (href) {
        return <a href={href}>{content}</a>;
    }
    return content;
}

// ── Shared Components ───────────────────────────────────────────────────────
function UsageBar({ current, max }: { current: number; max: number }) {
    const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const isOver = current >= max;
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
                <span className={isOver ? 'text-red-500 font-bold' : ''}>{current}</span>
                <span className="text-muted-foreground">/ {max}</span>
            </div>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, onClick, title }: { icon: React.ElementType; onClick: () => void; title: string }) {
    return (
        <button
            onClick={onClick}
            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder = '', type = 'text', disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-muted disabled:cursor-not-allowed"
            />
        </div>
    );
}

export default AdminDashboardView;
