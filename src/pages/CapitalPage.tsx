import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const CapitalPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Gebundenes Kapital Radar"
                subtitle={`Lagerkapital-Analyse · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">PDF Export</Button>
                        <Button variant="primary" size="sm">Optimierung starten</Button>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <Card title="Gesamtwert Lager">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— €</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Aktueller Bestand</div>
                </Card>
                <Card title="Langsam drehend">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— €</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>&gt;90 Tage im Lager</div>
                </Card>
                <Card title="Totes Kapital">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— €</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>&gt;180 Tage im Lager</div>
                </Card>
            </div>

            <Card title="Kritische Artikel">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Daten verfügbar
                </div>
            </Card>
        </div>
    );
};

export default CapitalPage;
