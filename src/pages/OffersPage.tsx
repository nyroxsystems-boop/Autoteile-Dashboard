import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const OffersPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Angebote"
                subtitle={`Kundenangebote verwalten · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Neues Angebot</Button>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <Card title="Offene Angebote">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Warten auf Antwort</div>
                </Card>
                <Card title="Konversionsrate">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—%</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Angebote → Bestellungen</div>
                </Card>
                <Card title="Durchschn. Wert">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— €</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Pro Angebot</div>
                </Card>
            </div>

            <Card title="Letzte Angebote">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Angebote vorhanden
                </div>
            </Card>
        </div>
    );
};

export default OffersPage;
