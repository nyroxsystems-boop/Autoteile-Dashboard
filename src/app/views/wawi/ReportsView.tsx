import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, Part, StockMovement } from '../../services/wawiService';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

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
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const articles = await wawiService.getArticles();

            // Calculate real inventory value using purchase_price or sale_price from actual article data
            const totalValue = articles.reduce((sum, a) => {
                const unitPrice = a.purchase_price || a.sale_price || 0;
                return sum + (a.total_in_stock * unitPrice);
            }, 0);

            // Identify critical stock
            const critical = articles.filter(a => a.total_in_stock < a.minimum_stock);

            // Calculate days for date range
            const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
            const lookbackDays = daysMap[dateRange] || 30;

            // Get real movement data to determine top movers
            let movements: StockMovement[] = [];
            try {
                movements = await wawiService.getRecentMovements(200);
            } catch { /* graceful fallback */ }

            // Filter movements by date range
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
            const filteredMovements = movements.filter(m =>
                new Date(m.created_at) >= cutoffDate && m.type === 'OUT'
            );

            // Count outgoing quantities per part to find top movers
            const partMovementCounts = new Map<number | string, number>();
            filteredMovements.forEach(m => {
                const current = partMovementCounts.get(m.part_id) || 0;
                partMovementCounts.set(m.part_id, current + m.quantity);
            });

            // Sort articles by movement count to get real top movers
            const topMovers = articles
                .map(a => ({ ...a, movementCount: partMovementCounts.get(Number(a.id)) || 0 }))
                .sort((a, b) => b.movementCount - a.movementCount)
                .slice(0, 5);

            // Calculate average turnover rate: total outgoing / avg stock (annualized)
            const totalOutgoing = filteredMovements.reduce((sum, m) => sum + m.quantity, 0);
            const avgStock = articles.reduce((sum, a) => sum + a.total_in_stock, 0) / Math.max(articles.length, 1);
            const turnoverInPeriod = avgStock > 0 ? totalOutgoing / avgStock : 0;
            const annualizedTurnover = turnoverInPeriod * (365 / lookbackDays);

            setReportData({
                totalInventoryValue: totalValue,
                totalArticles: articles.length,
                lowStockArticles: critical.length,
                averageTurnover: annualizedTurnover,
                topMovers,
                criticalStock: critical,
            });
        } catch (err) {
            console.error('Failed to load report data', err);
            toast.error('Fehler beim Laden der Berichtsdaten');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'datev') => {
        setExporting(true);
        try {
            if (format === 'datev') {
                // Use the existing DATEV export from wawiService
                const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'year': 365 };
                const lookbackDays = daysMap[dateRange] || 30;
                const from = new Date();
                from.setDate(from.getDate() - lookbackDays);
                await wawiService.exportDATEV(from.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
                toast.success(t('wawi_export_success'));
            } else {
                // CSV export: generate from current report data
                if (!reportData) return;
                const csvRows = [
                    ['Artikel', 'IPN', 'Bestand', 'Mindestbestand', 'Status'].join(';'),
                    ...reportData.criticalStock.map(a =>
                        [a.name, a.IPN, a.total_in_stock, a.minimum_stock, 'Kritisch'].join(';')
                    ),
                ];
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lager-bericht_${dateRange}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(t('wawi_export_success'));
            }
        } catch (err) {
            console.error('Export failed', err);
            toast.error('Export fehlgeschlagen');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('wawi_reports_title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('wawi_reports_subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="7d">{t('wawi_time_7d')}</option>
                        <option value="30d">{t('wawi_time_30d')}</option>
                        <option value="90d">{t('wawi_time_90d')}</option>
                        <option value="year">{t('wawi_time_year')}</option>
                    </select>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('csv')}
                        className="rounded-xl"
                        disabled={exporting || !reportData}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exporting ? t('wawi_exporting') : 'CSV'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('datev')}
                        className="rounded-xl"
                        disabled={exporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        DATEV
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center text-muted-foreground animate-pulse">
                    {t('wawi_loading')}
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
                            <div className="text-sm text-muted-foreground">{t('wawi_stock_value')}</div>
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
                            <div className="text-sm text-muted-foreground">{t('wawi_articles')}</div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                {reportData.lowStockArticles > 0 && <TrendingDown className="w-5 h-5 text-red-500" />}
                            </div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {reportData.lowStockArticles}
                            </div>
                            <div className="text-sm text-muted-foreground">{t('wawi_critical_stock')}</div>
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
                            <div className="text-sm text-muted-foreground">{t('wawi_turnover_rate')}</div>
                        </div>
                    </div>

                    {/* Critical Stock Table */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                <div>
                                    <h3 className="font-bold text-lg">{t('wawi_critical_stocks')}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {t('wawi_critical_stocks_desc')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                        <th className="px-6 py-4">{t('wawi_article_col')}</th>
                                        <th className="px-6 py-4">{t('wawi_current_stock')}</th>
                                        <th className="px-6 py-4">{t('wawi_min_stock')}</th>
                                        <th className="px-6 py-4">{t('wawi_difference')}</th>
                                        <th className="px-6 py-4 text-right">{t('wawi_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reportData.criticalStock.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                {t('wawi_no_action_needed')}
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
                                                        {t('wawi_reorder')}
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
                                    <h3 className="font-bold text-lg">{t('wawi_top_movers')}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {t('wawi_top_movers_desc')}
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
                                        <div className="font-bold text-sm">{article.total_in_stock} {t('wawi_pieces')}</div>
                                        <div className="text-xs text-muted-foreground">{t('wawi_in_stock')}</div>
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
