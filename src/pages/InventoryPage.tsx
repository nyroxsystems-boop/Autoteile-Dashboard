import { useEffect, useState, useMemo } from 'react';
import { Package, Search, Plus, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import { Product, ProductService } from '../services/productService';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import { useNavigate } from 'react-router-dom';

const InventoryPage = () => {
  const { timeframe } = useTimeframe();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'alle' | 'risiko' | 'slow'>('alle');

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ProductService.listProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (action: 'add' | 'remove', quantity: number) => {
    if (!selectedProduct) return;
    try {
      await ProductService.adjustStock(selectedProduct.pk, action, quantity);
      await loadData();
    } catch (err) {
      alert('Fehler beim Buchen der Lagerbewegung.');
      console.error(err);
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return products
      .filter((i) =>
        (i.name + (i.IPN || '')).toLowerCase().includes(search.trim().toLowerCase())
      )
      .filter((i) => {
        if (filter === 'risiko') return (i.stock || 0) === 0;
        return true;
      });
  }, [products, search, filter]);

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const estimatedValue = products.reduce((acc, p) => acc + ((p.stock || 0) * 45), 0);
  const criticalCount = products.filter(p => (p.stock || 0) <= 2).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Lagerübersicht"
        subtitle={`Bestände & Bewegungen (Live) · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadData}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate('/products/new')}>
              Neuer Artikel
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-label">Gesamtbestand</div>
          <div className="stat-card-value">
            {totalStock.toLocaleString()}
            <span className="stat-card-unit">Stk</span>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-card-label">Bestandswert (Est.)</div>
          <div className="stat-card-value">
            € {estimatedValue.toLocaleString()}
          </div>
        </div>
        <div className="stat-card stat-card-danger">
          <div className="stat-card-label">Kritischer Bestand</div>
          <div className="stat-card-value">
            {criticalCount}
            <span className="stat-card-unit">Artikel</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach OE-Nr, Hersteller, Artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-0 shadow-none bg-transparent"
          />
        </div>
        <div className="w-px bg-border" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-transparent border-0 text-sm font-medium text-foreground outline-none cursor-pointer pr-4"
        >
          <option value="alle">Alle Artikel</option>
          <option value="risiko">Bestandskritisch</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="table-premium">
          <thead>
            <tr>
              <th>Artikel / Hersteller</th>
              <th>OE-Nummer / IPN</th>
              <th>Lagerort</th>
              <th className="text-right">Bestand</th>
              <th className="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-title">Lade Inventar...</div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <div className="empty-state-title">Keine Artikel gefunden</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((row) => (
              <tr key={row.pk}>
                <td>
                  <div className="font-medium text-foreground mb-1">{row.name}</div>
                  {row.manufacturer && (
                    <Badge variant="default">{row.manufacturer.toUpperCase()}</Badge>
                  )}
                </td>
                <td>
                  <div className="font-mono text-sm text-primary">{row.oe_number || '—'}</div>
                  <div className="text-xs text-muted-foreground mt-1">IPN: {row.IPN || '—'}</div>
                </td>
                <td className="text-muted-foreground">{row.location || '—'}</td>
                <td className="text-right">
                  <span className={`font-semibold ${(row.stock || 0) > 0 ? 'text-foreground' : 'text-red-500'}`}>
                    {row.stock || 0}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openStockModal(row)}>
                      Bestand
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${row.pk}`)}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <StockAdjustmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleStockAdjustment}
          productName={selectedProduct.name}
          currentStock={selectedProduct.stock || 0}
        />
      )}
    </div>
  );
};

export default InventoryPage;
