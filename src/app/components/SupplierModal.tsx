import { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, User } from 'lucide-react';
import { Button } from './ui/button';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    title?: string;
}

export function SupplierModal({ isOpen, onClose, onSubmit, initialData, title = "Neuer Lieferant" }: SupplierModalProps) {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        website: '',
        notes: '',
        status: 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{title}</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Firmenname <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="z.B. Bosch Automotive"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">E-Mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="contact@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Telefon</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="tel"
                                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="+49 123 456789"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Person */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ansprechpartner</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="z.B. Max Mustermann"
                                value={formData.contact_person}
                                onChange={(e) => handleChange('contact_person', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Adresse</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <textarea
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                rows={2}
                                placeholder="Straße, PLZ Stadt, Land"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Website</label>
                        <input
                            type="url"
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="https://www.example.com"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notizen</label>
                        <textarea
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                            rows={3}
                            placeholder="Zusätzliche Informationen..."
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="active">Aktiv</option>
                            <option value="inactive">Inaktiv</option>
                        </select>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        className="bg-primary text-white rounded-xl font-bold"
                    >
                        {initialData ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
