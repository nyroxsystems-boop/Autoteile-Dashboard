import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import apiClient from '../lib/apiClient';

interface Recommendation {
    id: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
}

const RecommendationsPage = () => {
    const { timeframe } = useTimeframe();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/api/dashboard/recommendations');
            if (data && Array.isArray(data)) {
                setRecommendations(data);
            } else {
                // No recommendations endpoint yet - show empty state
                setRecommendations([]);
            }
        } catch (err: any) {
            console.log('Recommendations not available:', err);
            // API endpoint not available - show empty state
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

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
                        <Button variant="secondary" size="sm" onClick={loadRecommendations}>Aktualisieren</Button>
                        <Button variant="primary" size="sm" disabled={recommendations.length === 0}>Alle umsetzen</Button>
                    </>
                }
            />

            <Card title={loading ? 'Lade Empfehlungen...' : `${recommendations.length} aktive Empfehlungen`}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        Analysiere Daten...
                    </div>
                ) : recommendations.length > 0 ? (
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
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Keine Empfehlungen verfügbar</div>
                        <div style={{ fontSize: 13 }}>
                            KI-Empfehlungen werden generiert, sobald genügend Daten vorhanden sind.
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RecommendationsPage;

