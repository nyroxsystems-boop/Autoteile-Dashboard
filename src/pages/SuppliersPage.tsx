import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { getSuppliers, Supplier } from '../app/api/wws';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err: any) {
            console.error('Failed to load suppliers:', err);
            setError(err.message || 'Fehler beim Laden der Lieferanten');
        } finally {
            setLoading(false);
        }
    };

    const activeSuppliers = suppliers.filter(s => s.status === 'active' || !s.status);
    const avgReliability = suppliers.length > 0
        ? Math.round(suppliers.reduce((acc, s) => acc + (s.reliability || 95), 0) / suppliers.length)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Lieferanten"
                subtitle="Lieferantenbeziehungen verwalten"
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={loadData}>Aktualisieren</Button>
                        <Button variant="primary" size="sm">Neuer Lieferant</Button>
                    </>
                }
            />

            {error && (
                <Card>
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--danger)' }}>
                        ⚠️ {error}
                    </div>
                </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <Card title="Aktive Lieferanten">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : activeSuppliers.length}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Verbunden</div>
                </Card>
                <Card title="Durchschn. Lieferzeit">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : '2-3'} Tage
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Median</div>
                </Card>
                <Card title="Zuverlässigkeit">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : `${avgReliability}%`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Pünktliche Lieferungen</div>
                </Card>
            </div>

            <Card title="Lieferantenliste">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Lade Lieferanten...
                    </div>
                ) : suppliers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--muted)' }}>Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--muted)' }}>API-Typ</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--muted)' }}>Bewertung</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--muted)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr key={supplier.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>{supplier.name}</td>
                                        <td style={{ padding: '12px' }}>
                                            <Badge variant="neutral">{supplier.api_type || 'REST'}</Badge>
                                        </td>
                                        <td style={{ padding: '12px' }}>{supplier.rating || '⭐⭐⭐⭐'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <Badge variant={supplier.status === 'inactive' ? 'danger' : 'success'}>
                                                {supplier.status === 'inactive' ? 'Inaktiv' : 'Aktiv'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Lieferanten konfiguriert
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SuppliersPage;

