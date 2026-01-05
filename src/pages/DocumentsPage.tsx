import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const DocumentsPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Belege & Dokumente"
                subtitle={`Rechnungen, Lieferscheine, Angebote · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Neues Dokument</Button>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
                <Card title="Rechnungen">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Gesamt</div>
                </Card>
                <Card title="Angebote">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Offen</div>
                </Card>
                <Card title="Lieferscheine">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Erstellt</div>
                </Card>
            </div>

            <Card title="Letzte Dokumente">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Dokumente vorhanden
                </div>
            </Card>
        </div>
    );
};

export default DocumentsPage;
