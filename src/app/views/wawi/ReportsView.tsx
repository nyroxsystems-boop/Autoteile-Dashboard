import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, Part } from '../../services/wawiService';

interface ReportData {
    totalInventoryValue: number;
    totalArticles: number;
    lowStockArticles: number;
    averageTurnover: number;
    topMovers: Part[];
    criticalStock: Part[];
}

export function ReportsView() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const articles = await wawiService.getArticles();
            await wawiService.getStats(); // Keep stats updated

            // Calculate inventory value (placeholder - needs backend support for purchase prices)
            const totalValue = articles.reduce((sum, a) => sum + (a.total_in_stock * 10), 0); // Mock price

            // Identify critical stock
            const critical = articles.filter(a => a.total_in_stock < a.minimum_stock);

            // Mock top movers
            const topMovers = articles.slice(0, 5);

            setReportData({
                totalInventoryValue: totalValue,
                totalArticles: articles.length,
                lowStockArticles: critical.length,
                averageTurnover: 2.5, // Mock
                topMovers,
                criticalStock: critical,
            });
        } catch (err) {
            console.error('Failed to load report data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format: 'csv' | 'excel') => {
        console.log(`Exporting report as ${format}`);
        // Placeholder for export functionality
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Berichte & Analysen</h1>
                    <p className="text-muted-foreground mt-1">
                        Lagerwert, Umschlag und kritische Bestände im Überblick.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="7d">Letzte 7 Tage</option>
                        <option value="30d">Letzte 30 Tage</option>
                        <option value="90d">Letzte 90 Tage</option>
                        <option value="year">Dieses Jahr</option>
                    </select>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('excel')}
                        className="rounded-xl"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportieren
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center text-muted-foreground animate-pulse">
                    Erstelle Berichte...
                </div>
            ) : reportData && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-primary" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {reportData.totalInventoryValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <div className="text-sm text-muted-foreground">Lagerwert (Gesamt)</div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {reportData.totalArticles}
                            </div>
                            <div className="text-sm text-muted-foreground">Artikel im Sortiment</div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {reportData.lowStockArticles}
                            </div>
                            <div className="text-sm text-muted-foreground">Kritische Bestände</div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {reportData.averageTurnover.toFixed(1)}x
                            </div>
                            <div className="text-sm text-muted-foreground">Ø Lagerumschlag</div>
                        </div>
                    </div>

                    {/* Critical Stock Table */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                <div>
                                    <h3 className="font-bold text-lg">Kritische Bestände</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Artikel unterhalb des Mindestbestands
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                        <th className="px-6 py-4">Artikel</th>
                                        <th className="px-6 py-4">Aktuell</th>
                                        <th className="px-6 py-4">Mindest</th>
                                        <th className="px-6 py-4">Differenz</th>
                                        <th className="px-6 py-4 text-right">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reportData.criticalStock.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                Keine kritischen Bestände
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.criticalStock.map(article => (
                                            <tr key={article.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm">{article.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{article.IPN}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-red-500">{article.total_in_stock}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm">{article.minimum_stock}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                        <span className="font-bold text-red-500">
                                                            -{article.minimum_stock - article.total_in_stock}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-lg text-primary"
                                                        onClick={() => window.location.href = '/wawi/nachbestellung'}
                                                    >
                                                        Nachbestellen
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Movers */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                                <div>
                                    <h3 className="font-bold text-lg">Top Artikel (Umsatz)</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Meistverkaufte Artikel im gewählten Zeitraum
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {reportData.topMovers.map((article, index) => (
                                <div
                                    key={article.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm">{article.name}</div>
                                        <div className="text-xs text-muted-foreground">{article.IPN}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">{article.total_in_stock} Stk.</div>
                                        <div className="text-xs text-muted-foreground">auf Lager</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
