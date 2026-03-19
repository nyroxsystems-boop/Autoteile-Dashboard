import { CreditCard, Mail, Phone, Globe, FileText } from 'lucide-react';
import { useI18n } from '../../../i18n';

export function BillingTab() {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> {t('settings_billing')}
                </h3>
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-lg font-semibold text-foreground">Starter Plan</h4>
                            <p className="text-sm text-muted-foreground">{t('settings_billing_active')}</p>
                        </div>
                        <div className="px-3 py-1 bg-[var(--status-success-bg)] text-[var(--status-success-fg)] rounded-full text-xs font-medium">
                            {t('settings_billing_active')}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <div className="text-muted-foreground mb-1">{t('settings_billing_users')}</div>
                            <div className="font-semibold text-foreground">5</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <div className="text-muted-foreground mb-1">{t('settings_billing_orders')}</div>
                            <div className="font-semibold text-foreground">∞</div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <div className="text-muted-foreground mb-1">{t('settings_billing_bot')}</div>
                            <div className="font-semibold text-foreground">✓</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Summary */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> {t('settings_billing_invoices')}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t('settings_billing_invoices_desc')}
                </p>
            </div>

            {/* Contact Support */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">{t('settings_billing_contact')}</h3>
                <div className="space-y-3">
                    <a href="mailto:billing@partsunion.de" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="w-4 h-4" /> billing@partsunion.de
                    </a>
                    <a href="tel:+4917647855007" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-4 h-4" /> +49 176 47855007
                    </a>
                    <a href="https://partsunion.de" target="_blank" rel="noopener" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Globe className="w-4 h-4" /> partsunion.de
                    </a>
                </div>
            </div>
        </div>
    );
}
