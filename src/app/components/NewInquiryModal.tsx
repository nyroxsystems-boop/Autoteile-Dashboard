import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, MessageSquare, Car, Package } from 'lucide-react';
import { toast } from 'sonner';

interface NewInquiryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function NewInquiryModal({ open, onOpenChange, onSuccess }: NewInquiryModalProps) {
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
            toast.error('Bitte Kundenname und Teilebeschreibung ausfüllen');
            return;
        }

        setLoading(true);
        try {
            // TODO: Call API to create inquiry
            // For now, simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('Anfrage erfolgreich erstellt');
            onOpenChange(false);
            onSuccess?.();

            // Reset form
            setFormData({
                customerName: '',
                whatsappNumber: '',
                vehicleMake: '',
                vehicleModel: '',
                vehicleYear: '',
                partDescription: '',
                oemNumber: '',
            });
        } catch (err: any) {
            toast.error(err.message || 'Fehler beim Erstellen der Anfrage');
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
                        Neue Anfrage erstellen
                    </DialogTitle>
                    <DialogDescription>
                        Manuelle Anfrage für einen Kunden erstellen
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Kundeninformationen</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Kundenname *</label>
                                <Input
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Max Mustermann"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">WhatsApp-Nummer</label>
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
                            Fahrzeug
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                value={formData.vehicleMake}
                                onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                                placeholder="Marke"
                            />
                            <Input
                                value={formData.vehicleModel}
                                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                                placeholder="Modell"
                            />
                            <Input
                                value={formData.vehicleYear}
                                onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                                placeholder="Baujahr"
                            />
                        </div>
                    </div>

                    {/* Part Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Gesuchtes Teil
                        </h4>
                        <Input
                            value={formData.partDescription}
                            onChange={(e) => setFormData({ ...formData, partDescription: e.target.value })}
                            placeholder="z.B. Bremssattel vorne links *"
                        />
                        <Input
                            value={formData.oemNumber}
                            onChange={(e) => setFormData({ ...formData, oemNumber: e.target.value })}
                            placeholder="OEM-Nummer (falls bekannt)"
                        />
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
                                'Anfrage erstellen'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
