// Invoice Creation Modal
// Create new customer invoices manually or from orders

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createInvoice, type InvoiceLine, type TaxRate } from '../../services/taxService';
import { toast } from 'sonner';

interface InvoiceCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    prefilledData?: {
        customerName?: string;
        lines?: InvoiceLine[];
    };
}

export default function InvoiceCreationModal({ isOpen, onClose, onSuccess, prefilledData }: InvoiceCreationModalProps) {
    const getInitialFormData = () => ({
        customer_name: prefilledData?.customerName || '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        billing_country: 'DE',
        notes: '',
    });

    const getInitialLines = (): InvoiceLine[] => prefilledData?.lines || [
        { description: '', quantity: 1, unit_price: 0, tax_rate: 19 as TaxRate }
    ];

    const [formData, setFormData] = useState(getInitialFormData());
    const [lines, setLines] = useState<InvoiceLine[]>(getInitialLines());
    const [loading, setLoading] = useState(false);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setLines(getInitialLines());
            setLoading(false);
        }
    }, [isOpen]);

    const addLine = () => {
        setLines([...lines, { description: '', quantity: 1, unit_price: 0, tax_rate: 19 as TaxRate }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const calculateTotals = () => {
        let netTotal = 0;
        let vatTotal = 0;

        lines.forEach(line => {
            const lineNet = line.quantity * line.unit_price;
            const lineVat = lineNet * (line.tax_rate / 100);
            netTotal += lineNet;
            vatTotal += lineVat;
        });

        return {
            net: netTotal,
            vat: vatTotal,
            gross: netTotal + vatTotal
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.customer_name.trim()) {
            toast.error('Bitte Kundenname eingeben');
            return;
        }

        if (lines.length === 0 || lines.some(l => !l.description.trim())) {
            toast.error('Bitte mindestens eine Position mit Beschreibung hinzufügen');
            return;
        }

        // Validate line items
        const hasInvalidPrices = lines.some(l => l.unit_price < 0);
        if (hasInvalidPrices) {
            toast.error('Preise dürfen nicht negativ sein');
            return;
        }

        const hasInvalidQuantities = lines.some(l => l.quantity <= 0);
        if (hasInvalidQuantities) {
            toast.error('Mengen müssen größer als 0 sein');
            return;
        }

        try {
            setLoading(true);
            await createInvoice({
                ...formData,
                lines: lines.map(l => ({
                    description: l.description,
                    quantity: l.quantity,
                    unit_price: l.unit_price,
                    tax_rate: l.tax_rate
                }))
            });
            toast.success('Rechnung erfolgreich erstellt');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create invoice:', error);

            // Provide specific error messages
            let errorMessage = 'Fehler beim Erstellen der Rechnung';

            if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = 'Netzwerkfehler. Bitte Verbindung prüfen.';
            } else if (error.message?.includes('401') || error.message?.includes('403')) {
                errorMessage = 'Keine Berechtigung. Bitte neu anmelden.';
            } else if (error.message?.includes('duplicate') || error.message?.includes('bereits')) {
                errorMessage = 'Rechnung existiert bereits für diesen Auftrag';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Neue Rechnung erstellen</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kundenname *
                            </label>
                            <input
                                type="text"
                                value={formData.customer_name}
                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                placeholder="Max Mustermann / Firma GmbH"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Land
                            </label>
                            <select
                                value={formData.billing_country}
                                onChange={(e) => setFormData({ ...formData, billing_country: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="DE">Deutschland</option>
                                <option value="AT">Österreich</option>
                                <option value="CH">Schweiz</option>
                                <option value="FR">Frankreich</option>
                                <option value="NL">Niederlande</option>
                                <option value="BE">Belgien</option>
                                <option value="PL">Polen</option>
                                <option value="CZ">Tschechien</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rechnungsdatum *
                            </label>
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fälligkeitsdatum
                            </label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Positionen *
                            </label>
                            <button
                                type="button"
                                onClick={addLine}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Position hinzufügen
                            </button>
                        </div>

                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-xs font-medium text-gray-600">
                            <div className="col-span-5">Beschreibung</div>
                            <div className="col-span-2">Menge</div>
                            <div className="col-span-2">Preis (€)</div>
                            <div className="col-span-2">MwSt.</div>
                            <div className="col-span-1 text-right">Summe</div>
                        </div>

                        <div className="space-y-3">
                            {lines.map((line, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 grid grid-cols-12 gap-2">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                value={line.description}
                                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                placeholder="Beschreibung"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                placeholder="Menge"
                                                min="0"
                                                step="0.01"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={line.unit_price}
                                                onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                placeholder="Preis"
                                                min="0"
                                                step="0.01"
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                value={line.tax_rate}
                                                onChange={(e) => updateLine(index, 'tax_rate', parseInt(e.target.value) as TaxRate)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="19">19%</option>
                                                <option value="7">7%</option>
                                                <option value="0">0%</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-end text-sm font-medium text-gray-700">
                                            {(line.quantity * line.unit_price).toFixed(2)}€
                                        </div>
                                    </div>
                                    {lines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            className="text-red-600 hover:text-red-700 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600">Nettobetrag</div>
                                <div className="text-lg font-semibold text-gray-900">{totals.net.toFixed(2)} €</div>
                            </div>
                            <div>
                                <div className="text-gray-600">MwSt.</div>
                                <div className="text-lg font-semibold text-gray-900">{totals.vat.toFixed(2)} €</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Gesamtbetrag</div>
                                <div className="text-xl font-bold text-blue-600">{totals.gross.toFixed(2)} €</div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notizen (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Zusätzliche Hinweise zur Rechnung..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Wird erstellt...' : 'Rechnung erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
