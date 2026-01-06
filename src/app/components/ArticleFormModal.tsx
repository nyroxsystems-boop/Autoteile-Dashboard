import React, { useState } from 'react';
import { X, Package, Box, Archive, Save } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ArticleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (article: any) => void;
    article?: any;
}

export function ArticleFormModal({ isOpen, onClose, onSave, article }: ArticleFormModalProps) {
    const [formData, setFormData] = useState({
        name: article?.name || '',
        ipn: article?.IPN || '',
        description: article?.description || '',
        article_type: article?.article_type || 'standard',
        category: article?.category_name || '',
        brand: article?.brand || '',
        minimum_stock: article?.minimum_stock || 10,
    });

    const articleTypes = [
        { id: 'standard', label: 'Standard-Artikel', icon: Package, description: 'Einzelner lagerbarer Artikel' },
        { id: 'set', label: 'Set / Baukasten', icon: Box, description: 'Zusammenstellung mehrerer Artikel' },
        { id: 'deposit', label: 'Pfand-Artikel', icon: Archive, description: 'Artikel mit Pfand' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        toast.success(article ? 'Artikel aktualisiert' : 'Artikel erstellt');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border px-8 py-6 flex items-center justify-between rounded-t-3xl">
                    <h2 className="text-2xl font-bold">
                        {article ? 'Artikel bearbeiten' : 'Neuer Artikel'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Article Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Artikel-Typ</label>
                        <div className="grid grid-cols-3 gap-4">
                            {articleTypes.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, article_type: type.id })}
                                    className={`
                    p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center
                    ${formData.article_type === type.id
                                            ? 'border-primary bg-primary/5 text-primary shadow-lg'
                                            : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50'}
                  `}
                                >
                                    <type.icon className="w-8 h-8" />
                                    <div>
                                        <div className="font-bold text-sm">{type.label}</div>
                                        <div className="text-xs mt-1 opacity-70">{type.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Artikelname *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="z.B. Bremsscheibe vorne"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Artikelnummer (IPN) *</label>
                            <input
                                type="text"
                                required
                                value={formData.ipn}
                                onChange={(e) => setFormData({ ...formData, ipn: e.target.value })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                                placeholder="SKU-12345"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-foreground">Beschreibung</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                rows={3}
                                placeholder="Optionale Beschreibung..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Kategorie</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="z.B. Bremsanlage"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Marke / Hersteller</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="z.B. Bosch"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Mindestbestand</label>
                            <input
                                type="number"
                                value={formData.minimum_stock}
                                onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })}
                                className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="10"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                            Abbrechen
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 font-bold">
                            <Save className="w-4 h-4 mr-2" />
                            {article ? 'Speichern' : 'Artikel erstellen'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
