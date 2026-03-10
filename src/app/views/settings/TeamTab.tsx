import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Crown, CheckCircle2, XCircle, Bell, User, Shield, Save } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { getTeam } from '../../api/wws';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    status: 'active' | 'pending' | 'inactive';
    joinedDate: string;
    lastActive: string;
}

const roleLabels = { owner: 'Inhaber', admin: 'Administrator', member: 'Mitarbeiter' };
const roleBadgeColors = {
    owner: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
    admin: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    member: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
};
const statusConfig = {
    active: { label: 'Aktiv', color: 'text-green-600', icon: CheckCircle2 },
    pending: { label: 'Ausstehend', color: 'text-amber-600', icon: Bell },
    inactive: { label: 'Inaktiv', color: 'text-slate-600', icon: XCircle },
};

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

export function TeamTab() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await getTeam();
                setTeamMembers((data || []).map((m: Record<string, string | boolean>) => ({
                    id: String(m.id),
                    name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || String(m.username || ''),
                    email: String(m.email || ''),
                    role: String(m.role || 'member').toLowerCase() as TeamMember['role'],
                    status: (m.is_active ? 'active' : 'inactive') as TeamMember['status'],
                    joinedDate: '-',
                    lastActive: '-',
                })));
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '';
                if (msg.includes('404') || msg.includes('not found')) {
                    setTeamMembers([]);
                } else {
                    console.error('Failed to load team:', err);
                }
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-foreground font-medium mb-1">Team-Mitglieder</h3>
                        <p className="text-sm text-muted-foreground">
                            {teamMembers.filter((m) => m.status === 'active').length} aktive Mitglieder
                        </p>
                    </div>
                    <button onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Mitglied einladen
                    </button>
                </div>

                <div className="space-y-3">
                    {teamMembers.map((member) => {
                        const StatusIcon = statusConfig[member.status].icon;
                        return (
                            <div key={member.id} className="p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold flex-shrink-0 ring-2 ring-primary/20">
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-medium text-foreground">{member.name}</div>
                                            {member.role === 'owner' && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium">
                                                    <Crown className="w-3 h-3" />{roleLabels[member.role]}
                                                </div>
                                            )}
                                            {member.role !== 'owner' && (
                                                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[member.role]}`}>
                                                    {roleLabels[member.role]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>Beigetreten: {member.joinedDate}</span>
                                            <span>·</span>
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon className={`w-3 h-3 ${statusConfig[member.status].color}`} />
                                                <span>{member.lastActive}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {member.role !== 'owner' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingMember(member)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors group">
                                                <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors group">
                                                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-600" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">Berechtigungen</h3>
                <div className="space-y-3">
                    {[
                        { icon: Crown, color: 'text-amber-600', role: 'Inhaber', desc: 'Vollzugriff auf alle Funktionen, Team-Verwaltung und Abrechnung' },
                        { icon: Shield, color: 'text-blue-600', role: 'Administrator', desc: 'Zugriff auf alle Funktionen außer Abrechnung und Account-Verwaltung' },
                        { icon: User, color: 'text-slate-600', role: 'Mitarbeiter', desc: 'Zugriff auf Anfragen, Angebote und Aufträge. Keine Admin-Funktionen' },
                    ].map((item) => (
                        <div key={item.role} className="flex items-start gap-3">
                            <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                            <div>
                                <div className="font-medium text-foreground">{item.role}</div>
                                <div className="text-sm text-muted-foreground">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Team-Mitglied einladen</h2>
                            <p className="text-sm text-muted-foreground mt-1">Sende eine Einladung per E-Mail</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">E-Mail Adresse</label>
                                <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}
                                    placeholder="mitarbeiter@autoteile-shop.de"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Rolle</label>
                                <CustomSelect value={newMemberRole} onChange={(value) => setNewMemberRole(value as 'admin' | 'member')}
                                    options={[
                                        { value: 'member', label: 'Mitarbeiter', icon: <User className="w-4 h-4 text-slate-600" /> },
                                        { value: 'admin', label: 'Administrator', icon: <Shield className="w-4 h-4 text-blue-600" /> },
                                    ]} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
                            <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">Abbrechen</button>
                            <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Einladung senden</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {editingMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Mitarbeiter bearbeiten</h2>
                            <p className="text-sm text-muted-foreground mt-1">Rolle und Berechtigungen anpassen</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary/20">
                                    {getInitials(editingMember.name)}
                                </div>
                                <div>
                                    <div className="font-medium text-foreground">{editingMember.name}</div>
                                    <div className="text-sm text-muted-foreground">{editingMember.email}</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Rolle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['admin', 'member'] as const).map((role) => (
                                        <button key={role} onClick={() => setEditingMember({ ...editingMember, role })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${editingMember.role === role ? 'border-blue-600 bg-blue-600/10' : 'border-border hover:border-border-strong'}`}>
                                            <div className="font-medium text-foreground">{roleLabels[role]}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {role === 'admin' ? 'Vollzugriff außer Abrechnung' : 'Eingeschränkter Zugriff'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Status</label>
                                <CustomSelect value={editingMember.status}
                                    onChange={(value) => setEditingMember({ ...editingMember, status: value as TeamMember['status'] })}
                                    options={[
                                        { value: 'active', label: 'Aktiv', icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
                                        { value: 'inactive', label: 'Inaktiv', icon: <XCircle className="w-4 h-4 text-slate-600" /> },
                                    ]} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
                            <button onClick={() => {
                                if (confirm('Möchtest du dieses Mitglied wirklich löschen?')) {
                                    setTeamMembers(teamMembers.filter(m => m.id !== editingMember.id));
                                    setEditingMember(null);
                                }
                            }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Mitglied löschen
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setEditingMember(null)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">Abbrechen</button>
                                <button onClick={() => {
                                    setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? editingMember : m));
                                    setEditingMember(null);
                                }} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Änderungen speichern
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
