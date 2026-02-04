import { RotateCcw, Clock, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const ReturnsPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Retouren"
                subtitle={`Rücksendungen und Reklamationen · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Export</Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Offene Retouren</div>
                        <RotateCcw className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">—</div>
                    <div className="stat-card-footer">In Bearbeitung</div>
                </div>
                <div className="stat-card stat-card-danger">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Retourenquote</div>
                        <TrendingDown className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">—%</div>
                    <div className="stat-card-footer">Letzten 30 Tage</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Ø Bearbeitungszeit</div>
                        <Clock className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">
                        —<span className="stat-card-unit">Tage</span>
                    </div>
                    <div className="stat-card-footer">Median</div>
                </div>
            </div>

            <Card title="Letzte Retouren" hover={false}>
                <div className="empty-state">
                    <RotateCcw className="empty-state-icon" />
                    <div className="empty-state-title">Keine Retouren vorhanden</div>
                    <div className="empty-state-description">Retouren werden hier aufgelistet</div>
                </div>
            </Card>
        </div>
    );
};

export default ReturnsPage;
