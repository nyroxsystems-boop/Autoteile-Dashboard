import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const TransmitPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Behörden-Übermittlung"
                subtitle={`Finanzamt & Steuerberater · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Vorschau</Button>
                        <Button variant="primary" size="sm">Jetzt übermitteln</Button>
                    </>
                }
            />

            <Card title="Übermittlungsstatus">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                    <Badge variant="success">Aktiv</Badge>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Automatische Übermittlung aktiviert</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            Letzte Übermittlung: —
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Ausstehende Dokumente">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Alle Dokumente übermittelt
                </div>
            </Card>

            <Card title="Übermittlungshistorie">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Historie vorhanden
                </div>
            </Card>
        </div>
    );
};

export default TransmitPage;
