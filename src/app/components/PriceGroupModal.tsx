import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useMerchantSettings } from '../hooks/useMerchantSettings';
import { useI18n } from '../../i18n';

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
    const { t } = useI18n();
    const isEditing = !!editProfile;
    const { settings, update: updateMerchantSettings } = useMerchantSettings();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: '',
        appliesTo: 'all',
    });

    // Update form when editProfile changes
    useEffect(() => {
        if (editProfile) {
            setFormData({
                name: editProfile.name,
                type: editProfile.type,
                value: editProfile.value.toString(),
                appliesTo: editProfile.appliesTo || 'all',
            });
        } else {
            setFormData({
                name: '',
                type: 'percentage',
                value: '',
                appliesTo: 'all',
            });
        }
    }, [editProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.value) {
            toast.error(t('price_modal_validation'));
            return;
        }

        setLoading(true);
        try {
            const existingProfiles = settings?.priceProfiles || [];
            if (isEditing && editProfile) {
                const updatedProfiles = existingProfiles.map((p: { id: string | number; name: string; type: string; value: number; isDefault?: boolean; appliesTo?: string; lastModified?: string }) =>
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

            toast.success(isEditing ? t('price_modal_updated') : t('price_modal_created'));
            onOpenChange(false);
            onSuccess?.();

            setFormData({
                name: '',
                type: 'percentage',
                value: '',
                appliesTo: 'all',
            });
        } catch (err: unknown) {
            toast.error(t('price_modal_error'));
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
                        {isEditing ? t('price_modal_edit') : t('price_modal_create')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('price_modal_desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('price_modal_name')}</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('price_modal_name_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('price_modal_type')}</label>
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
                                {t('price_modal_percentage')}
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
                                {t('price_modal_fixed')}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {t('price_modal_value')} {formData.type === 'percentage' ? '(%)' : '(€)'} *
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
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('price_modal_application')}</label>
                        <select
                            value={formData.appliesTo}
                            onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                        >
                            <option value="all">{t('price_modal_all')}</option>
                            <option value="oem_verified">{t('price_modal_oem_only')}</option>
                            <option value="high_value">{t('price_modal_high_value')}</option>
                            <option value="low_value">{t('price_modal_low_value')}</option>
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('price_modal_creating')}
                                </>
                            ) : (
                                t('price_modal_save')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
