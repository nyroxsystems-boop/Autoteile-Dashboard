import React, { useState } from 'react';
import { Warehouse, MapPin, Package, AlertCircle } from 'lucide-react';
import { StockByLocation } from '../services/wawiService';

interface StockLocationManagerProps {
    locations: StockByLocation[];
    totalStock: number;
    minimumStock: number;
}

export function StockLocationManager({ locations, totalStock, minimumStock }: StockLocationManagerProps) {
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

    const getLocationTypeIcon = (code: string) => {
        if (code.startsWith('A')) return '🏢'; // Main warehouse
        if (code.startsWith('B')) return '📦'; // Shelf
        if (code.startsWith('Q')) return '⚠️'; // Quarantine
        if (code.startsWith('R')) return '↩️'; // Returns
        return '📍';
    };

    const totalAllocated = locations.reduce((sum, loc) => sum + loc.quantity, 0);
    const hasDiscrepancy = totalAllocated !== totalStock;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Lagerplatz-Verteilung</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Bestand auf {locations.length} Lagerplätze verteilt
                    </p>
                </div>

                {hasDiscrepancy && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 px-3 py-2 rounded-xl">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Abweichung erkannt</span>
                    </div>
                )}
            </div>

            {/* Summary Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <div className="text-xs font-bold text-primary/70 uppercase mb-1">Gesamt</div>
                        <div className="text-3xl font-bold text-primary">{totalStock}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-primary/70 uppercase mb-1">Verteilt</div>
                        <div className="text-3xl font-bold text-primary">{totalAllocated}</div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-primary/70 uppercase mb-1">Mindest</div>
                        <div className={`text - 3xl font - bold ${totalStock < minimumStock ? 'text-red-500' : 'text-primary'} `}>
                            {minimumStock}
                        </div>
                    </div>
                </div>
            </div>

            {/* Locations Grid */}
            <div className="grid gap-3">
                {locations.map((location) => {
                    const percentage = totalStock > 0 ? (location.quantity / totalStock) * 100 : 0;
                    const isSelected = selectedLocation === location.location_id;

                    return (
                        <button
                            key={location.location_id}
                            onClick={() => setSelectedLocation(isSelected ? null : location.location_id)}
                            className={`
p - 4 rounded - 2xl border - 2 transition - all text - left
                ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/20'
                                }
`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="text-2xl">{getLocationTypeIcon(location.location_code)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-foreground">{location.location_name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{location.location_code}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-lg">{location.quantity}</div>
                                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${percentage}% ` }}
                                />
                            </div>

                            {isSelected && (
                                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                                    <p>💡 Klicken Sie auf "Bestand buchen" um eine Umbuchung vorzunehmen.</p>
                                </div>
                            )}
                        </button>
                    );
                })}

                {locations.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Noch keine Lagerplätze zugewiesen</p>
                    </div>
                )}
            </div>
        </div>
    );
}
