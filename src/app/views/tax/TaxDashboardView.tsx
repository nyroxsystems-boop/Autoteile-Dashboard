// Tax Dashboard View - Main tax management interface
// Shows current period, tax profile, and quick actions

import { useState, useEffect } from 'react';
import {
    getTaxProfile,
    calculatePeriod,
    listTaxPeriods,
    type TaxProfile,
    type PeriodCalculation,
    type TaxPeriod
} from '../../services/taxService';

export default function TaxDashboardView() {
    const [profile, setProfile] = useState<TaxProfile | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState<PeriodCalculation | null>(null);
    const [periods, setPeriods] = useState<TaxPeriod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [profileData, periodsData] = await Promise.all([
                getTaxProfile(),
                listTaxPeriods(6)
            ]);

            setProfile(profileData);
            setPeriods(periodsData);

            // Calculate current period
            if (profileData) {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth(); // 0-indexed

                const periodStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const periodEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

                const calculation = await calculatePeriod(periodStart, periodEnd);
                setCurrentPeriod(calculation);
            }
        } catch (error) {
            console.error('Failed to load tax data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Steuer laden...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                        Steuer-Profil nicht konfiguriert
                    </h2>
                    <p className="text-yellow-700 mb-4">
                        Bitte konfigurieren Sie zuerst Ihr Steuer-Profil, um die Steuerfunktionen zu nutzen.
                    </p>
                    <button
                        onClick={() => window.location.hash = '#/bot/tax/profile/create'}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                        Profil erstellen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Steuer-Dashboard</h1>
                <button
                    onClick={() => window.location.hash = '#/tax/invoices'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Rechnungen verwalten
                </button>
            </div>

            {/* Current Period Card */}
            {currentPeriod && (
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Aktueller Zeitraum</h2>
                            <p className="text-sm text-gray-600">
                                {formatDate(currentPeriod.period_start)} - {formatDate(currentPeriod.period_end)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Zahllast</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(currentPeriod.tax_due)}
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const tenantId = localStorage.getItem('selectedTenantId');
                                        const token = localStorage.getItem('token');
                                        const [year, month] = currentPeriod.period_start.split('-');
                                        const url = `https://autoteile-bot-service-production.up.railway.app/api/tax/export/${year}/${month}`;

                                        const response = await fetch(url, {
                                            headers: {
                                                'X-Tenant-ID': tenantId || '',
                                                'Authorization': `Token ${token}`
                                            }
                                        });

                                        if (!response.ok) throw new Error('Export failed');

                                        const blob = await response.blob();
                                        const downloadUrl = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = downloadUrl;
                                        a.download = `Steuer-${year}-${month}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(downloadUrl);
                                    } catch (error) {
                                        console.error('Export failed:', error);
                                        alert('Export fehlgeschlagen');
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="text-xs text-gray-600 mb-1">USt. 19%</div>
                            <div className="text-lg font-semibold">{formatCurrency(currentPeriod.totals.standard_19.vat)}</div>
                            <div className="text-xs text-gray-500">Netto: {formatCurrency(currentPeriod.totals.standard_19.net)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="text-xs text-gray-600 mb-1">USt. 7%</div>
                            <div className="text-lg font-semibold">{formatCurrency(currentPeriod.totals.reduced_7.vat)}</div>
                            <div className="text-xs text-gray-500">Netto: {formatCurrency(currentPeriod.totals.reduced_7.net)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="text-xs text-gray-600 mb-1">Steuerfrei</div>
                            <div className="text-lg font-semibold">{formatCurrency(currentPeriod.totals.zero_rated.vat)}</div>
                            <div className="text-xs text-gray-500">Netto: {formatCurrency(currentPeriod.totals.zero_rated.net)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="text-xs text-gray-600 mb-1">Rechnungen</div>
                            <div className="text-lg font-semibold">{currentPeriod.invoices.length}</div>
                            <div className="text-xs text-gray-500">Bezahlt</div>
                        </div>
                    </div>

                    {/* Invoice List */}
                    {currentPeriod.invoices.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rechnungen in diesem Zeitraum</h3>
                            <div className="space-y-2">
                                {currentPeriod.invoices.map((inv: any) => (
                                    <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                                        <div>
                                            <div className="font-medium">{inv.invoice_number}</div>
                                            <div className="text-xs text-gray-600">{inv.customer_name || '—'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{formatCurrency(inv.gross_amount)}</div>
                                            <div className="text-xs text-gray-600">{inv.tax_rate}% MwSt</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tax Profile Info */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Steuer-Profil</h2>
                    <button
                        onClick={() => window.location.hash = '#/bot/tax/profile/create'}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Bearbeiten
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <div className="text-sm text-gray-600">Unternehmensform</div>
                        <div className="font-medium">
                            {profile.business_type === 'company' ? 'GmbH/UG' : 'Einzelunternehmen'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Methode</div>
                        <div className="font-medium">
                            {profile.tax_method === 'IST' ? 'Ist-Versteuerung' : 'Soll-Versteuerung'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Zeitraum</div>
                        <div className="font-medium">
                            {profile.period_type === 'monthly' ? 'Monatlich' : 'Quartalsweise'}
                        </div>
                    </div>
                    {profile.tax_number && (
                        <div>
                            <div className="text-sm text-gray-600">Steuernummer</div>
                            <div className="font-medium">{profile.tax_number}</div>
                        </div>
                    )}
                    {profile.vat_id && (
                        <div>
                            <div className="text-sm text-gray-600">USt-IdNr.</div>
                            <div className="font-medium">{profile.vat_id}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-sm text-gray-600">Kleinunternehmer</div>
                        <div className="font-medium">{profile.small_business ? 'Ja (§19 UStG)' : 'Nein'}</div>
                    </div>
                </div>
            </div>

            {/* Recent Periods */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vergangene Zeiträume</h2>
                {periods.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                        Keine Zeiträume vorhanden
                    </div>
                ) : (
                    <div className="space-y-2">
                        {periods.map((period) => (
                            <div
                                key={period.id}
                                className="flex justify-between items-center p-4 border rounded hover:bg-gray-50"
                            >
                                <div>
                                    <div className="font-medium">
                                        {formatDate(period.period_start)} - {formatDate(period.period_end)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Status: <span className="capitalize">{period.status}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(period.tax_due)}</div>
                                    <div className="text-sm text-gray-600">Zahllast</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Hinweis</h3>
                        <div className="mt-1 text-sm text-blue-700">
                            Diese Software stellt eine technische Aufbereitung steuerlicher Daten bereit.
                            Die steuerliche Verantwortung verbleibt beim Nutzer.
                            Diese Software ersetzt keine professionelle Steuerberatung.
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
