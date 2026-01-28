// Invoice List View - Invoice management interface
// CRUD operations for invoices with filtering

import { useState, useEffect } from 'react';
import {
    listInvoices,
    markInvoiceAsPaid,
    cancelInvoice,
    type Invoice,
    type InvoiceStatus
} from '../../services/taxService';
import InvoiceCreationModal from '../../components/tax/InvoiceCreationModal';

export default function InvoiceListView() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const data = await listInvoices({
                status: filter === 'all' ? undefined : filter,
                limit: 50
            });
            setInvoices(data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!confirm('Rechnung als bezahlt markieren?')) return;

        try {
            await markInvoiceAsPaid(id);
            await loadInvoices();
        } catch (error) {
            console.error('Failed to mark as paid:', error);
            alert('Fehler beim Markieren als bezahlt');
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Rechnung stornieren?')) return;

        try {
            await cancelInvoice(id);
            await loadInvoices();
        } catch (error) {
            console.error('Failed to cancel invoice:', error);
            alert('Fehler beim Stornieren');
        }
    };

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE');
    };

    const getStatusBadge = (status: InvoiceStatus) => {
        const styles: Record<InvoiceStatus, string> = {
            draft: 'bg-gray-100 text-gray-800',
            issued: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            canceled: 'bg-red-100 text-red-800'
        };

        const labels: Record<InvoiceStatus, string> = {
            draft: 'Entwurf',
            issued: 'Ausgestellt',
            paid: 'Bezahlt',
            canceled: 'Storniert'
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Neue Rechnung
                </button>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-2">
                {(['all', 'draft', 'issued', 'paid', 'canceled'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded text-sm ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'all' && 'Alle'}
                        {status === 'draft' && 'Entwürfe'}
                        {status === 'issued' && 'Ausgestellt'}
                        {status === 'paid' && 'Bezahlt'}
                        {status === 'canceled' && 'Storniert'}
                    </button>
                ))}
            </div>

            {/* Invoice List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Rechnungen laden...</div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">Keine Rechnungen gefunden</div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Erste Rechnung erstellen
                    </button>
                </div>
            ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rechnungsnummer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Kunde
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Datum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Betrag
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Aktionen
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-gray-900">{invoice.customer_name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {formatDate(invoice.issue_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium">{formatCurrency(invoice.gross_amount)}</div>
                                        <div className="text-xs text-gray-500">
                                            Netto: {formatCurrency(invoice.net_amount)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {invoice.status === 'draft' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(invoice.id)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Bezahlt
                                            </button>
                                        )}
                                        {invoice.status === 'issued' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(invoice.id)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Bezahlt
                                            </button>
                                        )}
                                        {invoice.status !== 'canceled' && (
                                            <button
                                                onClick={() => handleCancel(invoice.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Stornieren
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoice Creation Modal */}
            <InvoiceCreationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadInvoices}
            />
        </div>
    );
}
