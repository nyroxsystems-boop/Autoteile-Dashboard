import { Wallet, AlertTriangle, Clock, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const CapitalPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Gebundenes Kapital Radar"
                subtitle={`Lagerkapital-Analyse · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                            PDF Export
                        </Button>
                        <Button variant="primary" size="sm">Optimierung starten</Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Gesamtwert Lager</div>
                        <Wallet className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">— €</div>
                    <div className="stat-card-footer">Aktueller Bestand</div>
                </div>
                <div className="stat-card stat-card-danger">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Langsam drehend</div>
                        <Clock className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">— €</div>
                    <div className="stat-card-footer">&gt;90 Tage im Lager</div>
                </div>
                <div className="stat-card stat-card-danger">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Totes Kapital</div>
                        <AlertTriangle className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">— €</div>
                    <div className="stat-card-footer">&gt;180 Tage im Lager</div>
                </div>
            </div>

            <Card title="Kritische Artikel" hover={false}>
                <div className="empty-state">
                    <Wallet className="empty-state-icon" />
                    <div className="empty-state-title">Keine Daten verfügbar</div>
                    <div className="empty-state-description">Kapital-Analyse wird geladen</div>
                </div>
            </Card>
        </div>
    );
};

export default CapitalPage;
