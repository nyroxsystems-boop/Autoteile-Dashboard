import { Link2, Database, Plus, Server } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';

const WwsConnectionsPage = () => {
    const systems = [
        { name: 'SAP', icon: Server },
        { name: 'Microsoft Dynamics', icon: Database },
        { name: 'Sage', icon: Database },
        { name: 'DATEV', icon: Database },
        { name: 'Lexware', icon: Database }
    ];

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="WWS Verbindungen"
                subtitle="Warenwirtschaftssystem-Integrationen"
                actions={
                    <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                        Neue Verbindung
                    </Button>
                }
            />

            <Card title="Verbindungsstatus" hover={false}>
                <div className="flex items-center gap-4">
                    <Badge variant="default">Nicht verbunden</Badge>
                    <div className="flex-1">
                        <div className="font-semibold text-foreground">Kein WWS-System verbunden</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                            Verbinden Sie Ihr Warenwirtschaftssystem für automatische Synchronisation
                        </div>
                    </div>
                    <Link2 className="w-5 h-5 text-muted-foreground" />
                </div>
            </Card>

            <Card title="Verfügbare Systeme" hover={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 -mx-5 -mb-5 px-5 pb-5">
                    {systems.map((system) => {
                        const Icon = system.icon;
                        return (
                            <div
                                key={system.name}
                                className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{system.name}</div>
                                        <Badge variant="default">Verfügbar</Badge>
                                    </div>
                                </div>
                                <Button size="sm" variant="primary">Verbinden</Button>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default WwsConnectionsPage;
