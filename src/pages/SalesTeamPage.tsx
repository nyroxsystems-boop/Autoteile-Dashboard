import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Package, Target, Plus, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import apiClient from '../lib/apiClient';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface KPIStats {
    sales: {
        totalOrders: number;
        ordersToday: number;
        revenue: number;
        conversionRate: number;
    };
    team: {
        activeUsers: number;
        callsMade: number;
        messagesSent: number;
    };
    oem: {
        resolvedCount: number;
        successRate: number;
    };
}

const SalesTeamPage: React.FC = () => {
    const { user, token, session } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<KPIStats | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);

    // Form state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const fetchUsers = async () => {
        try {
            const { data } = await apiClient.get('/api/auth/team');
            if (data) setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error('Could not load team members:', e); }
    };

    const fetchStats = async () => {
        try {
            const { data } = await apiClient.get('/api/dashboard/stats');
            if (data) {
                setStats({
                    sales: {
                        totalOrders: data.ordersTotal || 0,
                        ordersToday: data.ordersToday || 0,
                        revenue: data.revenueToday || 0,
                        conversionRate: 0
                    },
                    team: {
                        activeUsers: users.length,
                        callsMade: 0,
                        messagesSent: 0
                    },
                    oem: {
                        resolvedCount: 0,
                        successRate: 0
                    }
                });
            }
        } catch (e) { console.error('Could not load stats:', e); }
    };

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/admin/users', { name: newName, email: newEmail, role: 'sales_rep' });
            setShowAddUser(false);
            setNewName('');
            setNewEmail('');
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Vertrieb & Team</h1>
                <p className="text-sm text-muted-foreground mt-1">Sales Performance und Mitarbeiter-Verwaltung</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    title="Umsatz (Simuliert)"
                    value={`${stats?.sales.revenue ?? 0} €`}
                    trend="+12%"
                />
                <StatCard
                    icon={<Package className="w-4 h-4" />}
                    title="Bestellungen Heute"
                    value={stats?.sales.ordersToday ?? 0}
                />
                <StatCard
                    icon={<Target className="w-4 h-4" />}
                    title="Konversion"
                    value={`${stats?.sales.conversionRate ?? 0}%`}
                    trend="+2.4%"
                />
                <StatCard
                    icon={<Package className="w-4 h-4" />}
                    title="OEM Matches"
                    value={stats?.oem.resolvedCount ?? 0}
                />
            </div>

            {/* User Management */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="panel-header">
                    <h3 className="panel-header-title">Mitarbeiter / User</h3>
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddUser(true)}>
                        User anlegen
                    </Button>
                </div>

                {showAddUser && (
                    <div className="px-5 py-4 bg-primary/5 border-b border-border">
                        <form onSubmit={handleAddUser} className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="form-label">Name</label>
                                <Input
                                    value={newName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                                    required
                                    placeholder="Max Mustermann"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="form-label">E-Mail</label>
                                <Input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                                    required
                                    placeholder="max@beispiel.de"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" variant="primary">Speichern</Button>
                                <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)}>
                                    Abbrechen
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <table className="table-premium">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Rolle</th>
                            <th>Status</th>
                            <th>Beigetreten</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="font-medium text-foreground">{u.name}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                </td>
                                <td>
                                    <Badge variant="default">{u.role}</Badge>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm">Aktiv</span>
                                    </div>
                                </td>
                                <td className="text-muted-foreground">
                                    {new Date(u.created_at).toLocaleDateString('de-DE')}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4}>
                                    <div className="empty-state">
                                        <Users className="empty-state-icon" />
                                        <div className="empty-state-title">Keine Mitarbeiter gefunden</div>
                                        <div className="empty-state-description">Fügen Sie Ihr erstes Teammitglied hinzu</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface StatCardProps {
    icon?: React.ReactNode;
    title: string;
    value: string | number;
    trend?: string;
}

function StatCard({ icon, title, value, trend }: StatCardProps) {
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between mb-2">
                <div className="stat-card-label">{title}</div>
                {icon && <div className="text-muted-foreground/50">{icon}</div>}
            </div>
            <div className="stat-card-value">{value}</div>
            {trend && (
                <div className="mt-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {trend}
                    </span>
                </div>
            )}
        </div>
    );
}

export default SalesTeamPage;
