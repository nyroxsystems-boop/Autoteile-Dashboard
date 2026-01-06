import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, Part } from '../../services/wawiService';
import { Link } from 'react-router-dom';

interface ReorderSuggestion {
    part: Part;
    current_stock: number;
    minimum_stock: number;
    suggested_order_quantity: number;
}

export function ReorderWizardView() {
    const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getReorderSuggestions();
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to load reorder suggestions', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleCreatePO = () => {
        console.log('Creating purchase order for items:', Array.from(selectedItems));
        // Navigate to PO creation view
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nachbestellungs-Assistent</h1>
                    <p className="text-muted-foreground mt-1">
                        Artikel mit kritischem Bestand automatisch nachbestellen.
                    </p>
                </div>
                <Button
                    onClick={handleCreatePO}
                    disabled={selectedItems.size === 0}
                    className="bg-primary text-white rounded-xl font-bold"
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Bestellung erstellen ({selectedItems.size})
                </Button>
            </div>

            {loading ? (
                <div className="p-20 text-center text-muted-foreground animate-pulse">
                    Analysiere Lagerbestände...
                </div>
            ) : suggestions.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Alles im grünen Bereich!</h3>
                    <p className="text-muted-foreground">
                        Alle Artikel haben ausreichend Bestand.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-amber-700 mb-1">
                                {suggestions.length} Artikel unter Mindestbestand
                            </h3>
                            <p className="text-sm text-amber-600">
                                Wähle die Artikel aus, die du nachbestellen möchtest, und erstelle eine
                                Sammelbestellung.
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                        <th className="px-6 py-4 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.size === suggestions.length}
                                                onChange={() => {
                                                    if (selectedItems.size === suggestions.length) {
                                                        setSelectedItems(new Set());
                                                    } else {
                                                        setSelectedItems(new Set(suggestions.map((s) => s.part.id)));
                                                    }
                                                }}
                                                className="rounded border-border"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Artikel</th>
                                        <th className="px-6 py-4">Aktuell</th>
                                        <th className="px-6 py-4">Mindest</th>
                                        <th className="px-6 py-4">Fehlmenge</th>
                                        <th className="px-6 py-4">Empfohlen</th>
                                        <th className="px-6 py-4 text-right">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {suggestions.map((suggestion) => (
                                        <tr
                                            key={suggestion.part.id}
                                            className={`hover:bg-muted/30 transition-colors ${selectedItems.has(suggestion.part.id) ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(suggestion.part.id)}
                                                    onChange={() => toggleSelection(suggestion.part.id)}
                                                    className="rounded border-border"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    to={`/wawi/artikel/${suggestion.part.id}`}
                                                    className="hover:underline"
                                                >
                                                    <div className="font-bold text-sm">{suggestion.part.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        {suggestion.part.IPN}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-red-500">
                                                    {suggestion.current_stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{suggestion.minimum_stock}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                                    <span className="font-bold text-red-500">
                                                        -{suggestion.minimum_stock - suggestion.current_stock}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-emerald-600">
                                                    +{suggestion.suggested_order_quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-lg"
                                                    onClick={() => toggleSelection(suggestion.part.id)}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Hinzufügen
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
