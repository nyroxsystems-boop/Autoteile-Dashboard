```typescript
import { useState } from 'react';
import { Plus, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { wawiService, Part, BOMComponent } from '../services/wawiService';

interface BOMManagerProps {
    components: BOMComponent[];
    onChange: (components: BOMComponent[]) => void;
    availableArticles: Part[];
}

export function BOMManager({ components, onChange, availableArticles = [] }: BOMManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newComponent, setNewComponent] = useState({
        part_id: 0,
        quantity: 1,
    });

    const handleAdd = () => {
        const selectedArticle = availableArticles.find(a => a.id === newComponent.part_id);
        if (!selectedArticle) return;

        const bomComponent: BOMComponent = {
            id: Date.now(),
            part_id: selectedArticle.id,
            part_name: selectedArticle.name,
            part_ipn: selectedArticle.IPN,
            quantity: newComponent.quantity,
            available_stock: selectedArticle.total_in_stock,
        };

        onChange([...components, bomComponent]);
        setNewComponent({ part_id: 0, quantity: 1 });
        setShowAddForm(false);
    };

    const handleRemove = (id: number) => {
        onChange(components.filter(c => c.id !== id));
    };

    const calculateAvailableSets = () => {
        if (components.length === 0) return 0;
        return Math.min(...components.map(c => Math.floor((c.available_stock || 0) / c.quantity)));
    };

    const availableSets = calculateAvailableSets();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Baukasten-Komponenten</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Wähle die Artikel aus, die zu diesem Set gehören.
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-primary text-white rounded-xl"
                    size="sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Komponente hinzufügen
                </Button>
            </div>

            {components.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Package className="w-5 h-5" />
                        <div>
                            <span className="font-bold">Verfügbare Sets: {availableSets}</span>
                            <p className="text-xs text-primary/70 mt-0.5">
                                Berechnet aus den Mindestmengen aller Komponenten
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Component List */}
            <div className="border border-border rounded-2xl overflow-hidden">
                {components.length === 0 && !showAddForm && (
                    <div className="p-12 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Noch keine Komponenten hinzugefügt</p>
                    </div>
                )}

                {components.map((component, index) => (
                    <div
                        key={component.id}
                        className={`p - 4 flex items - center justify - between hover: bg - muted / 20 transition - colors ${
    index > 0 ? 'border-t border-border' : ''
} `}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                                <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-foreground">{component.part_name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{component.part_ipn}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">{component.quantity}x</div>
                                <div className="text-xs text-muted-foreground">
                                    {component.available_stock || 0} verfügbar
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(component.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-4"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                {/* Add Form */}
                {showAddForm && (
                    <div className="p-4 bg-muted/30 border-t border-border">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs font-bold text-foreground">Artikel auswählen</label>
                                <select
                                    value={newComponent.part_id}
                                    onChange={(e) => setNewComponent({ ...newComponent, part_id: parseInt(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value={0}>-- Artikel wählen --</option>
                                    {availableArticles.map((article) => (
                                        <option key={article.id} value={article.id}>
                                            {article.name} ({article.IPN}) - {article.total_in_stock} vorrätig
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Menge</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newComponent.quantity}
                                    onChange={(e) => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                                className="rounded-lg"
                            >
                                Abbrechen
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAdd}
                                disabled={!newComponent.part_id}
                                className="bg-primary text-white rounded-lg"
                            >
                                Hinzufügen
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {components.some(c => (c.available_stock || 0) < c.quantity) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <p className="font-bold">Komponenten mit zu geringem Bestand</p>
                        <p className="text-xs mt-1 opacity-80">
                            Einige Komponenten haben nicht genug Lagerbestand für die angegebene Menge.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
