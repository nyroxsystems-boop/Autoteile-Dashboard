import { useState, useEffect } from 'react';
import { Search, Plus, Building2, CheckCircle2, XCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { wawiService } from '../../services/wawiService';
import type { Supplier } from '../../services/wawiService';
import { Button } from '../../components/ui/button';
import { ErrorState } from '../../components/ErrorState';
import { SupplierModal } from '../../components/SupplierModal';
import { toast } from 'sonner';
import { useI18n } from '../../../i18n';

export function SupplierListView() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await wawiService.getSuppliers();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async (formData: Parameters<typeof wawiService.createSupplier>[0]) => {
        try {
            await wawiService.createSupplier(formData);
            toast.success('Lieferant erfolgreich erstellt');
            loadSuppliers();
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Create failed:', err);
            toast.error('Fehler beim Erstellen des Lieferanten');
        }
    };

    const handleUpdateSupplier = async (formData: Parameters<typeof wawiService.updateSupplier>[1]) => {
        if (!editingSupplier) return;
        try {
            await wawiService.updateSupplier(editingSupplier.id, formData);
            toast.success('Lieferant erfolgreich aktualisiert');
            loadSuppliers();
            setEditingSupplier(null);
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Fehler beim Aktualisieren des Lieferanten');
        }
    };

    const handleDeleteSupplier = async (id: number | string) => {
        if (!confirm('Möchten Sie diesen Lieferanten wirklich löschen?')) return;
        try {
            await wawiService.deleteSupplier(id);
            toast.success('Lieferant erfolgreich gelöscht');
            loadSuppliers();
            setOpenMenuId(null);
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Fehler beim Löschen des Lieferanten');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    );

    if (error && !loading) return <ErrorState onRetry={loadSuppliers} />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('wawi_supplier_list')}</h1>
                    <p className="text-muted-foreground mt-1">
                        Verwalte deine Lieferanten und Lieferbedingungen.
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-white rounded-xl font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Lieferant
                </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Suchen nach Name, Kontakt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                <th className="px-6 py-4">Lieferant</th>
                                <th className="px-6 py-4">Kontaktperson</th>
                                <th className="px-6 py-4">Kontakt</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aktion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        Lade Lieferanten...
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Keine Lieferanten gefunden.
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <Building2 className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{supplier.name}</div>
                                                    {supplier.website && (
                                                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                                            {supplier.website}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm">{supplier.contact_person || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {supplier.email && (
                                                    <div className="text-xs text-muted-foreground">{supplier.email}</div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="text-xs text-muted-foreground">{supplier.phone}</div>
                                                )}
                                                {!supplier.email && !supplier.phone && <span className="text-sm">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {supplier.status === 'active' || supplier.active ? (
                                                <div className="flex items-center gap-2 text-green-500">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Aktiv</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Inaktiv</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setOpenMenuId(openMenuId === supplier.id ? null : supplier.id)}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                                {openMenuId === supplier.id && (
                                                    <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSupplier(supplier);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-sm text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Bearbeiten
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSupplier(supplier.id)}
                                                            className="w-full px-4 py-2 text-sm text-left hover:bg-muted/50 flex items-center gap-2 text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Löschen
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <SupplierModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSupplier}
                title="Neuer Lieferant"
            />

            {/* Edit Modal */}
            {editingSupplier && (
                <SupplierModal
                    isOpen={true}
                    onClose={() => setEditingSupplier(null)}
                    onSubmit={handleUpdateSupplier}
                    initialData={editingSupplier}
                    title="Lieferant bearbeiten"
                />
            )}
        </div>
    );
}
