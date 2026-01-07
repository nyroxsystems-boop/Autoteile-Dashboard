// Tax Profile Creation/Edit Modal
// Comprehensive form for tax settings and company details

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateTaxProfile, type TaxProfile, type BusinessType, type TaxMethod, type PeriodType } from '../../services/taxService';
import { toast } from 'sonner';

interface TaxProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingProfile?: TaxProfile | null;
    onSuccess: () => void;
}

export default function TaxProfileModal({ isOpen, onClose, existingProfile, onSuccess }: TaxProfileModalProps) {
    const [formData, setFormData] = useState({
        business_type: 'company' as BusinessType,
        tax_method: 'IST' as TaxMethod,
        period_type: 'quarterly' as PeriodType,
        tax_number: '',
        vat_id: '',
        small_business: false,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingProfile) {
            setFormData({
                business_type: existingProfile.business_type,
                tax_method: existingProfile.tax_method,
                period_type: existingProfile.period_type,
                tax_number: existingProfile.tax_number || '',
                vat_id: existingProfile.vat_id || '',
                small_business: existingProfile.small_business,
            });
        }
    }, [existingProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            await updateTaxProfile(formData);
            toast.success('Steuer-Profil erfolgreich gespeichert');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save tax profile:', error);
            toast.error('Fehler beim Speichern: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {existingProfile ? 'Steuer-Profil bearbeiten' : 'Steuer-Profil erstellen'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Business Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unternehmensform *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, business_type: 'sole_trader' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.business_type === 'sole_trader'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Einzelunternehmen</div>
                                <div className="text-xs text-gray-600">Freiberufler, Kleingewerbe</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, business_type: 'company' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.business_type === 'company'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Kapitalgesellschaft</div>
                                <div className="text-xs text-gray-600">GmbH, UG, AG</div>
                            </button>
                        </div>
                    </div>

                    {/* Tax Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Versteuerungsmethode *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, tax_method: 'IST' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.tax_method === 'IST'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Ist-Versteuerung</div>
                                <div className="text-xs text-gray-600">Bei Zahlungseingang</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, tax_method: 'SOLL' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.tax_method === 'SOLL'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Soll-Versteuerung</div>
                                <div className="text-xs text-gray-600">Bei Rechnungsstellung</div>
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            IST: USt wird erst bei Zahlungseingang fällig (nur bis 800.000€ Jahresumsatz)<br />
                            SOLL: USt ist mit Rechnungsstellung fällig (Standard)
                        </p>
                    </div>

                    {/* Period Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Voranmeldungszeitraum *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, period_type: 'monthly' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.period_type === 'monthly'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Monatlich</div>
                                <div className="text-xs text-gray-600">12x pro Jahr</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, period_type: 'quarterly' })}
                                className={`px-4 py-3 border rounded-lg text-left transition ${formData.period_type === 'quarterly'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-medium">Quartalsweise</div>
                                <div className="text-xs text-gray-600">4x pro Jahr</div>
                            </button>
                        </div>
                    </div>

                    {/* Tax Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Steuernummer
                            </label>
                            <input
                                type="text"
                                value={formData.tax_number}
                                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                                placeholder="z.B. 12/345/67890"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Ihre Steuernummer vom Finanzamt
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                USt-IdNr.
                            </label>
                            <input
                                type="text"
                                value={formData.vat_id}
                                onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                                placeholder="z.B. DE123456789"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Umsatzsteuer-Identifikationsnummer (optional)
                            </p>
                        </div>
                    </div>

                    {/* Small Business Checkbox */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <label className="flex items-start cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.small_business}
                                onChange={(e) => setFormData({ ...formData, small_business: e.target.checked })}
                                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-yellow-900">Kleinunternehmerregelung (§19 UStG)</div>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Bei Kleinunternehmern wird keine Umsatzsteuer ausgewiesen.
                                    Voraussetzung: Umsatz im Vorjahr &lt; 22.000€ und im laufenden Jahr &lt; 50.000€
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">Wichtiger Hinweis</p>
                                <p>
                                    Diese Einstellungen beeinflussen die Berechnung Ihrer Umsatzsteuer-Voranmeldung.
                                    Bei Unsicherheit konsultieren Sie bitte Ihren Steuerberater.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Wird gespeichert...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
