import { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useSuppliers, type SupplierDefinition } from '../hooks/useB2BSuppliers';

const SupplierCard = ({
    supplier,
    onSave
}: {
    supplier: SupplierDefinition;
    onSave: (key: string, data: any) => Promise<{ success: boolean }>
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Record<string, any>>({
        enabled: supplier.config?.enabled || false,
        ...Object.fromEntries(supplier.credentialFields.map(f => [f.key, ''])),
        ...Object.fromEntries(supplier.settingFields.map(f => [f.key, supplier.config?.settings?.[f.key] ?? f.defaultValue ?? '']))
    });

    const handleSave = async () => {
        setIsSaving(true);
        const credentials: Record<string, string> = {};
        const settings: Record<string, any> = {};

        supplier.credentialFields.forEach(f => { if (formData[f.key]) credentials[f.key] = formData[f.key]; });
        supplier.settingFields.forEach(f => { settings[f.key] = formData[f.key]; });

        const result = await onSave(supplier.key, { enabled: formData.enabled, credentials, settings });
        setIsSaving(false);
        if (result.success) setIsEditing(false);
    };

    return (
        <div
            style={{
                background: 'var(--bg-panel)',
                borderRadius: 16,
                border: `2px solid ${supplier.isEnabled ? supplier.color : 'var(--border)'}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: supplier.isEnabled ? `0 0 20px ${supplier.color}30` : 'none'
            }}
        >
            {/* Header */}
            <div style={{
                padding: 20,
                background: `linear-gradient(135deg, ${supplier.color}15 0%, transparent 100%)`,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{supplier.icon}</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{supplier.name}</h3>
                            <span style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600
                            }}>{supplier.country}</span>
                        </div>
                        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>{supplier.description}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {supplier.hasApi && <Badge variant="success">API</Badge>}
                    {supplier.isEnabled && <Badge variant="info">Aktiv</Badge>}
                </div>
            </div>

            {/* Features */}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
                {supplier.features.map(f => (
                    <span key={f} style={{
                        background: 'var(--bg)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        color: 'var(--muted)'
                    }}>
                        {f}
                    </span>
                ))}
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
                {!isEditing ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div>
                                <div style={styles.label}>Status</div>
                                <div style={styles.value}>{supplier.isEnabled ? '✅ Aktiviert' : '⏸️ Deaktiviert'}</div>
                            </div>
                            <div>
                                <div style={styles.label}>Marge</div>
                                <div style={styles.value}>{supplier.config?.settings?.margin_percent || 15}%</div>
                            </div>
                            <div>
                                <div style={styles.label}>Zugangsdaten</div>
                                <div style={styles.value}>{Object.keys(supplier.config?.credentials || {}).length > 0 ? '✅ Hinterlegt' : '❌ Fehlt'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost">Website</Button>
                            </a>
                            <Button size="sm" variant="primary" onClick={() => setIsEditing(true)}>
                                Konfigurieren
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Enable Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.enabled}
                                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                style={{ width: 20, height: 20, accentColor: supplier.color }}
                            />
                            <span style={{ fontWeight: 600, fontSize: 15 }}>Lieferant aktivieren</span>
                        </label>

                        {/* Credentials */}
                        {supplier.credentialFields.length > 0 && (
                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>🔑 Zugangsdaten</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    {supplier.credentialFields.map(field => (
                                        <div key={field.key}>
                                            <label style={styles.label}>{field.label} {field.required && <span style={{ color: supplier.color }}>*</span>}</label>
                                            <input
                                                type={field.type}
                                                placeholder={`${field.label} eingeben`}
                                                value={formData[field.key] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                style={styles.input}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(supplier.config?.credentials || {}).length > 0 && (
                                    <p style={{ color: 'var(--success)', marginTop: 8, fontSize: 12 }}>
                                        ✅ Zugangsdaten hinterlegt. Leer lassen um beizubehalten.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Settings */}
                        {supplier.settingFields.length > 0 && (
                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>⚙️ Einstellungen</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                    {supplier.settingFields.map(field => (
                                        <div key={field.key}>
                                            <label style={styles.label}>{field.label}</label>
                                            {field.type === 'number' && (
                                                <input
                                                    type="number"
                                                    min={field.min}
                                                    max={field.max}
                                                    value={formData[field.key] ?? field.defaultValue ?? 0}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: parseFloat(e.target.value) || 0 })}
                                                    style={styles.input}
                                                />
                                            )}
                                            {field.type === 'select' && (
                                                <select
                                                    value={formData[field.key] ?? field.defaultValue}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    style={styles.select}
                                                >
                                                    {field.options?.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                            {field.type === 'toggle' && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData[field.key] ?? field.defaultValue ?? false}
                                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                                                        style={{ width: 18, height: 18, accentColor: supplier.color }}
                                                    />
                                                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>Aktiviert</span>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Abbrechen</Button>
                            <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ background: supplier.color }}>
                                {isSaving ? 'Speichern...' : 'Speichern'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SuppliersSettings = () => {
    const { suppliers, loading, error, updateSupplier } = useSuppliers();

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Lade Lieferanten...</div>;
    if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>Fehler: {error}</div>;

    const enabledCount = suppliers.filter(s => s.isEnabled).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 24,
                borderRadius: 16,
                color: 'white'
            }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>🏭 B2B Lieferanten</h2>
                <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
                    Verbinde polnische Großhändler für automatische Teilebestellung mit Marge.
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{enabledCount}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Aktiv</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{suppliers.length}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Verfügbar</div>
                    </div>
                </div>
            </div>

            {/* Supplier Cards */}
            {suppliers.map(supplier => (
                <SupplierCard key={supplier.key} supplier={supplier} onSave={updateSupplier} />
            ))}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    label: {
        fontSize: 11,
        color: 'var(--muted)',
        marginBottom: 4,
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: 600
    },
    value: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text)'
    },
    section: {
        background: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--border)'
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: 14,
        fontWeight: 600
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontSize: 14
    },
    select: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontSize: 14,
        cursor: 'pointer'
    }
};

export default SuppliersSettings;
