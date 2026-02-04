import { Tag, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';

const PricingPage = () => {
    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Preisprofile"
                subtitle="Margen, Preisgruppen und Rabatte verwalten"
                actions={
                    <>
                        <Button variant="secondary" size="sm">Import</Button>
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            Neue Preisgruppe
                        </Button>
                    </>
                }
            />

            <Card title="Standard Margen" hover={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="form-label">Standardaufschlag %</label>
                        <Input type="number" defaultValue="25" />
                    </div>
                    <div>
                        <label className="form-label">Mindestmarge %</label>
                        <Input type="number" defaultValue="10" />
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button>Speichern</Button>
                </div>
            </Card>

            <Card title="Preisgruppen" hover={false}>
                <div className="empty-state">
                    <Tag className="empty-state-icon" />
                    <div className="empty-state-title">Keine Preisgruppen definiert</div>
                    <div className="empty-state-description">Erstellen Sie Ihre erste Preisgruppe</div>
                </div>
            </Card>
        </div>
    );
};

export default PricingPage;
