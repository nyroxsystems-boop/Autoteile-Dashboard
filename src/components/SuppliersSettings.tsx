import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useB2BSuppliers, type B2BSupplier } from '../hooks/useB2BSuppliers';

interface SupplierCardProps {
    supplier: B2BSupplier;
    priceTiers: Array<{ id: string; name: string; discount: number; minOrders: number }>;
    onSave: (name: string, config: any) => Promise<boolean>;
    onCalculate: (price: number, name: string) => Promise<any>;
}

const SupplierCard = ({ supplier, priceTiers, onSave, onCalculate }: SupplierCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testPrice, setTestPrice] = useState('100');
    const [testResult, setTestResult] = useState<any>(null);

    const [formData, setFormData] = useState({
        enabled: supplier.config?.enabled || false,
        api_key: '',
        api_secret: '',
        account_number: '',
        price_tier: supplier.config?.price_tier || 'basic',
        margin_type: supplier.config?.margin_type || 'percentage',
        margin_value: supplier.config?.margin_value || 15,
        minimum_margin: supplier.config?.minimum_margin || 5,
        rounding_strategy: supplier.config?.rounding_strategy || 'up',
        round_to: supplier.config?.round_to || 0.99
    });

    const handleSave = async () => {
        setIsSaving(true);
        const success = await onSave(supplier.name, formData);
        setIsSaving(false);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleTestMargin = async () => {
        const result = await onCalculate(parseFloat(testPrice), supplier.name);
        setTestResult(result);
    };

    return (
        <Card
            title={supplier.displayName}
            actions={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {supplier.hasApi && <Badge variant="success">API verfügbar</Badge>}
                    {supplier.config?.enabled && <Badge variant="info">Aktiv</Badge>}
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: 14 }}>
                        Website →
                    </a>
                    <Button size="sm" variant={isEditing ? 'secondary' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Abbrechen' : 'Bearbeiten'}
                    </Button>
                </div>
            }
        >
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{supplier.description}</p>

            {!isEditing ? (
                // Display Mode
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                    <div>
                        <div style={styles.label}>Status</div>
                        <div style={styles.value}>{supplier.config?.enabled ? '✅ Aktiviert' : '⏸️ Deaktiviert'}</div>
                    </div>
                    <div>
                        <div style={styles.label}>Preisstufe</div>
                        <div style={styles.value}>{supplier.config?.price_tier?.toUpperCase() || 'BASIC'}</div>
                    </div>
                    <div>
                        <div style={styles.label}>Marge</div>
                        <div style={styles.value}>
                            {supplier.config?.margin_value || 15}
                            {supplier.config?.margin_type === 'fixed' ? ' €' : ' %'}
                        </div>
                    </div>
                    <div>
                        <div style={styles.label}>API-Zugangsdaten</div>
                        <div style={styles.value}>{supplier.config?.hasCredentials ? '✅ Konfiguriert' : '❌ Nicht konfiguriert'}</div>
                    </div>
                </div>
            ) : (
                // Edit Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Enable Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="checkbox"
                            id={`enable-${supplier.name}`}
                            checked={formData.enabled}
                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                            style={{ width: 20, height: 20 }}
                        />
                        <label htmlFor={`enable-${supplier.name}`} style={{ fontWeight: 600 }}>
                            Lieferant aktivieren
                        </label>
                    </div>

                    {/* API Credentials */}
                    {supplier.hasApi && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>🔑 API-Zugangsdaten</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={styles.label}>API Key</label>
                                    <input
                                        type="password"
                                        placeholder="API-Schlüssel eingeben"
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>API Secret</label>
                                    <input
                                        type="password"
                                        placeholder="API-Geheimnis eingeben"
                                        value={formData.api_secret}
                                        onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Kontonummer</label>
                                    <input
                                        placeholder="Ihre Kundennummer"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                            {supplier.config?.hasCredentials && (
                                <p style={{ color: 'var(--success)', marginTop: 8, fontSize: 13 }}>
                                    ✅ Zugangsdaten bereits konfiguriert. Leer lassen um beizubehalten.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Pricing Configuration */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>💰 Preiskonfiguration</h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            <div>
                                <label style={styles.label}>Preisstufe</label>
                                <select
                                    value={formData.price_tier}
                                    onChange={(e) => setFormData({ ...formData, price_tier: e.target.value })}
                                    style={styles.select}
                                >
                                    {priceTiers.map(tier => (
                                        <option key={tier.id} value={tier.id}>
                                            {tier.name} ({tier.discount}% Rabatt, ab {tier.minOrders} Bestellungen/Monat)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>Margentyp</label>
                                <select
                                    value={formData.margin_type}
                                    onChange={(e) => setFormData({ ...formData, margin_type: e.target.value as any })}
                                    style={styles.select}
                                >
                                    <option value="percentage">Prozentual (%)</option>
                                    <option value="fixed">Fixbetrag (€)</option>
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>{formData.margin_type === 'percentage' ? 'Marge (%)' : 'Marge (€)'}</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={formData.margin_value}
                                    onChange={(e) => setFormData({ ...formData, margin_value: parseFloat(e.target.value) || 0 })}
                                    style={styles.input}
                                />
                            </div>

                            <div>
                                <label style={styles.label}>Mindestmarge (€)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={formData.minimum_margin}
                                    onChange={(e) => setFormData({ ...formData, minimum_margin: parseFloat(e.target.value) || 0 })}
                                    style={styles.input}
                                />
                            </div>

                            <div>
                                <label style={styles.label}>Rundung</label>
                                <select
                                    value={formData.rounding_strategy}
                                    onChange={(e) => setFormData({ ...formData, rounding_strategy: e.target.value as any })}
                                    style={styles.select}
                                >
                                    <option value="up">Aufrunden</option>
                                    <option value="down">Abrunden</option>
                                    <option value="nearest">Kaufmännisch</option>
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>Runden auf</label>
                                <select
                                    value={formData.round_to}
                                    onChange={(e) => setFormData({ ...formData, round_to: parseFloat(e.target.value) })}
                                    style={styles.select}
                                >
                                    <option value={0.99}>.99 € (z.B. 49,99 €)</option>
                                    <option value={0.49}>.49 € (z.B. 49,49 €)</option>
                                    <option value={0.5}>0.50 € (z.B. 50,00 €)</option>
                                    <option value={1}>1.00 € (ganze Euro)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Margin Test */}
                    <div style={{ background: 'rgba(37,99,235,0.1)', padding: 16, borderRadius: 8, border: '1px solid rgba(37,99,235,0.3)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>🧪 Marge testen</h4>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div>
                                <label style={styles.label}>Einkaufspreis (€)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={testPrice}
                                    onChange={(e) => setTestPrice(e.target.value)}
                                    style={{ ...styles.input, width: 150 }}
                                />
                            </div>
                            <Button onClick={handleTestMargin}>Berechnen</Button>
                        </div>
                        {testResult && (
                            <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                                <div>
                                    <div style={styles.label}>Einkauf</div>
                                    <div style={{ ...styles.value, color: '#ef4444' }}>{testResult.formatted?.purchase}</div>
                                </div>
                                <div>
                                    <div style={styles.label}>+ Marge</div>
                                    <div style={{ ...styles.value, color: '#f59e0b' }}>{testResult.formatted?.margin} ({testResult.marginPercent}%)</div>
                                </div>
                                <div>
                                    <div style={styles.label}>= Verkauf</div>
                                    <div style={{ ...styles.value, color: '#22c55e', fontWeight: 700 }}>{testResult.formatted?.selling}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>
                            Abbrechen
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Speichern...' : 'Speichern'}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

const SuppliersSettings = () => {
    const { suppliers, priceTiers, loading, error, updateSupplier, calculateMargin } = useB2BSuppliers();

    if (loading) {
        return <div style={{ padding: 20 }}>Lade Lieferanten...</div>;
    }

    if (error) {
        return <div style={{ padding: 20, color: 'var(--danger)' }}>Fehler: {error}</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ margin: '0 0 8px 0' }}>B2B-Lieferanten</h2>
                <p style={{ color: 'var(--muted)', margin: 0 }}>
                    Konfigurieren Sie Ihre polnischen Großhändler für automatische Teilebestellung mit Marge.
                </p>
            </div>

            {suppliers.map(supplier => (
                <SupplierCard
                    key={supplier.name}
                    supplier={supplier}
                    priceTiers={priceTiers}
                    onSave={updateSupplier}
                    onCalculate={calculateMargin}
                />
            ))}

            {suppliers.length === 0 && (
                <Card>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <p style={{ color: 'var(--muted)' }}>Keine Lieferanten verfügbar.</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    label: {
        fontSize: 12,
        color: 'var(--muted)',
        marginBottom: 4,
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    value: {
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text)'
    },
    select: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        color: 'var(--text)',
        fontSize: 14,
        cursor: 'pointer'
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        color: 'var(--text)',
        fontSize: 14
    }
};

export default SuppliersSettings;
