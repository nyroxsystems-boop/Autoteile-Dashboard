import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const RecommendationsPage = () => {
    const { timeframe } = useTimeframe();

    const recommendations = [
        {
            id: 1,
            title: 'Preis für "Bremsscheiben" anpassen',
            description: 'Ihre Preise sind 8% höher als der Marktdurchschnitt',
            priority: 'high',
            impact: '+12% potenzielle Verkäufe'
        },
        {
            id: 2,
            title: 'Lagerbestand optimieren',
            description: '3 Artikel sind seit 90+ Tagen nicht verkauft worden',
            priority: 'medium',
            impact: '-450 € gebundenes Kapital'
        },
        {
            id: 3,
            title: 'Marketing: WhatsApp Automation',
            description: 'Automatisiertes Follow-up könnte Konversion um 15% steigern',
            priority: 'high',
            impact: '+2.3k € Umsatz/Monat'
        }
    ];

    const getPriorityBadge = (priority: string) => {
        if (priority === 'high') return <Badge variant="danger">Hoch</Badge>;
        if (priority === 'medium') return <Badge variant="warning">Mittel</Badge>;
        return <Badge variant="neutral">Niedrig</Badge>;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader
                title="Empfehlungen"
                subtitle={`KI-gestützte Optimierungsvorschläge · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm">Filter</Button>
                        <Button variant="primary" size="sm">Alle umsetzen</Button>
                    </>
                }
            />

            <Card title={`${recommendations.length} aktive Empfehlungen`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recommendations.map((rec) => (
                        <div
                            key={rec.id}
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{rec.title}</div>
                                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{rec.description}</div>
                                </div>
                                {getPriorityBadge(rec.priority)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                <div style={{ fontSize: 13, color: 'var(--success)' }}>💡 {rec.impact}</div>
                                <Button size="sm" variant="primary">Umsetzen</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default RecommendationsPage;
