import { CreditCard } from 'lucide-react';

export function BillingTab() {
    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Abrechnung</h3>
                <div className="px-4 py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-border">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="font-medium text-foreground mb-1">Abrechnungsdetails</p>
                    <p className="text-sm">Kontaktieren Sie support@partsunion.de für Fragen zu Ihrem Tarif oder Ihrer Rechnung.</p>
                </div>
            </div>
        </div>
    );
}
