import { useState, useEffect } from 'react';
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Angebote"
                subtitle={`Kundenangebote verwalten · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={loadData}>Aktualisieren</Button>
                        <Button variant="primary" size="sm">Neues Angebot</Button>
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
                <Card title="Offene Angebote">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : openOffers.length}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Warten auf Antwort</div>
                </Card>
                <Card title="Angenommen">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : acceptedOffers.length}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Erfolgreich</div>
                </Card>
                <Card title="Gesamtwert">
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {loading ? '...' : formatCurrency(totalValue)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Alle Angebote</div>
                </Card>
            </div>

            <Card title="Letzte Angebote">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Lade Angebote...
                    </div>
                ) : offers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {offers.slice(0, 10).map((offer, i) => (
                            <div
                                key={offer.id}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: i < Math.min(offers.length, 10) - 1 ? '1px solid var(--border)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{offer.productName || offer.shopName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                        {formatCurrency(offer.basePrice)} · {offer.shopName}
                                    </div>
                                </div>
                                <Badge variant={
                                    offer.status === 'accepted' ? 'success' :
                                        offer.status === 'draft' ? 'warning' : 'neutral'
                                }>
                                    {offer.status === 'accepted' ? 'Angenommen' :
                                        offer.status === 'draft' ? 'Entwurf' : offer.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Keine Angebote vorhanden
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OffersPage;

