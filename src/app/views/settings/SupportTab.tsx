import { Headphones, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import { useI18n } from '../../../i18n';

export function SupportTab() {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">{t('settings_support_contact')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <Headphones className="w-5 h-5 text-primary" />
                            <span className="font-medium text-foreground">{t('settings_support_tech')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">support@partsunion.de</p>
                        <p className="text-sm text-muted-foreground">+49 30 123 456 789</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-green-600">{t('settings_support_available')}</span>
                            <span className="text-muted-foreground">• {t('settings_support_hours')}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            <span className="font-medium text-foreground">Account Manager</span>
                        </div>
                        <p className="text-sm text-muted-foreground">accounts@partsunion.de</p>
                        <p className="text-sm text-muted-foreground">+49 30 123 456 790</p>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">{t('settings_support_resources')}</h3>
                <div className="space-y-3">
                    {[
                        { icon: ExternalLink, label: 'API-Dokumentation', href: '#' },
                        { icon: ExternalLink, label: 'Knowledge Base', href: '#' },
                        { icon: ExternalLink, label: 'Changelog', href: '#' },
                    ].map((r, i) => (
                        <a key={i} href={r.href} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition-all group">
                            <r.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            <span className="text-sm text-foreground group-hover:text-primary">{r.label}</span>
                        </a>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">Service Level</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg border border-border">
                        <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">99.9%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border border-border">
                        <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">&lt;2h</div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg border border-border">
                        <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">24/7</div>
                        <div className="text-xs text-muted-foreground">Monitoring</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
