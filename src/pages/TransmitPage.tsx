import { Send, CheckCircle, FileText, History } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const TransmitPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Behörden-Übermittlung"
                subtitle={`Finanzamt & Steuerberater · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Vorschau</Button>
                        <Button variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                            Jetzt übermitteln
                        </Button>
                    </>
                }
            />

            <Card title="Übermittlungsstatus" hover={false}>
                <div className="flex items-center gap-4">
                    <Badge variant="success">Aktiv</Badge>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground">Automatische Übermittlung aktiviert</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                            Letzte Übermittlung: —
                        </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
            </Card>

            <Card title="Ausstehende Dokumente" hover={false}>
                <div className="empty-state">
                    <FileText className="empty-state-icon text-green-400" />
                    <div className="empty-state-title">Alle Dokumente übermittelt</div>
                    <div className="empty-state-description">Keine ausstehenden Übermittlungen</div>
                </div>
            </Card>

            <Card title="Übermittlungshistorie" hover={false}>
                <div className="empty-state">
                    <History className="empty-state-icon" />
                    <div className="empty-state-title">Keine Historie vorhanden</div>
                    <div className="empty-state-description">Übermittlungen werden hier protokolliert</div>
                </div>
            </Card>
        </div>
    );
};

export default TransmitPage;
