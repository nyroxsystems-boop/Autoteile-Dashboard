import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';

const PricingPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Preisprofile"
                subtitle="Margen, Preisgruppen und Rabatte verwalten"
                actions={
                    <>
                        <Button variant="secondary" size="sm">Import</Button>
                        <Button variant="primary" size="sm">Neue Preisgruppe</Button>
                    </>
                }
            />

            <Card title="Standard Margen">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                            Standardaufschlag %
                        </label>
                        <input
                            type="number"
                            defaultValue="25"
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                background: 'var(--bg-panel)',
                                color: 'var(--text)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                            Mindestmarge %
                        </label>
                        <input
                            type="number"
                            defaultValue="10"
                            style={{
                                width: '100%',
                                padding: 8,
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                background: 'var(--bg-panel)',
                                color: 'var(--text)'
                            }}
                        />
                    </div>
                </div>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Button size="sm">Speichern</Button>
                </div>
            </Card>

            <Card title="Preisgruppen">
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    Keine Preisgruppen definiert
                </div>
            </Card>
        </div>
    );
};

export default PricingPage;
