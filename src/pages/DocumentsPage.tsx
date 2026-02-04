import { FileText, Receipt, Truck, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const DocumentsPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Belege & Dokumente"
                subtitle={`Rechnungen, Lieferscheine, Angebote · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            Neues Dokument
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Rechnungen</div>
                        <Receipt className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">—</div>
                    <div className="stat-card-footer">Gesamt</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Angebote</div>
                        <FileText className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">—</div>
                    <div className="stat-card-footer">Offen</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-start justify-between mb-2">
                        <div className="stat-card-label">Lieferscheine</div>
                        <Truck className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="stat-card-value">—</div>
                    <div className="stat-card-footer">Erstellt</div>
                </div>
            </div>

            <Card title="Letzte Dokumente" hover={false}>
                <div className="empty-state">
                    <FileText className="empty-state-icon" />
                    <div className="empty-state-title">Keine Dokumente vorhanden</div>
                    <div className="empty-state-description">Erstellen Sie Ihr erstes Dokument</div>
                </div>
            </Card>
        </div>
    );
};

export default DocumentsPage;
