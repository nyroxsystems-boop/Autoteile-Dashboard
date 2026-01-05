import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';

const IntegrationsPage = () => {
    const integrations = [
        { name: 'eBay', status: 'connected', icon: '🛒' },
        { name: 'Amazon', status: 'disconnected', icon: '📦' },
        { name: 'Shopify', status: 'disconnected', icon: '🏪' },
        { name: 'WooCommerce', status: 'disconnected', icon: '🛍️' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Shops & Integrationen"
                subtitle="Verkaufskanäle und externe Systeme verbinden"
                actions={
                    <>
                        <Button variant="primary" size="sm">Neuen Shop hinzufügen</Button>
                    </>
                }
            />

            <Card title="Verbundene Shops">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                    {integrations.map((integration) => (
                        <div
                            key={integration.name}
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 32 }}>{integration.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{integration.name}</div>
                                    <Badge variant={integration.status === 'connected' ? 'success' : 'neutral'}>
                                        {integration.status === 'connected' ? 'Verbunden' : 'Nicht verbunden'}
                                    </Badge>
                                </div>
                            </div>
                            <Button size="sm" variant={integration.status === 'connected' ? 'secondary' : 'primary'}>
                                {integration.status === 'connected' ? 'Konfigurieren' : 'Verbinden'}
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="API Einstellungen">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Wählen Sie einen Shop aus, um API-Einstellungen zu konfigurieren
                </div>
            </Card>
        </div>
    );
};

export default IntegrationsPage;
