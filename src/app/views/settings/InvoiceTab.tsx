import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { useBillingSettings } from '../../hooks/useBillingSettings';
import { toast } from 'sonner';

export function InvoiceTab() {
    const { settings: billingSettings, update: updateBillingSettings } = useBillingSettings();

    const [invoiceTemplate, setInvoiceTemplate] = useState('clean');
    const [invoiceColor, setInvoiceColor] = useState('#2563eb');
    const [invoiceFont, setInvoiceFont] = useState('inter');
    const [invoiceLogoPosition, setInvoiceLogoPosition] = useState('left');
    const [invoiceNumberPosition, setInvoiceNumberPosition] = useState('right');
    const [invoiceAddressLayout, setInvoiceAddressLayout] = useState('two-column');
    const [invoiceTableStyle, setInvoiceTableStyle] = useState('grid');
    const [invoiceAccentColor, setInvoiceAccentColor] = useState('#f3f4f6');
    const [logoBase64, setLogoBase64] = useState<string | null>(null);

    useEffect(() => {
        if (billingSettings) {
            setInvoiceTemplate(billingSettings.invoice_template || 'clean');
            setInvoiceColor(billingSettings.invoice_color || '#2563eb');
            setInvoiceFont(billingSettings.invoice_font || 'inter');
            setInvoiceLogoPosition(billingSettings.logo_position || 'left');
            setInvoiceNumberPosition(billingSettings.number_position || 'right');
            setInvoiceAddressLayout(billingSettings.address_layout || 'two-column');
            setInvoiceTableStyle(billingSettings.table_style || 'grid');
            setInvoiceAccentColor(billingSettings.accent_color || '#f3f4f6');
            setLogoBase64(billingSettings.logo_base64 || null);
        }
    }, [billingSettings]);

    const handleSave = async () => {
        await updateBillingSettings({
            invoice_template: invoiceTemplate, invoice_color: invoiceColor, invoice_font: invoiceFont,
            logo_position: invoiceLogoPosition, number_position: invoiceNumberPosition, address_layout: invoiceAddressLayout,
            table_style: invoiceTableStyle, accent_color: invoiceAccentColor, logo_base64: logoBase64 || undefined,
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Nur Bilddateien erlaubt (PNG, JPG, SVG)'); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error('Datei zu groß. Max. 2MB erlaubt.'); return; }
        const reader = new FileReader();
        reader.onload = () => { setLogoBase64(reader.result as string); toast.success('Logo hochgeladen'); };
        reader.onerror = () => { toast.error('Fehler beim Lesen der Datei'); };
        reader.readAsDataURL(file);
    };

    const fontFamily = invoiceFont === 'inter' ? 'Inter' : invoiceFont === 'helvetica' ? 'Helvetica' : invoiceFont === 'times' ? 'Times New Roman' : invoiceFont === 'roboto' ? 'Roboto' : 'Arial';

    const OptionButtons = ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
            {options.map((o) => (
                <button key={o.value} onClick={() => onChange(o.value)}
                    className={`p-2.5 rounded-full border-2 transition-all text-center ${value === o.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border-strong'}`}>
                    <div className="text-xs font-medium text-foreground capitalize">{o.label}</div>
                </button>
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-5 gap-6">
            {/* Left: Controls */}
            <div className="col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-foreground font-medium mb-4">Rechnungsdesign</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-3">Vorlage</label>
                        <OptionButtons options={[{ value: 'clean', label: 'Clean' }, { value: 'classic', label: 'Classic' }, { value: 'modern', label: 'Modern' }]} value={invoiceTemplate} onChange={setInvoiceTemplate} />
                    </div>

                    {/* Logo Upload */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-3">Logo</label>
                        {logoBase64 ? (
                            <div className="space-y-3">
                                <div className="border-2 border-border rounded-lg p-4 bg-background">
                                    <img src={logoBase64} alt="Logo Preview" className="max-h-32 mx-auto object-contain" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => document.getElementById('logo-upload')?.click()}
                                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-full text-xs font-medium text-foreground hover:bg-accent hover:border-border-strong transition-all">Logo ändern</button>
                                    <button type="button" onClick={() => { setLogoBase64(null); toast.info('Logo entfernt'); }}
                                        className="px-4 py-1.5 bg-background border border-red-200 rounded-full text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all">Entfernen</button>
                                </div>
                            </div>
                        ) : (
                            <label htmlFor="logo-upload" className="block border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <div className="text-sm text-foreground font-medium">Logo hochladen</div>
                                <div className="text-xs text-muted-foreground mt-1">PNG, JPG oder SVG • Max. 2MB</div>
                            </label>
                        )}
                        <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-3">Logo Position</label>
                        <OptionButtons options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} value={invoiceLogoPosition} onChange={setInvoiceLogoPosition} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-3">Primärfarbe</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={invoiceColor} onChange={(e) => setInvoiceColor(e.target.value)} className="w-12 h-12 rounded-lg border border-border cursor-pointer" />
                            <input type="text" value={invoiceColor} onChange={(e) => setInvoiceColor(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Schriftart</label>
                        <CustomSelect value={invoiceFont} onChange={setInvoiceFont} options={[
                            { value: 'inter', label: 'Inter (Modern)' }, { value: 'helvetica', label: 'Helvetica (Classic)' },
                            { value: 'times', label: 'Times New Roman (Formal)' }, { value: 'roboto', label: 'Roboto (Clean)' }, { value: 'arial', label: 'Arial (Universal)' },
                        ]} />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="text-foreground font-medium mb-4">Layout-Optionen</h3>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Rechnungsnummer Position</label>
                        <OptionButtons options={[{ value: 'right', label: 'Rechts oben' }, { value: 'left', label: 'Links oben' }]} value={invoiceNumberPosition} onChange={setInvoiceNumberPosition} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Adress-Layout</label>
                        <OptionButtons options={[{ value: 'two-column', label: 'Zweispaltig' }, { value: 'stacked', label: 'Gestapelt' }]} value={invoiceAddressLayout} onChange={setInvoiceAddressLayout} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Tabellen-Stil</label>
                        <OptionButtons options={[{ value: 'minimal', label: 'Minimal' }, { value: 'grid', label: 'Grid' }, { value: 'gestreift', label: 'Gestreift' }]} value={invoiceTableStyle} onChange={setInvoiceTableStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Akzentfarbe (Hintergrund)</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={invoiceAccentColor} onChange={(e) => setInvoiceAccentColor(e.target.value)} className="w-12 h-12 rounded-lg border border-border cursor-pointer" />
                            <input type="text" value={invoiceAccentColor} onChange={(e) => setInvoiceAccentColor(e.target.value)} className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Design speichern
                </button>
            </div>

            {/* Right: Live Preview */}
            <div className="col-span-3">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-foreground font-medium">Live-Vorschau</h3>
                        <button
                            className="text-sm text-primary hover:underline"
                            onClick={() => {
                                // Print/export the preview as PDF using browser print
                                const printWindow = window.open('', '_blank');
                                if (!printWindow) { toast.info('Pop-up blocked — bitte erlauben Sie Pop-ups'); return; }
                                const previewEl = document.getElementById('invoice-preview');
                                if (!previewEl) return;
                                printWindow.document.write(`<html><head><title>Rechnungsvorschau</title><style>body{margin:2rem;font-family:${fontFamily}}</style></head><body>${previewEl.innerHTML}</body></html>`);
                                printWindow.document.close();
                                printWindow.focus();
                                printWindow.print();
                                printWindow.close();
                            }}
                        >Als PDF exportieren</button>
                    </div>

                    <div id="invoice-preview" className={`bg-white rounded-lg p-8 shadow-sm relative overflow-hidden ${invoiceTemplate === 'classic' ? 'border-2 border-gray-800' : invoiceTemplate === 'modern' ? 'border-0 shadow-lg' : 'border border-border'}`}
                        style={{ fontFamily }}>
                        {invoiceTemplate === 'modern' && <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: invoiceColor }} />}

                        <div className={`mb-8 ${invoiceTemplate === 'modern' ? 'pt-4' : ''}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2 ${invoiceTemplate === 'classic' ? 'border-2 border-gray-800 bg-white' : invoiceTemplate === 'modern' ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gray-200'}`}>Logo</div>
                                    <div className={`text-sm text-gray-900 ${invoiceTemplate === 'classic' ? 'font-bold' : 'font-semibold'}`}>Autoteile Shop GmbH</div>
                                    <div className="text-xs text-gray-600">Musterstraße 123</div>
                                    <div className="text-xs text-gray-600">12345 Berlin</div>
                                </div>
                                <div className="text-right">
                                    <div className={`${invoiceTemplate === 'modern' ? 'text-3xl' : 'text-2xl'} font-bold mb-2`} style={{ color: invoiceColor }}>RECHNUNG</div>
                                    <div className="text-xs text-gray-600">
                                        <div>Rechnungsnr.: <span className="font-medium text-gray-900">RE-2024-001</span></div>
                                        <div>Datum: <span className="font-medium text-gray-900">24.12.2024</span></div>
                                        <div>Fällig: <span className="font-medium text-gray-900">07.01.2025</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {invoiceTemplate === 'classic' && <div className="border-t-2 border-gray-800 mb-6" />}

                        <div className={`mb-8 ${invoiceTemplate === 'modern' ? 'p-4 rounded-lg' : ''}`} style={{ backgroundColor: invoiceTemplate === 'modern' ? invoiceAccentColor : 'transparent' }}>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>Rechnung an</div>
                                    <div className="text-sm text-gray-900 font-medium">Musterfirma GmbH</div>
                                    <div className="text-xs text-gray-600">Beispielstraße 456</div>
                                    <div className="text-xs text-gray-600">54321 Hamburg</div>
                                </div>
                                <div>
                                    <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>Versandadresse</div>
                                    <div className="text-sm text-gray-900 font-medium">Musterfirma GmbH</div>
                                    <div className="text-xs text-gray-600">Beispielstraße 456</div>
                                    <div className="text-xs text-gray-600">54321 Hamburg</div>
                                </div>
                            </div>
                        </div>

                        <table className={`w-full mb-8 ${invoiceTableStyle === 'grid' ? 'border border-gray-200' : invoiceTemplate === 'classic' ? 'border-2 border-gray-800' : ''}`}>
                            <thead>
                                <tr style={{ borderColor: invoiceColor, backgroundColor: invoiceTableStyle === 'grid' ? invoiceAccentColor : invoiceTemplate === 'classic' ? '#1f2937' : 'transparent', color: invoiceTemplate === 'classic' ? 'white' : 'inherit' }}
                                    className={invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'border-b' : 'border-b-2'}>
                                    {['Position', 'Menge', 'Einzelpreis', 'Gesamt'].map((h, i) => (
                                        <th key={h} className={`text-${i === 0 ? 'left' : 'right'} text-xs font-semibold ${invoiceTemplate === 'classic' ? 'text-white' : 'text-gray-700'} ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'pb-2'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[{ item: 'Bremsbeläge vorne', qty: 2, price: '45,00 €', total: '90,00 €' }, { item: 'Ölfilter', qty: 1, price: '12,50 €', total: '12,50 €' }, { item: 'Luftfilter', qty: 1, price: '15,00 €', total: '15,00 €' }].map((row, idx) => (
                                    <tr key={idx} className={`${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'border-b border-gray-200' : invoiceTableStyle === 'minimal' ? 'border-b border-gray-100' : ''} ${invoiceTableStyle === 'striped' && idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                        <td className={`text-sm text-gray-900 ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.item}</td>
                                        <td className={`text-sm text-gray-900 text-right ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.qty}</td>
                                        <td className={`text-sm text-gray-900 text-right ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.price}</td>
                                        <td className={`text-sm text-gray-900 text-right font-medium ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-8">
                            <div className="w-64">
                                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Zwischensumme</span><span className="font-medium text-gray-900">117,50 €</span></div>
                                <div className="flex justify-between text-sm text-gray-600 mb-3"><span>MwSt. (19%)</span><span className="font-medium text-gray-900">22,33 €</span></div>
                                <div className="flex justify-between text-base font-bold pt-3 border-t-2" style={{ borderColor: invoiceColor, color: invoiceColor }}>
                                    <span>Gesamt</span><span>139,83 €</span>
                                </div>
                            </div>
                        </div>

                        <div className={`text-center text-xs pt-6 ${invoiceTemplate === 'classic' ? 'border-t-2 border-gray-800 text-gray-700' : invoiceTemplate === 'modern' ? 'text-gray-600' : 'border-t border-gray-200 text-gray-500'}`}
                            style={{ backgroundColor: invoiceTemplate === 'modern' ? invoiceAccentColor : 'transparent' }}>
                            <div className={invoiceTemplate === 'classic' ? 'font-semibold' : ''}>Autoteile Shop GmbH · Musterstraße 123 · 12345 Berlin</div>
                            <div>Tel: +49 30 123 456 789 · E-Mail: info@autoteile-shop.de · USt-IdNr: DE987654321</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
