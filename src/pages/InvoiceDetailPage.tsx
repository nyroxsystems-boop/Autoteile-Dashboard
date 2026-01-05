import { useParams } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';

const InvoiceDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title={`Rechnung #${id || '—'}`}
                subtitle="Rechnungsdetails (Legacy)"
                actions={
                    <>
                        <Button variant="secondary" size="sm">PDF Download</Button>
                        <Button variant="primary" size="sm">Bearbeiten</Button>
                    </>
                }
            />

            <Card>
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                        ℹ️ Hinweis: Legacy Route
                    </div>
                    <div style={{ color: 'var(--muted)', marginBottom: 16 }}>
                        Diese Rechnung wird jetzt über die Bestellung verwaltet.
                    </div>
                    <Button as="a" href={`/orders/${id}`}>
                        Zur Bestellung wechseln
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default InvoiceDetailPage;
