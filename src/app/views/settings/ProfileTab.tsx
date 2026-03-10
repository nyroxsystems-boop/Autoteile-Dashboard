import { useState, useEffect } from 'react';
import { Mail, Phone, Save, Loader2 } from 'lucide-react';
import { useMe } from '../../hooks/useMe';
import { updateProfile } from '../../api/wws';
import { toast } from 'sonner';

export function ProfileTab() {
    const { me } = useMe();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (me?.user) {
            setFirstName(me.user.first_name || '');
            setLastName(me.user.last_name || '');
            setProfileEmail(me.user.email || '');
            setProfilePhone('');
        }
    }, [me]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                first_name: firstName,
                last_name: lastName,
                email: profileEmail,
                phone: profilePhone,
            });
            toast.success('Profil erfolgreich gespeichert');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Fehler beim Speichern des Profils';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Persönliche Informationen</h3>

                <div className="mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-primary/20">
                            {firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : 'MM'}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Profilbild-Upload wird in einer zukünftigen Version verfügbar.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Vorname</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nachname</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            E-Mail
                        </label>
                        <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="+49 171 1234567"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Speichern...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Änderungen speichern</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
