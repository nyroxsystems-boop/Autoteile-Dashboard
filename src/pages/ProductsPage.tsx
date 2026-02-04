import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductService } from '../services/productService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

export default function ProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProducts();
    }, [search]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await ProductService.listProducts(search);
            setProducts(data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Fehler beim Laden der Artikel. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Artikelverwaltung</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Verwalten Sie Ihren lokalen Artikelstamm und Preise.
                    </p>
                </div>
                <Button icon={<Plus className="w-4 h-4" />}>
                    Neuer Artikel
                </Button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Suchen nach Name, Art-Nr. oder EAN..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Product Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="table-premium">
                    <thead>
                        <tr>
                            <th>Produkt</th>
                            <th>Art-Nr. (IPN)</th>
                            <th>Bestand</th>
                            <th>Status</th>
                            <th className="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <div className="empty-state-title">Lade Artikel...</div>
                                    </div>
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <Package className="empty-state-icon" />
                                        <div className="empty-state-title">Keine Artikel gefunden</div>
                                        <div className="empty-state-description">Erstellen Sie Ihren ersten Artikel</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.pk}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-foreground truncate">{product.name}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-muted-foreground font-mono text-sm">
                                        {product.IPN || '—'}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${(product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-foreground">{product.stock || 0} Stk.</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge variant={product.active ? 'success' : 'default'}>
                                            {product.active ? 'Aktiv' : 'Archiviert'}
                                        </Badge>
                                    </td>
                                    <td className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/products/${product.pk}`)}
                                        >
                                            Bearbeiten
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
