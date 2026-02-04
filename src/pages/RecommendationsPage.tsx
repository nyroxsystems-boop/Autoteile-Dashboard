import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Sparkles, Target } from 'lucide-react';
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
                setRecommendations([]);
            }
        } catch (err: any) {
            console.log('Recommendations not available:', err);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'high') return <Badge variant="danger">Hoch</Badge>;
        if (priority === 'medium') return <Badge variant="warning">Mittel</Badge>;
        return <Badge variant="default">Niedrig</Badge>;
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Empfehlungen"
                subtitle={`KI-gestützte Optimierungsvorschläge · ${timeframe}`}
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadRecommendations}>
                            Aktualisieren
                        </Button>
                        <Button variant="primary" size="sm" disabled={recommendations.length === 0}>
                            Alle umsetzen
                        </Button>
                    </>
                }
            />

            <Card
                title={loading ? 'Lade Empfehlungen...' : `${recommendations.length} aktive Empfehlungen`}
                hover={false}
            >
                {loading ? (
                    <div className="empty-state">
                        <Sparkles className="empty-state-icon animate-pulse" />
                        <div className="empty-state-title">Analysiere Daten...</div>
                    </div>
                ) : recommendations.length > 0 ? (
                    <div className="space-y-3 -mx-5 -mb-5">
                        {recommendations.map((rec) => (
                            <div
                                key={rec.id}
                                className="px-5 py-4 border-t border-border hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-foreground mb-1">{rec.title}</div>
                                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                                    </div>
                                    <div className="ml-4">{getPriorityBadge(rec.priority)}</div>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                        <Lightbulb className="w-4 h-4" />
                                        <span>{rec.impact}</span>
                                    </div>
                                    <Button size="sm" variant="primary">Umsetzen</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Target className="empty-state-icon" />
                        <div className="empty-state-title">Keine Empfehlungen verfügbar</div>
                        <div className="empty-state-description">
                            KI-Empfehlungen werden generiert, sobald genügend Daten vorhanden sind.
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RecommendationsPage;
