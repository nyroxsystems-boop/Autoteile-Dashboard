import { useState } from 'react';
import { Key, Loader2 } from 'lucide-react';
import { changePassword } from '../../api/wws';
import { toast } from 'sonner';
import { useI18n } from '../../../i18n';

export function SecurityTab() {
    const { t } = useI18n();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast.error('Bitte alle Passwortfelder ausfüllen');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Die neuen Passwörter stimmen nicht überein');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Das neue Passwort muss mindestens 8 Zeichen haben');
            return;
        }
        setSaving(true);
        try {
            await changePassword({ current_password: currentPassword, new_password: newPassword });
            toast.success(t('save'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('error');
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Passwort ändern</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <Key className="w-4 h-4 text-muted-foreground" /> Aktuelles Passwort
                        </label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Neues Passwort</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mindestens 8 Zeichen"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Passwort bestätigen</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleChangePassword} disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Speichern...</>) : 'Passwort aktualisieren'}
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-2">Zwei-Faktor-Authentifizierung</h3>
                <p className="text-sm text-muted-foreground mb-4">Erhöhe die Sicherheit deines Accounts mit 2FA</p>
                <div className="px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground">
                    2FA wird in einer zukünftigen Version verfügbar sein.
                </div>
            </div>
        </div>
    );
}
