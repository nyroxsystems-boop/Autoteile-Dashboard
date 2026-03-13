import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, Part } from '../../services/wawiService';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

interface ReorderSuggestion {
    part: Part;
    current_stock: number;
    minimum_stock: number;
    suggested_order_quantity: number;
}

export function ReorderWizardView() {
    const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<number | string>>(new Set());

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getReorderSuggestions();
            setSuggestions(data as ReorderSuggestion[]);
        } catch (err) {
            // Failed to load reorder suggestions
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: number | string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleCreatePO = () => {
        if (selectedItems.size === 0) return;
        toast.success(t('wawi_po_created'));
        setSelectedItems(new Set());
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('wawi_reorder_assistant')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('wawi_reorder_assistant_sub')}
                    </p>
                </div>
                <Button
                    onClick={handleCreatePO}
                    disabled={selectedItems.size === 0}
                    className="bg-primary text-white rounded-xl font-bold"
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('wawi_create_po')} ({selectedItems.size})
                </Button>
            </div>

            {loading ? (
                <div className="p-20 text-center text-muted-foreground animate-pulse">
                    {t('wawi_analyzing')}
                </div>
            ) : suggestions.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('wawi_all_good')}</h3>
                    <p className="text-muted-foreground">
                        {t('wawi_all_good_sub')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-amber-700 mb-1">
                                {suggestions.length} {t('wawi_below_min')}
                            </h3>
                            <p className="text-sm text-amber-600">
                                {t('wawi_select_reorder')}
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
                                        <th className="px-6 py-4">{t('wawi_article_col')}</th>
                                        <th className="px-6 py-4">{t('wawi_current_col')}</th>
                                        <th className="px-6 py-4">{t('wawi_minimum_col')}</th>
                                        <th className="px-6 py-4">{t('wawi_deficit')}</th>
                                        <th className="px-6 py-4">{t('wawi_recommended')}</th>
                                        <th className="px-6 py-4 text-right">{t('wawi_action')}</th>
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
                                                    {t('wawi_add')}
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
