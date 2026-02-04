import { useEffect, useState } from 'react';
import { TrendingDown, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import apiClient from '../lib/apiClient';

interface ConversionStats {
  funnel: { stage: string; value: number }[];
  history: { date: string; val: number }[];
  reasons: { label: string; value: number }[];
}

const ConversionPage = () => {
  const { timeframe } = useTimeframe();
  const [data, setData] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/dashboard/analytics/conversion');
        if (data) setData(data as ConversionStats);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const funnel = data?.funnel || [];
  const sessions = data?.history || [];
  const reasons = data?.reasons || [];

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Konversion & Abbrüche" subtitle="Lade Daten..." />
        <Card hover={false}>
          <div className="empty-state">
            <div className="empty-state-title">Lade Konversions-Daten...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Konversion & Abbrüche"
        subtitle={`Trichter, Abbruchgründe und Verlauf · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Bericht erstellen</Button>
          </>
        }
      />

      {/* Funnel Stats */}
      <Card title="Trichter" subtitle="Besucher bis Bestellung" hover={false}>
        {funnel.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {funnel.map((s, idx) => (
              <div key={s.stage} className="stat-card">
                <div className="stat-card-label">{s.stage}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="h-1.5 rounded-full bg-muted/50 mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                    style={{ width: `${Math.max(20, 100 - idx * 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BarChart3 className="empty-state-icon" />
            <div className="empty-state-title">Keine Trichter-Daten</div>
          </div>
        )}
      </Card>

      {/* Session History */}
      <Card title="Verlauf Sitzungen / abgeschlossene Bestellungen" hover={false}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Badge variant="default">Sitzungen</Badge>
            <Badge variant="warning">Bestellungen</Badge>
          </div>
          {sessions.length > 0 ? (
            <div className="flex gap-2 items-end h-24">
              {sessions.map((d) => (
                <div key={d.date} className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground">{d.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">Keine Historie verfügbar</div>
            </div>
          )}
        </div>
      </Card>

      {/* Abandonment Reasons */}
      <Card title="Top Abbruchgründe" subtitle="Anteil in %" hover={false}>
        {reasons.length > 0 ? (
          <div className="space-y-3">
            {reasons.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <div className="w-40 text-sm text-muted-foreground truncate">{r.label}</div>
                <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${r.value}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium text-foreground">{r.value}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <TrendingDown className="empty-state-icon" />
            <div className="empty-state-title">Keine Abbruch-Daten</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConversionPage;
