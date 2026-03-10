import { useState } from 'react';
import { useMerchantSettings } from '../../hooks/useMerchantSettings';

export function NotificationsTab() {
    const { update: updateMerchantSettings } = useMerchantSettings();
    const [notifications, setNotifications] = useState<Record<string, boolean>>({
        new_inquiry: true,
        quote_accepted: true,
        order_shipped: true,
        invoice_paid: true,
        team_updates: true,
    });

    const items = [
        { id: 'new_inquiry', label: 'Neue Kundenanfragen', description: 'Bei neuen WhatsApp-Nachrichten' },
        { id: 'quote_accepted', label: 'Angebot angenommen', description: 'Wenn ein Kunde ein Angebot bestätigt' },
        { id: 'order_shipped', label: 'Bestellung versendet', description: 'Bei Versand durch Lieferanten' },
        { id: 'invoice_paid', label: 'Rechnung bezahlt', description: 'Bei Zahlungseingang' },
        { id: 'team_updates', label: 'Team-Updates', description: 'Neue Mitglieder und Änderungen' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">E-Mail Benachrichtigungen</h3>
                <div className="space-y-4">
                    {items.map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                            <div>
                                <div className="font-medium text-foreground">{notification.label}</div>
                                <div className="text-sm text-muted-foreground">{notification.description}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifications[notification.id] ?? true}
                                    onChange={(e) => {
                                        const updated = { ...notifications, [notification.id]: e.target.checked };
                                        setNotifications(updated);
                                        updateMerchantSettings({ notifications: updated }).catch(() => { });
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
