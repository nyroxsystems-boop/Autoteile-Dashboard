import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { useBillingSettings } from '../../hooks/useBillingSettings';
import { toast } from 'sonner';

export function CompanyTab() {
    const { currentTenant } = useTenants();
    const { settings: billingSettings, update: updateBillingSettings } = useBillingSettings();

    const [companyName, setCompanyName] = useState('');
    const [companyTaxId, setCompanyTaxId] = useState('');
    const [companyVatId, setCompanyVatId] = useState('');
    const [companyStreet, setCompanyStreet] = useState('');
    const [companyPostal, setCompanyPostal] = useState('');
    const [companyCity, setCompanyCity] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (billingSettings) {
            setCompanyName(billingSettings.company_name || currentTenant?.tenant_name || '');
            setCompanyTaxId(billingSettings.tax_id || '');
            setCompanyVatId('');
            setCompanyStreet(billingSettings.address_line1 || '');
            setCompanyPostal(billingSettings.postal_code || '');
            setCompanyCity(billingSettings.city || '');
        }
    }, [billingSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateBillingSettings({
                company_name: companyName,
                tax_id: companyTaxId,
                address_line1: companyStreet,
                postal_code: companyPostal,
                city: companyCity,
            });
            toast.success('Firmendaten gespeichert');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Fehler beim Speichern';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Unternehmensdaten</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Firmenname</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Steuernummer</label>
                            <input type="text" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} placeholder="z.B. 27/123/45678"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Umsatzsteuer-ID</label>
                            <input type="text" value={companyVatId} onChange={(e) => setCompanyVatId(e.target.value)} placeholder="z.B. DE123456789"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> Adresse
                        </label>
                        <input type="text" value={companyStreet} onChange={(e) => setCompanyStreet(e.target.value)} placeholder="Straße und Hausnummer"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-3" />
                        <div className="grid grid-cols-3 gap-3">
                            <input type="text" value={companyPostal} onChange={(e) => setCompanyPostal(e.target.value)} placeholder="PLZ"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            <input type="text" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Stadt"
                                className="col-span-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Speichern...</>) : (<><Save className="w-4 h-4" /> Änderungen speichern</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
