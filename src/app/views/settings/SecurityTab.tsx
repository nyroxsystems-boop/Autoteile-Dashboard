import { useState } from 'react';
import { Key, Save, Loader2 } from 'lucide-react';
import { changePassword } from '../../api/wws';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

export function SecurityTab() {
    const { t } = useI18n();
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) { toast.error(t('settings_password_required')); return; }
        if (newPw.length < 8) { toast.error(t('settings_password_short')); return; }
        if (newPw !== confirmPw) { toast.error(t('settings_password_mismatch')); return; }
        setSaving(true);
        try {
            await changePassword({ current_password: currentPw, new_password: newPw });
            toast.success(t('settings_password_changed'));
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t('error'));
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5" /> {t('settings_change_password')}
                </h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('settings_current_password')}</label>
                        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('settings_new_password')}</label>
                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        <p className="text-xs text-muted-foreground mt-1">{t('settings_min_chars')}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('settings_confirm_password')}</label>
                        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <button onClick={handleChangePassword} disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('settings_saving')}</>) : (<><Save className="w-4 h-4" /> {t('settings_update_password')}</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
