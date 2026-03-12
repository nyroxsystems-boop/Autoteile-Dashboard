import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, MessageSquare, Car, Package } from 'lucide-react';
import { toast } from 'sonner';
import { VehicleSelect } from './VehicleSelect';
import { useI18n } from '../../i18n';

interface NewInquiryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function NewInquiryModal({ open, onOpenChange, onSuccess }: NewInquiryModalProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        whatsappNumber: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        partDescription: '',
        oemNumber: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerName || !formData.partDescription) {
            toast.error(t('inquiry_validation'));
            return;
        }

        setLoading(true);
        try {
            const { apiFetch } = await import('../api/client');
            await apiFetch('/api/orders/', {
                method: 'POST',
                body: JSON.stringify({
                    customer_name: formData.customerName,
                    customer_phone: formData.whatsappNumber,
                    vehicle_json: {
                        make: formData.vehicleMake,
                        model: formData.vehicleModel,
                        year: formData.vehicleYear,
                    },
                    part_json: {
                        rawText: formData.partDescription,
                    },
                    oem_number: formData.oemNumber || null,
                    status: 'lookup_oem',
                }),
            });

            toast.success(t('inquiry_success'));
            onOpenChange(false);
            onSuccess?.();

            setFormData({
                customerName: '',
                whatsappNumber: '',
                vehicleMake: '',
                vehicleModel: '',
                vehicleYear: '',
                partDescription: '',
                oemNumber: '',
            });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t('inquiry_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        {t('inquiry_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('inquiry_desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">{t('inquiry_customer_info')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">{t('inquiry_customer_name')}</label>
                                <Input
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Max Mustermann"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">{t('inquiry_whatsapp')}</label>
                                <Input
                                    value={formData.whatsappNumber}
                                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    placeholder="+49 171 1234567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            {t('inquiry_vehicle')}
                        </h4>
                        <VehicleSelect
                            make={formData.vehicleMake}
                            model={formData.vehicleModel}
                            year={formData.vehicleYear}
                            onMakeChange={(make) => setFormData({ ...formData, vehicleMake: make })}
                            onModelChange={(model) => setFormData({ ...formData, vehicleModel: model })}
                            onYearChange={(year) => setFormData({ ...formData, vehicleYear: year })}
                        />
                    </div>

                    {/* Part Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {t('inquiry_part')}
                        </h4>
                        <Input
                            value={formData.partDescription}
                            onChange={(e) => setFormData({ ...formData, partDescription: e.target.value })}
                            placeholder={t('inquiry_part_placeholder')}
                        />
                        <Input
                            value={formData.oemNumber}
                            onChange={(e) => setFormData({ ...formData, oemNumber: e.target.value })}
                            placeholder={t('inquiry_oem_placeholder')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={loading} className="hover-glow" style={{ background: loading ? undefined : 'var(--gradient-primary)' }}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('inquiry_creating')}
                                </>
                            ) : (
                                t('inquiry_create')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
