import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Repeat, Edit, Save, History } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { wawiService, WarehouseLocation, Part } from '../../services/wawiService';
import { useI18n } from '../../../i18n';

export function InventoryMovementView() {
    const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION'>('IN');
    const { t } = useI18n();
    const [locations, setLocations] = useState<WarehouseLocation[]>([]);
    const [articles, setArticles] = useState<Part[]>([]);

    useEffect(() => {
        wawiService.getLocations().then(setLocations);
        wawiService.getArticles().then(setArticles);
    }, []);

    const handleSave = () => {
        toast.success(t('wawi_booking_saved'));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('wawi_booking')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('wawi_booking_sub')}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { id: 'IN', label: t('wawi_goods_in'), icon: ArrowDownLeft, color: 'emerald' },
                    { id: 'OUT', label: t('wawi_goods_out'), icon: ArrowUpRight, color: 'red' },
                    { id: 'TRANSFER', label: t('wawi_transfer'), icon: Repeat, color: 'blue' },
                    { id: 'CORRECTION', label: t('wawi_correction'), icon: Edit, color: 'amber' },
                ].map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setMovementType(type.id as typeof movementType)}
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
                        <label className="text-sm font-semibold text-foreground ml-1">{t('wawi_select_article')}</label>
                        <select className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-muted/50 transition-colors">
                            <option value="">{t('wawi_select_article')}</option>
                            {articles.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.IPN})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">{t('wawi_quantity')}</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">{t('wawi_reference')}</label>
                        <input
                            type="text"
                            placeholder={t('wawi_reference_hint')}
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground ml-1">{t('wawi_location')}</label>
                        <select className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                            <option value="">{t('wawi_location_choose')}</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.code} - {loc.name} ({loc.current_stock || 0} {t('wawi_current')})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                    <Button variant="outline" className="rounded-xl px-6">{t('wawi_cancel')}</Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 font-bold">
                        <Save className="w-4 h-4 mr-2" /> {t('wawi_save_booking')}
                    </Button>
                </div>
            </div>

            <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-8 text-center">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-muted-foreground">{t('wawi_movement_journal')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('wawi_movement_journal_hint')}</p>
            </div>
        </div>
    );
}
