import { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Download, FileText, X, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import apiClient from '../lib/apiClient';

interface ForensicsStats {
  lostRevenue: number;
  drivers: { label: string; value: number }[];
  hotspots: { sku: string; cause: string; abbruch: string; retouren: string; marge: string; note: string }[];
}

const ForensicsPage = () => {
  const { timeframe } = useTimeframe();
  const [selected, setSelected] = useState<string[]>([]);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [data, setData] = useState<ForensicsStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/dashboard/analytics/forensics');
        if (data) setData(data as ForensicsStats);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const hotspotData = data?.hotspots || [];
  const allSelected = selected.length === hotspotData.length && hotspotData.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : hotspotData.map((h) => h.sku));
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const detail = useMemo(() => hotspotData.find((h) => h.sku === detailsId) ?? hotspotData[0], [detailsId, hotspotData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Forensik" subtitle="Lade Daten..." />
        <Card hover={false}>
          <div className="empty-state">
            <div className="empty-state-title">Lade Forensik-Daten...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Forensik"
        subtitle={`Abbruch- & Retourenursachen – Treiber, Hotspots und Maßnahmen · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Button>
            <Button variant="primary" size="sm" icon={<FileText className="w-3.5 h-3.5" />}>Bericht erstellen</Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card stat-card-danger">
          <div className="stat-card-label">Vermeidbarer Umsatzverlust</div>
          <div className="stat-card-value">{data?.lostRevenue ? `${data.lostRevenue} €` : '0 €'}</div>
          <div className="stat-card-footer">letzte 30 Tage</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Haupttreiber</div>
          <div className="stat-card-value text-base">{data?.drivers?.[0]?.label || 'Keine Daten'}</div>
          <div className="stat-card-footer">Top Ursache</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Betroffene SKUs</div>
          <div className="stat-card-value">{data?.hotspots?.length || 0}</div>
          <div className="stat-card-footer">mit &gt;10% Abbruch</div>
        </div>
      </div>

      {/* Bar Chart */}
      <Card title="Abbruch- & Retourenursachen" hover={false}>
        <CauseBarChart data={data?.drivers || []} />
      </Card>

      {/* Hotspots Table */}
      <Card title="Hotspots (SKU × Ursache)" hover={false}>
        {selected.length > 0 && (
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
            <span className="text-sm text-muted-foreground">{selected.length} markiert</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Markierte analysieren</Button>
              <Button size="sm" variant="ghost">Als Aufgabe speichern</Button>
            </div>
          </div>
        )}

        {hotspotData.length === 0 ? (
          <div className="empty-state">
            <CheckCircle className="empty-state-icon text-green-400" />
            <div className="empty-state-title">Keine Hotspots gefunden</div>
            <div className="empty-state-description">Gut gemacht! Keine kritischen SKUs</div>
          </div>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-border"
                      aria-label="Alle auswählen"
                    />
                  </th>
                  <th>SKU / Artikel</th>
                  <th>Ursache</th>
                  <th>Abbruchrate</th>
                  <th>Retourenquote</th>
                  <th>Ø Marge</th>
                  <th>Empfehlung</th>
                  <th className="text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {hotspotData.map((h) => (
                  <tr key={h.sku}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(h.sku)}
                        onChange={() => toggle(h.sku)}
                        className="rounded border-border"
                        aria-label={`${h.sku} auswählen`}
                      />
                    </td>
                    <td className="font-medium text-foreground">{h.sku}</td>
                    <td><Badge variant="default">{h.cause}</Badge></td>
                    <td>{h.abbruch}</td>
                    <td>{h.retouren}</td>
                    <td>{h.marge}</td>
                    <td className="text-muted-foreground text-xs">{h.note}</td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDetailsId(h.sku);
                          setToast('Vorgemerkt');
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detail && hotspotData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="font-semibold text-foreground mb-2">{detail.sku}</div>
            <div className="text-xs text-muted-foreground mb-3">Timeline: letzte 7 Events</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="warning">Ursache: {detail.cause}</Badge>
              <Badge variant="default">Automatik-Analyse</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => setToast('Vorgemerkt')}>
                Empfehlung übernehmen
              </Button>
              <Button variant="ghost" size="sm">Später</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

const CauseBarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <AlertTriangle className="empty-state-icon" />
        <div className="empty-state-title">Keine Daten verfügbar</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-40 text-sm text-muted-foreground truncate">{d.label}</div>
          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <div className="w-10 text-right text-sm font-medium text-foreground">{d.value}</div>
        </div>
      ))}
    </div>
  );
};

export default ForensicsPage;
