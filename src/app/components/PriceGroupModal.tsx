import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useMerchantSettings } from '../hooks/useMerchantSettings';

interface PriceProfile {
    id: string | number;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    isDefault?: boolean;
    appliesTo?: string;
    lastModified?: string;
}

interface PriceGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    editProfile?: PriceProfile | null;
}

export function PriceGroupModal({ open, onOpenChange, onSuccess, editProfile }: PriceGroupModalProps) {
    const isEditing = !!editProfile;
    const { settings, update: updateMerchantSettings } = useMerchantSettings();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: editProfile?.name || '',
        type: (editProfile?.type || 'percentage') as 'percentage' | 'fixed',
        value: editProfile?.value?.toString() || '',
        appliesTo: editProfile?.appliesTo || 'all',
    });

    // Update form when editProfile changes
    useState(() => {
        if (editProfile) {
            setFormData({
                name: editProfile.name,
                type: editProfile.type,
                value: editProfile.value.toString(),
                appliesTo: editProfile.appliesTo || 'all',
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.value) {
            toast.error('Bitte Name und Wert ausfüllen');
            return;
        }

        setLoading(true);
        try {
            // Save price group to merchant settings
            const existingProfiles = settings?.priceProfiles || [];
            if (isEditing && editProfile) {
                // Update existing profile
                const updatedProfiles = existingProfiles.map(p =>
                    p.id === editProfile.id ? {
                        ...p,
                        name: formData.name,
                        type: formData.type,
                        value: parseFloat(formData.value),
                        appliesTo: formData.appliesTo,
                        lastModified: new Date().toLocaleDateString('de-DE'),
                    } : p
                );
                await updateMerchantSettings({ priceProfiles: updatedProfiles });
            } else {
                // Create new profile
                const newProfile = {
                    id: `pg_${Date.now()}`,
                    name: formData.name,
                    type: formData.type,
                    value: parseFloat(formData.value),
                    appliesTo: formData.appliesTo,
                    isDefault: existingProfiles.length === 0,
                    lastModified: new Date().toLocaleDateString('de-DE'),
                };
                await updateMerchantSettings({
                    priceProfiles: [...existingProfiles, newProfile],
                });
            }

            toast.success(isEditing ? 'Preisgruppe aktualisiert' : `Preisgruppe "${formData.name}" erstellt`);
            onOpenChange(false);
            onSuccess?.();

            setFormData({
                name: '',
                type: 'percentage',
                value: '',
                appliesTo: 'all',
            });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Fehler beim Erstellen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-primary" />
                        {isEditing ? 'Preisgruppe bearbeiten' : 'Neue Preisgruppe anlegen'}
                    </DialogTitle>
                    <DialogDescription>
                        Definiere Margen und Preisaufschläge für WhatsApp-Angebote
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Profilname *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="z.B. Premium-Kunden Rabatt"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Typ</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'percentage' })}
                                className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${formData.type === 'percentage'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <Percent className="w-4 h-4" />
                                Prozentual
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'fixed' })}
                                className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${formData.type === 'fixed'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4" />
                                Festpreis
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Wert {formData.type === 'percentage' ? '(%)' : '(€)'} *
                        </label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder={formData.type === 'percentage' ? '15' : '10.00'}
                                className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {formData.type === 'percentage' ? '%' : '€'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Anwendung</label>
                        <select
                            value={formData.appliesTo}
                            onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                        >
                            <option value="all">Alle Produkte</option>
                            <option value="oem_verified">Nur OEM-verifizierte</option>
                            <option value="high_value">Hochpreisige Teile (&gt; €100)</option>
                            <option value="low_value">Niedrigpreisige Teile (&lt; €50)</option>
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Erstellen...
                                </>
                            ) : (
                                'Preisgruppe speichern'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
