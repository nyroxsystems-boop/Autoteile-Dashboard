import { ShoppingCart, Package, Store, ShoppingBag, Plus, Settings } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';

const IntegrationsPage = () => {
    const integrations = [
        { name: 'eBay', status: 'connected', icon: ShoppingCart },
        { name: 'Amazon', status: 'disconnected', icon: Package },
        { name: 'Shopify', status: 'disconnected', icon: Store },
        { name: 'WooCommerce', status: 'disconnected', icon: ShoppingBag }
    ];

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Shops & Integrationen"
                subtitle="Verkaufskanäle und externe Systeme verbinden"
                actions={
                    <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                        Neuen Shop hinzufügen
                    </Button>
                }
            />

            <Card title="Verbundene Shops" hover={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 -mx-5 -mb-5 px-5 pb-5">
                    {integrations.map((integration) => {
                        const Icon = integration.icon;
                        return (
                            <div
                                key={integration.name}
                                className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{integration.name}</div>
                                        <Badge variant={integration.status === 'connected' ? 'success' : 'default'}>
                                            {integration.status === 'connected' ? 'Verbunden' : 'Nicht verbunden'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={integration.status === 'connected' ? 'secondary' : 'primary'}
                                    icon={integration.status === 'connected' ? <Settings className="w-3.5 h-3.5" /> : undefined}
                                >
                                    {integration.status === 'connected' ? 'Konfigurieren' : 'Verbinden'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card title="API Einstellungen" hover={false}>
                <div className="empty-state">
                    <Settings className="empty-state-icon" />
                    <div className="empty-state-title">API Einstellungen</div>
                    <div className="empty-state-description">Wählen Sie einen Shop aus, um API-Einstellungen zu konfigurieren</div>
                </div>
            </Card>
        </div>
    );
};

export default IntegrationsPage;
