import { useState, useEffect } from 'react';
import { Settings, FileText, Building2, Shield, Truck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useBillingSettings } from '../hooks/useBillingSettings';
import SuppliersSettings from '../components/SuppliersSettings';

const SettingsPage = () => {
    const { settings, update, loading } = useBillingSettings();
    const [activeTab, setActiveTab] = useState('invoice');

    // Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        await update(formData);
        alert('Einstellungen gespeichert!');
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Die neuen Passwörter stimmen nicht überein.');
            return;
        }
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://autoteile-bot-service-production.up.railway.app';
            const token = localStorage.getItem('auth_access_token') || localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Passwort erfolgreich geändert!');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(data.error || 'Fehler beim Ändern des Passworts');
            }
        } catch (err) {
            alert('Netzwerkfehler');
        }
    };

    const tabs = [
        { id: 'invoice', label: 'Rechnungsdesign', icon: FileText },
        { id: 'company', label: 'Firmendaten', icon: Building2 },
        { id: 'security', label: 'Sicherheit', icon: Shield },
        { id: 'suppliers', label: 'Lieferanten', icon: Truck },
    ];

    if (loading) {
        return (
            <div className="flex flex-col gap-5">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Einstellungen</h1>
                    <p className="text-sm text-muted-foreground mt-1">Lade...</p>
                </div>
                <Card hover={false}>
                    <div className="empty-state">
                        <div className="empty-state-title">Lade Einstellungen...</div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Einstellungen</h1>
                <p className="text-sm text-muted-foreground mt-1">Verwalte dein Rechnungsdesign und Firmendaten.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Invoice Builder Tab */}
            {activeTab === 'invoice' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="flex flex-col gap-5">
                        <Card title="Grundeinstellungen" hover={false}>
                            <div className="space-y-5">
                                <div>
                                    <label className="form-label">Vorlage</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData.invoice_template || 'clean'}
                                        onChange={(e) => handleChange('invoice_template', e.target.value)}
                                    >
                                        <option value="clean">Clean (Modern)</option>
                                        <option value="classic">Classic (Traditionell)</option>
                                        <option value="bold">Bold (Kräftig)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Primärfarbe</label>
                                    <div className="flex gap-2 items-center">
                                        {['#2563eb', '#dc2626', '#16a34a', '#000000'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => handleChange('invoice_color', c)}
                                                className={`w-8 h-8 rounded-full transition-all ${formData.invoice_color === c
                                                        ? 'ring-2 ring-offset-2 ring-primary'
                                                        : 'hover:scale-110'
                                                    }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={formData.invoice_color || '#2563eb'}
                                            onChange={(e) => handleChange('invoice_color', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Layout Optionen" hover={false}>
                            <div className="space-y-5">
                                <div>
                                    <label className="form-label">Logo Position</label>
                                    <div className="flex gap-2">
                                        {['left', 'center', 'right'].map(pos => (
                                            <Button
                                                key={pos}
                                                size="sm"
                                                variant={formData.logo_position === pos ? 'primary' : 'secondary'}
                                                onClick={() => handleChange('logo_position', pos)}
                                            >
                                                {pos.toUpperCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Tabellenstil</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData.table_style || 'grid'}
                                        onChange={(e) => handleChange('table_style', e.target.value)}
                                    >
                                        <option value="grid">Gitter (Grid)</option>
                                        <option value="gestreift">Gestreift</option>
                                        <option value="minimal">Minimalistisch</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        <Button onClick={handleSave} fullWidth>Speichern</Button>
                    </div>

                    {/* Live Preview */}
                    <Card title="Vorschau" hover={false} className="h-fit">
                        <div
                            className="bg-white text-black rounded-lg shadow-xl p-8"
                            style={{ fontFamily: formData.invoice_font || 'sans-serif' }}
                        >
                            {/* Header Mockup */}
                            <div
                                className="flex pb-5 mb-6"
                                style={{
                                    flexDirection: formData.logo_position === 'center' ? 'column' : (formData.logo_position === 'right' ? 'row-reverse' : 'row'),
                                    justifyContent: 'space-between',
                                    alignItems: formData.logo_position === 'center' ? 'center' : 'flex-start',
                                    borderBottom: `2px solid ${formData.invoice_color || '#2563eb'}`,
                                }}
                            >
                                <div
                                    className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium"
                                    style={{ marginBottom: formData.logo_position === 'center' ? 16 : 0 }}
                                >
                                    LOGO
                                </div>
                                <div className="text-right">
                                    <h2 className="text-lg font-bold m-0" style={{ color: formData.invoice_color || '#2563eb' }}>
                                        RECHNUNG
                                    </h2>
                                    <p className="text-xs text-gray-500 m-0">RE-2025-0001</p>
                                </div>
                            </div>

                            {/* Body Mockup */}
                            <div className="mb-6">
                                <p className="text-[10px] uppercase text-gray-500 mb-1">Empfänger</p>
                                <p className="text-sm leading-relaxed">
                                    <strong>Max Mustermann</strong><br />
                                    Musterstraße 1<br />
                                    12345 Berlin
                                </p>
                            </div>

                            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: formData.table_style === 'grid' ? '#f3f4f6' : 'transparent' }}>
                                        <th className="text-left p-2" style={{ borderBottom: `2px solid ${formData.invoice_color || '#2563eb'}` }}>Pos</th>
                                        <th className="text-left p-2" style={{ borderBottom: `2px solid ${formData.invoice_color || '#2563eb'}` }}>Beschreibung</th>
                                        <th className="text-right p-2" style={{ borderBottom: `2px solid ${formData.invoice_color || '#2563eb'}` }}>Preis</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2].map(i => (
                                        <tr
                                            key={i}
                                            style={{ background: (formData.table_style === 'gestreift' && i % 2 === 0) ? '#f9fafb' : 'transparent' }}
                                        >
                                            <td className="p-2 border-b border-gray-200">{i}</td>
                                            <td className="p-2 border-b border-gray-200">Bremsscheibe Vorderachse</td>
                                            <td className="p-2 border-b border-gray-200 text-right">59.90 €</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Company Data Tab */}
            {activeTab === 'company' && (
                <Card title="Firmendaten" hover={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="form-label">Firmenname</label>
                            <Input value={formData.company_name || ''} onChange={(e) => handleChange('company_name', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">E-Mail</label>
                            <Input value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Straße</label>
                            <Input value={formData.address_line1 || ''} onChange={(e) => handleChange('address_line1', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">PLZ</label>
                            <Input value={formData.postal_code || ''} onChange={(e) => handleChange('postal_code', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Stadt</label>
                            <Input value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">IBAN</label>
                            <Input value={formData.iban || ''} onChange={(e) => handleChange('iban', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">USt-ID</label>
                            <Input value={formData.tax_id || ''} onChange={(e) => handleChange('tax_id', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave}>Änderungen speichern</Button>
                    </div>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <Card title="Sicherheit" hover={false}>
                    <div className="max-w-md space-y-5">
                        <p className="text-sm text-muted-foreground">Ändern Sie hier Ihr Passwort.</p>

                        <div>
                            <label className="form-label">Aktuelles Passwort</label>
                            <Input type="password" value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} />
                        </div>

                        <div>
                            <label className="form-label">Neues Passwort</label>
                            <Input type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} />
                        </div>

                        <div>
                            <label className="form-label">Passwort bestätigen</label>
                            <Input type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
                        </div>

                        <Button onClick={handleChangePassword}>Passwort ändern</Button>
                    </div>
                </Card>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
                <SuppliersSettings />
            )}
        </div>
    );
};

export default SettingsPage;
