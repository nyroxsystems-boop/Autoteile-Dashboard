import { useState, useEffect } from 'react';
import { History, ArrowDownLeft, ArrowUpRight, Repeat, Edit, Filter, Calendar } from 'lucide-react';
import { StockMovement, wawiService } from '../../services/wawiService';

interface MovementLogProps {
    partId: number;
}

export function MovementLog({ partId }: MovementLogProps) {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION'>('all');

    useEffect(() => {
        loadMovements();
    }, [partId]);

    const loadMovements = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getMovementHistory(partId);
            setMovements(data);
        } catch (err) {
            console.error('Failed to load movements', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = filter === 'all'
        ? movements
        : movements.filter(m => m.type === filter);

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'IN': return ArrowDownLeft;
            case 'OUT': return ArrowUpRight;
            case 'TRANSFER': return Repeat;
            case 'CORRECTION': return Edit;
            default: return History;
        }
    };

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'IN': return 'text-emerald-600 bg-emerald-500/10';
            case 'OUT': return 'text-red-600 bg-red-500/10';
            case 'TRANSFER': return 'text-blue-600 bg-blue-500/10';
            case 'CORRECTION': return 'text-amber-600 bg-amber-500/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    const getMovementLabel = (type: string) => {
        switch (type) {
            case 'IN': return 'Wareneingang';
            case 'OUT': return 'Warenausgang';
            case 'TRANSFER': return 'Umbuchung';
            case 'CORRECTION': return 'Korrektur';
            default: return type;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Bewegungsjournal</h3>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="all">Alle Bewegungen</option>
                        <option value="IN">Wareneingänge</option>
                        <option value="OUT">Warenausgänge</option>
                        <option value="TRANSFER">Umbuchungen</option>
                        <option value="CORRECTION">Korrekturen</option>
                    </select>
                </div>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse">
                        Lade Bewegungen...
                    </div>
                ) : filteredMovements.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm italic">Noch keine Buchungen erfasst.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredMovements.map((movement) => {
                            const Icon = getMovementIcon(movement.type);
                            const colorClass = getMovementColor(movement.type);

                            return (
                                <div key={movement.id} className="p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} flex-shrink-0`}>
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm">{getMovementLabel(movement.type)}</span>
                                                        <span className={`text-lg font-bold ${movement.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                        </span>
                                                    </div>

                                                    {(movement.from_location || movement.to_location) && (
                                                        <div className="text-xs text-muted-foreground mb-1">
                                                            {movement.from_location && <span>Von: {movement.from_location}</span>}
                                                            {movement.from_location && movement.to_location && <span className="mx-2">→</span>}
                                                            {movement.to_location && <span>Nach: {movement.to_location}</span>}
                                                        </div>
                                                    )}

                                                    {movement.reference && (
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            Ref: {movement.reference}
                                                        </div>
                                                    )}

                                                    {movement.notes && (
                                                        <div className="text-xs text-muted-foreground italic mt-1">
                                                            {movement.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(movement.created_at).toLocaleDateString('de-DE', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(movement.created_at).toLocaleTimeString('de-DE', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {movement.created_by_name || movement.created_by}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
