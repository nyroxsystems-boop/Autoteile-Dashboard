import { useCallback, useEffect, useState } from 'react';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';
import Button from '../ui/Button';
import { getFriendlyApiErrorMessage } from '../lib/apiErrorMessage';

const OffersPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/dashboard/offers');
      const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      setRows(rows);
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Offers</h1>
      <Card>
        {loading ? <div className="skeleton-block" style={{ width: 120, height: 12 }} /> : null}
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="error-box">{error}</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Erneut laden
            </Button>
          </div>
        ) : null}
        {!loading && !error && rows.length === 0 ? <div style={{ color: 'var(--muted)' }}>Keine Daten</div> : null}
        {rows.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {cols.map((c) => (
                      <td key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default OffersPage;
