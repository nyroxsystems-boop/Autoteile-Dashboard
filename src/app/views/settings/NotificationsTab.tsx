import { useState, useEffect } from 'react';
import { Bell, Save, Loader2, MessageCircle, CheckCircle2, Package, Coins, Users } from 'lucide-react';
import { useMerchantSettings } from '../../hooks/useMerchantSettings';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

export function NotificationsTab() {
    const { settings: merchantSettings, update: updateMerchantSettings } = useMerchantSettings();
    const { t } = useI18n();
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        new_inquiry: true, quote_accepted: true, order_shipped: true, invoice_paid: true, team_updates: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (merchantSettings?.notifications) setNotifications(merchantSettings.notifications);
    }, [merchantSettings]);

    const toggle = (key: string) => setNotifications(n => ({ ...n, [key]: !n[key] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateMerchantSettings({ notifications });
            toast.success(t('settings_saved'));
        } catch { toast.error(t('error')); }
        finally { setSaving(false); }
    };

    const items = [
        { key: 'new_inquiry', label: t('settings_notif_inquiry'), desc: t('settings_notif_inquiry_desc'), icon: <MessageCircle className="w-5 h-5 text-blue-500" /> },
        { key: 'quote_accepted', label: t('settings_notif_quote'), desc: t('settings_notif_quote_desc'), icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
        { key: 'order_shipped', label: t('settings_notif_shipped'), desc: t('settings_notif_shipped_desc'), icon: <Package className="w-5 h-5 text-indigo-500" /> },
        { key: 'invoice_paid', label: t('settings_notif_paid'), desc: t('settings_notif_paid_desc'), icon: <Coins className="w-5 h-5 text-amber-500" /> },
        { key: 'team_updates', label: t('settings_notif_team'), desc: t('settings_notif_team_desc'), icon: <Users className="w-5 h-5 text-violet-500" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> {t('settings_email_notifications')}
                </h3>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0">{item.icon}</span>
                                <div>
                                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </div>
                            </div>
                            <button onClick={() => toggle(item.key)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('settings_saving')}</>) : (<><Save className="w-4 h-4" /> {t('settings_save')}</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
