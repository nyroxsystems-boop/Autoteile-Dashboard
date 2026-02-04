import { useState, useEffect } from 'react';
import { Truck, RefreshCw, Plus, Star } from 'lucide-react';
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

    const renderRating = (rating: string | number | undefined) => {
        const stars = typeof rating === 'number' ? rating : 4;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Lieferanten"
                subtitle="Lieferantenbeziehungen verwalten"
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadData}>
                            Aktualisieren
                        </Button>
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            Neuer Lieferant
                        </Button>
                    </>
                }
            />

            {error && (
                <Card hover={false}>
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <span className="text-sm">{error}</span>
                    </div>
                </Card>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="stat-card-label">Aktive Lieferanten</div>
                    <div className="stat-card-value">{loading ? '—' : activeSuppliers.length}</div>
                    <div className="stat-card-footer">Verbunden</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Durchschn. Lieferzeit</div>
                    <div className="stat-card-value">
                        {loading ? '—' : '2-3'}
                        <span className="stat-card-unit">Tage</span>
                    </div>
                    <div className="stat-card-footer">Median</div>
                </div>
                <div className="stat-card stat-card-success">
                    <div className="stat-card-label">Zuverlässigkeit</div>
                    <div className="stat-card-value">{loading ? '—' : `${avgReliability}%`}</div>
                    <div className="stat-card-footer">Pünktliche Lieferungen</div>
                </div>
            </div>

            {/* Suppliers Table */}
            <Card title="Lieferantenliste" hover={false}>
                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-title">Lade Lieferanten...</div>
                    </div>
                ) : suppliers.length > 0 ? (
                    <div className="-mx-5 -mb-5 overflow-x-auto">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>API-Typ</th>
                                    <th>Bewertung</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td className="font-medium text-foreground">{supplier.name}</td>
                                        <td>
                                            <Badge variant="default">{supplier.api_type || 'REST'}</Badge>
                                        </td>
                                        <td>{renderRating(supplier.rating)}</td>
                                        <td>
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
                    <div className="empty-state">
                        <Truck className="empty-state-icon" />
                        <div className="empty-state-title">Keine Lieferanten konfiguriert</div>
                        <div className="empty-state-description">Fügen Sie Ihren ersten Lieferanten hinzu</div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SuppliersPage;
