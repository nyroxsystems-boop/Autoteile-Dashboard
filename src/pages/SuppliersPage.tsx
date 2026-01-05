import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';

const SuppliersPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Lieferanten"
                subtitle="Lieferantenbeziehungen verwalten"
                actions={
                    <>
                        <Button variant="secondary" size="sm">Import</Button>
                        <Button variant="primary" size="sm">Neuer Lieferant</Button>
                    </>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <Card title="Aktive Lieferanten">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Verbunden</div>
                </Card>
                <Card title="Durchschn. Lieferzeit">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>— Tage</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Median</div>
                </Card>
                <Card title="Zuverlässigkeit">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>—%</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Pünktliche Lieferungen</div>
                </Card>
            </div>

            <Card title="Lieferantenliste">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Lieferanten konfiguriert
                </div>
            </Card>
        </div>
    );
};

export default SuppliersPage;
