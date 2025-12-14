import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

type DocStatus = 'neu' | 'geprüft' | 'übermittelt' | 'fehler';
type TaxTag = 'ust' | 'keine_ust' | 'reverse';

type DocumentRow = {
  id: string;
  name: string;
  sender: string;
  date: string;
  amount: string;
  tax: TaxTag;
  status: DocStatus;
};

const statusLabel: Record<DocStatus, string> = {
  neu: 'Neu',
  geprüft: 'Geprüft',
  übermittelt: 'Übermittelt',
  fehler: 'Fehler'
};
const statusVariant: Record<DocStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  neu: 'neutral',
  geprüft: 'success',
  übermittelt: 'success',
  fehler: 'danger'
};
const taxLabel: Record<TaxTag, string> = {
  ust: 'USt',
  keine_ust: 'Keine USt',
  reverse: 'Reverse Charge'
};

const mockDocs: DocumentRow[] = [
  { id: 'DOC-10231', name: 'Rechnung DHL Paketzentrum', sender: 'DHL', date: '2024-05-02', amount: '89,30 €', tax: 'ust', status: 'neu' },
  { id: 'DOC-10232', name: 'Meta Ads April', sender: 'Meta Platforms', date: '2024-05-03', amount: '1.240,00 €', tax: 'reverse', status: 'geprüft' },
  { id: 'DOC-10233', name: 'Strom Abschlag', sender: 'Stadtwerke Berlin', date: '2024-05-04', amount: '310,22 €', tax: 'ust', status: 'übermittelt' },
  { id: 'DOC-10234', name: 'Shopify App Gebühren', sender: 'Shopify', date: '2024-05-05', amount: '129,00 €', tax: 'reverse', status: 'neu' },
  { id: 'DOC-10235', name: 'Amazon Lagergebühren', sender: 'Amazon FBA', date: '2024-05-06', amount: '540,70 €', tax: 'ust', status: 'geprüft' },
  { id: 'DOC-10236', name: 'Verpackungen Q2', sender: 'Rajapack', date: '2024-05-06', amount: '420,40 €', tax: 'ust', status: 'fehler' },
  { id: 'DOC-10237', name: 'Zollabfertigung', sender: 'DHL Express', date: '2024-05-07', amount: '220,00 €', tax: 'keine_ust', status: 'neu' },
  { id: 'DOC-10238', name: 'Meta Ads Mai', sender: 'Meta Platforms', date: '2024-05-08', amount: '980,00 €', tax: 'reverse', status: 'neu' },
  { id: 'DOC-10239', name: 'Strom Nachzahlung', sender: 'Stadtwerke Berlin', date: '2024-05-09', amount: '88,10 €', tax: 'ust', status: 'geprüft' },
  { id: 'DOC-10240', name: 'Kartons Nachschub', sender: 'Smurfit Kappa', date: '2024-05-10', amount: '265,90 €', tax: 'ust', status: 'neu' },
  { id: 'DOC-10241', name: 'Werbepartner Fee', sender: 'Influencer Media', date: '2024-05-11', amount: '1.050,00 €', tax: 'reverse', status: 'neu' },
  { id: 'DOC-10242', name: 'Logistik Software', sender: 'Shipcloud', date: '2024-05-12', amount: '149,00 €', tax: 'ust', status: 'übermittelt' },
  { id: 'DOC-10243', name: 'B2B Teile Einkauf', sender: 'Händler XY', date: '2024-05-12', amount: '2.310,00 €', tax: 'keine_ust', status: 'neu' },
  { id: 'DOC-10244', name: 'Entsorgung/Recycling', sender: 'Grüne Tonne', date: '2024-05-13', amount: '74,50 €', tax: 'ust', status: 'geprüft' }
];

const DocumentsPage = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'alle'>('alle');
  const [taxFilter, setTaxFilter] = useState<TaxTag | 'alle'>('alle');
  const [destination, setDestination] = useState('Finanzamt');
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockDocs.filter((d) => {
      const term = search.toLowerCase();
      if (term && !(`${d.id} ${d.name} ${d.sender} ${d.amount}`.toLowerCase().includes(term))) return false;
      if (statusFilter !== 'alle' && d.status !== statusFilter) return false;
      if (taxFilter !== 'alle' && d.tax !== taxFilter) return false;
      return true;
    });
  }, [search, statusFilter, taxFilter]);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((d) => d.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkBarVisible = selectedIds.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Belege & Rechnungen"
        subtitle="Zentrale Ablage für eingehende Dokumente"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm">Dokument hochladen</Button>
            <Button variant="ghost" size="sm">Export</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Suchen (Rechnungsnummer, Absender, Betrag)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 280, flex: 1 }}
          />
          <select
            aria-label="Zeitraum"
            className="topbar-select"
            style={{ minWidth: 140 }}
          >
            <option>Letzte 7 Tage</option>
            <option>Letzte 30 Tage</option>
            <option>Dieses Jahr</option>
            <option>Vergangenes Jahr</option>
          </select>
          <select
            aria-label="Status"
            className="topbar-select"
            style={{ minWidth: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="alle">Status (alle)</option>
            <option value="neu">Neu</option>
            <option value="geprüft">Geprüft</option>
            <option value="übermittelt">Übermittelt</option>
            <option value="fehler">Fehler</option>
          </select>
          <select
            aria-label="Steuer"
            className="topbar-select"
            style={{ minWidth: 140 }}
            value={taxFilter}
            onChange={(e) => setTaxFilter(e.target.value as any)}
          >
            <option value="alle">Steuer (alle)</option>
            <option value="ust">USt</option>
            <option value="keine_ust">Keine USt</option>
            <option value="reverse">Reverse Charge</option>
          </select>
        </div>
      </Card>

      <Card>
        {bulkBarVisible ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', gap: 8 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selectedIds.length} ausgewählt</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary">Herunterladen</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Auswahl aufheben</Button>
            </div>
          </div>
        ) : null}

        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Alle auswählen" /></th>
                <th>Dokument</th>
                <th>Absender</th>
                <th>Datum</th>
                <th>Betrag</th>
                <th>Steuer</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      aria-label={`${doc.name} auswählen`}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{doc.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{doc.id}</div>
                    </div>
                  </td>
                  <td>{doc.sender}</td>
                  <td>{new Date(doc.date).toLocaleDateString()}</td>
                  <td>{doc.amount}</td>
                  <td>
                    <Badge variant="neutral">{taxLabel[doc.tax]}</Badge>
                  </td>
                  <td>
                    <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm">Ansehen</Button>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, color: 'var(--muted)' }}>Keine Dokumente gefunden.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Absendung / Behörden-Übermittlung" subtitle="Dokumente an Behörden oder Steuerberater senden. (UI-Demo)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Ziel wählen</div>
            <select
              className="topbar-select"
              aria-label="Ziel"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option>Finanzamt</option>
              <option>Steuerberater</option>
              <option>ELSTER</option>
              <option>Sonstige Behörde</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Ausgewählte Dokumente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" /> Zeitraum bündeln
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Metadaten mitsenden (Absender, Betrag, Datum)
              </label>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              Hinweis: UI / Demo – keine echte Übertragung.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                setSendStatus(`Übermittlung vorbereitet (Demo) → ${destination}`);
              }}
            >
              Jetzt übermitteln
            </Button>
            {sendStatus ? <div style={{ color: 'var(--muted)' }}>{sendStatus}</div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentsPage;
