import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const ReturnsPage = () => {
    const { timeframe } = useTimeframe();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <Card title="Offene Retouren">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>In Bearbeitung</div>
                </Card>
                <Card title="Retourenquote">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—%</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Letzten 30 Tage</div>
                </Card>
                <Card title="Durchschn. Bear­beitungszeit">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— Tage</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Median</div>
                </Card>
            </div>

            <Card title="Letzte Retouren">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Retouren vorhanden
                </div>
            </Card>
        </div>
    );
};

export default ReturnsPage;
