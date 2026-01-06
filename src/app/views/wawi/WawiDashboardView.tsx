import { useState, useEffect } from 'react';
import {
    Package, Warehouse, ShoppingCart, History, ArrowLeft,
    ExternalLink, Edit, Trash2, Truck, AlertTriangle
} from 'lucide-react';
import { MetricCard } from '../../components/MetricCard';
import { Button } from '../../components/ui/button';
import { wawiService, Part } from '../../services/wawiService';
import { useNavigate } from 'react-router-dom';

export function WawiDashboardView() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalArticles: 0, lowStockCount: 0, totalValue: 0 });
    const [criticalParts, setCriticalParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const dashboardStats = await wawiService.getStats();
            const articles = await wawiService.getArticles();

            setStats(dashboardStats);
            setCriticalParts(articles.filter(p => p.total_in_stock < p.minimum_stock).slice(0, 5));
        } catch (err) {
            console.error('Failed to load WAWI dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bestandsübersicht</h1>
                <p className="text-muted-foreground mt-2">
                    Alle Lagerprozesse und Artikelkennzahlen auf einen Blick.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <MetricCard
                    label="Artikel-Stamm"
                    value={stats.totalArticles}
                    icon={<Package className="w-5 h-5" />}
                />
                <MetricCard
                    label="Kritischer Bestand"
                    value={stats.lowStockCount}
                    variant={stats.lowStockCount > 0 ? 'error' : 'success'}
                    icon={<AlertTriangle className="w-5 h-5" />}
                />
                <MetricCard
                    label="Offene Bestellungen"
                    value="0"
                    icon={<ShoppingCart className="w-5 h-5" />}
                />
                <MetricCard
                    label="Lagerwert (EK)"
                    value={`${stats.totalValue.toLocaleString('de-DE')} €`}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Handlungsbedarf Section */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Kritische Bestände
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/wawi/artikel')}>
                            Alle ansehen <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="p-12 text-center text-muted-foreground">Lade...</div>
                        ) : criticalParts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground italic">
                                Kein dringender Handlungsbedarf. Alle Bestände sind gedeckt.
                            </div>
                        ) : criticalParts.map(part => (
                            <div key={part.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <div className="font-semibold text-sm">{part.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{part.IPN}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-red-500">{part.total_in_stock} Stück</div>
                                    <div className="text-[10px] text-muted-foreground">Min: {part.minimum_stock}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Letzte Bewegungen
                        </h3>
                    </div>
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <History className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground text-sm max-w-[200px]">
                            Hier erscheinen bald deine letzten Lagerbuchungen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
