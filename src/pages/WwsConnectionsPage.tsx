import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';

const WwsConnectionsPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="WWS Verbindungen"
                subtitle="Warenwirtschaftssystem-Integrationen"
                actions={
                    <>
                        <Button variant="primary" size="sm">Neue Verbindung</Button>
                    </>
                }
            />

            <Card title="Verbindungsstatus">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                    <Badge variant="neutral">Nicht verbunden</Badge>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Kein WWS-System verbunden</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            Verbinden Sie Ihr Warenwirtschaftssystem für automatische Synchronisation
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Verfügbare Systeme">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                    {['SAP', 'Microsoft Dynamics', 'Sage', 'DATEV', 'Lexware'].map((system) => (
                        <div
                            key={system}
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{system}</div>
                                <Badge variant="neutral">Verfügbar</Badge>
                            </div>
                            <Button size="sm" variant="primary">
                                Verbinden
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default WwsConnectionsPage;
