import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Repeat, Edit, Save, History } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { wawiService, WarehouseLocation } from '../../services/wawiService';

export function InventoryMovementView() {
    const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION'>('IN');
    const [locations, setLocations] = useState<WarehouseLocation[]>([]);

    useEffect(() => {
        wawiService.getLocations().then(setLocations);
    }, []);

    const handleSave = () => {
        toast.success('Buchung erfolgreich gespeichert');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bestandsbuchung</h1>
                <p className="text-muted-foreground mt-2">
                    Manuelle Korrekturen, Wareneingänge oder Bestandsübertragungen.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { id: 'IN', label: 'Wareneingang', icon: ArrowDownLeft, color: 'emerald' },
                    { id: 'OUT', label: 'Warenausgang', icon: ArrowUpRight, color: 'red' },
                    { id: 'TRANSFER', label: 'Umbuchung', icon: Repeat, color: 'blue' },
                    { id: 'CORRECTION', label: 'Korrektur', icon: Edit, color: 'amber' },
                ].map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setMovementType(type.id as any)}
                        className={`
p - 6 rounded - 3xl border - 2 transition - all flex flex - col items - center gap - 3
              ${movementType === type.id
                                ? `border-${type.color}-500 bg-${type.color}-500/5 text-${type.color}-600 shadow-lg shadow-${type.color}-500/10`
                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                            }
`}
                    >
                        <type.icon className="w-8 h-8" />
                        <span className="font-bold text-sm tracking-wide uppercase">{type.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-card border border-border rounded-3xl shadow-sm p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">Artikel auswählen</label>
                        <select className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/50 transition-colors">
                            <option>Bremsscheibe vorne (SKU-123)</option>
                            <option>Bremsbeläge Satz (SKU-456)</option>
                            <option>Zündkerze Platin (SKU-789)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">Menge</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">Referenz / Grund</label>
                        <input
                            type="text"
                            placeholder="z.B. Lieferschein #12345"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">Lagerort (Ziel)</label>
                        <select className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                            <option value="">-- Lagerort wählen --</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.code} - {loc.name} ({loc.current_stock || 0} aktuell)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                    <Button variant="outline" className="rounded-xl px-6">Abbrechen</Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 font-bold">
                        <Save className="w-4 h-4 mr-2" /> Buchung speichern
                    </Button>
                </div>
            </div>

            <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-8 text-center">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-muted-foreground">Aktuelles Bewegungsjournal</h3>
                <p className="text-muted-foreground text-sm mt-1">Hier werden deine letzten 5 Buchungen angezeigt.</p>
            </div>
        </div>
    );
}
