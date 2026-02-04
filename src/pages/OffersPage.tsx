import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import apiClient from '../lib/apiClient';

interface Offer {
    id: string;
    orderId: string;
    shopName: string;
    basePrice: number;
    status: string;
    productName?: string;
    createdAt?: string;
}

const OffersPage = () => {
    const { timeframe } = useTimeframe();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/api/dashboard/offers');
            if (data && Array.isArray(data)) {
                setOffers(data);
            }
        } catch (err: any) {
            console.error('Failed to load offers:', err);
            setError(err.message || 'Fehler beim Laden der Angebote');
        } finally {
            setLoading(false);
        }
    };

    const openOffers = offers.filter(o => o.status === 'draft' || o.status === 'pending');
    const acceptedOffers = offers.filter(o => o.status === 'accepted');
    const totalValue = offers.reduce((acc, o) => acc + (o.basePrice || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'default'; label: string }> = {
            'accepted': { variant: 'success', label: 'Angenommen' },
            'draft': { variant: 'warning', label: 'Entwurf' },
            'pending': { variant: 'warning', label: 'Ausstehend' },
        };
        const config = statusMap[status] || { variant: 'default' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Angebote"
                subtitle={`Kundenangebote verwalten · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadData}>
                            Aktualisieren
                        </Button>
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            Neues Angebot
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
                    <div className="stat-card-label">Offene Angebote</div>
                    <div className="stat-card-value">{loading ? '—' : openOffers.length}</div>
                    <div className="stat-card-footer">Warten auf Antwort</div>
                </div>
                <div className="stat-card stat-card-success">
                    <div className="stat-card-label">Angenommen</div>
                    <div className="stat-card-value">{loading ? '—' : acceptedOffers.length}</div>
                    <div className="stat-card-footer">Erfolgreich</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Gesamtwert</div>
                    <div className="stat-card-value">{loading ? '—' : formatCurrency(totalValue)}</div>
                    <div className="stat-card-footer">Alle Angebote</div>
                </div>
            </div>

            {/* Offers List */}
            <Card title="Letzte Angebote" hover={false}>
                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-title">Lade Angebote...</div>
                    </div>
                ) : offers.length > 0 ? (
                    <div className="-mx-5 -mb-5">
                        {offers.slice(0, 10).map((offer) => (
                            <div key={offer.id} className="list-item">
                                <div className="flex-1 min-w-0">
                                    <div className="list-item-title truncate">
                                        {offer.productName || offer.shopName}
                                    </div>
                                    <div className="list-item-subtitle">
                                        {formatCurrency(offer.basePrice)} · {offer.shopName}
                                    </div>
                                </div>
                                {getStatusBadge(offer.status)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <FileText className="empty-state-icon" />
                        <div className="empty-state-title">Keine Angebote vorhanden</div>
                        <div className="empty-state-description">Erstellen Sie Ihr erstes Angebot</div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OffersPage;
