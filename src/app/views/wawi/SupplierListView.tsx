import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Building2, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { wawiService, Supplier } from '../../services/wawiService';
import { toast } from 'sonner';

export function SupplierListView() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getSuppliers();
            setSuppliers(data);
        } catch (err) {
            console.error('Failed to load suppliers', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async (formData: any) => {
        try {
            await wawiService.createSupplier(formData);
            toast.success('Lieferant erstellt');
            loadSuppliers();
            setIsCreateModalOpen(false);
        } catch (err) {
            toast.error('Fehler beim Erstellen');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lieferanten</h1>
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
                                                    <div className="font-bold text-sm">{supplier.name}</div>
                                                    {supplier.address && (
                                                        <div className="text-xs text-muted-foreground">{supplier.address}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm">{supplier.contact_person || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {supplier.email && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{supplier.email}</span>
                                                    </div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{supplier.phone}</span>
                                                    </div>
                                                )}
                                                {!supplier.email && !supplier.phone && <span className="text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {supplier.status === 'active' ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Create Modal would go here - simplified for now */}
        </div>
    );
}
