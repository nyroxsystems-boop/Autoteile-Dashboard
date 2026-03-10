import { CreditCard } from 'lucide-react';
import { useI18n } from '../../../i18n';

export function BillingTab() {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> {t('settings_billing')}
                </h3>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                    <CreditCard className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                    <h4 className="text-foreground font-medium mb-2">{t('settings_billing')}</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {t('settings_support_contact')}: support@partsunion.de
                    </p>
                </div>
            </div>
        </div>
    );
}
