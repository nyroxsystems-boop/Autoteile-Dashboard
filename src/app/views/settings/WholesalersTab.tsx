import { useState, useEffect } from 'react';
import { Plus, X, Package, Zap, Loader2 } from 'lucide-react';
import { useMerchantSettings } from '../../hooks/useMerchantSettings';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import type { WholesalerConfig } from '../../api/wws';

export function WholesalersTab() {
    const { t } = useI18n();
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const { settings: merchantSettings, update: updateMerchantSettings } = useMerchantSettings();

    const [wholesalers, setWholesalers] = useState<WholesalerConfig[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPortal, setNewPortal] = useState('tecdoc');
    const [newName, setNewName] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [newAccountId, setNewAccountId] = useState('');
    const [testingId, setTestingId] = useState<string | null>(null);

    const portalLabels: Record<string, string> = {
        tecdoc: t('wholesaler_portal_tecdoc'), autodoc_pro: t('wholesaler_portal_autodoc'),
        stahlgruber: t('wholesaler_portal_stahlgruber'), wm_se: t('wholesaler_portal_wmse'), custom: t('wholesaler_portal_custom'),
    };

    useEffect(() => {
        if (merchantSettings) setWholesalers(merchantSettings.wholesalers || []);
    }, [merchantSettings]);

    const handleAdd = async () => {
        const newEntry: WholesalerConfig = {
            id: Date.now().toString(), name: newName || portalLabels[newPortal] || newPortal,
            portal: newPortal as WholesalerConfig['portal'], apiKey: newApiKey, accountId: newAccountId || undefined, status: 'pending', createdAt: new Date().toISOString(),
        };
        const updated = [...wholesalers, newEntry];
        setWholesalers(updated);
        await updateMerchantSettings({ wholesalers: updated });
        toast.success(t('wholesaler_saved'));
        setShowAddForm(false); setNewName(''); setNewApiKey(''); setNewAccountId(''); setNewPortal('tecdoc');
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({ title: t('wholesaler_delete_title') || 'Großhändler entfernen', message: t('wholesaler_delete_confirm'), variant: 'danger', confirmLabel: t('delete') });
        if (!confirmed) return;
        const updated = wholesalers.filter((w) => w.id !== id);
        setWholesalers(updated);
        await updateMerchantSettings({ wholesalers: updated });
        toast.success(t('wholesaler_deleted'));
    };

    // D7 FIX: Test connection handler
    const handleTest = async (ws: WholesalerConfig) => {
        setTestingId(ws.id);
        try {
            const res = await fetch(`/api/dashboard/wholesalers/${ws.id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${localStorage.getItem('token')}` },
            });
            const data = await res.json().catch(() => ({}));
            const newStatus = res.ok ? 'connected' : 'error';
            const updated = wholesalers.map(w => w.id === ws.id ? { ...w, status: newStatus as WholesalerConfig['status'], lastSync: new Date().toISOString() } : w);
            setWholesalers(updated);
            await updateMerchantSettings({ wholesalers: updated });
            if (res.ok) {
                toast.success(t('wholesaler_connected'));
            } else {
                toast.error(data?.error || t('wholesaler_error'));
            }
        } catch (_err) {
            toast.error(t('wholesaler_error'));
        } finally {
            setTestingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h3 className="text-foreground font-medium">{t('wholesaler_title')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('wholesaler_subtitle')}</p>
                    </div>
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> {t('wholesaler_add')}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="bg-card border border-primary/30 rounded-xl p-6 space-y-4">
                    <h4 className="text-foreground font-medium">{t('wholesaler_add')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">{t('wholesaler_portal')}</label>
                            <select value={newPortal} onChange={(e) => setNewPortal(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                                <option value="tecdoc">{t('wholesaler_portal_tecdoc')}</option>
                                <option value="autodoc_pro">{t('wholesaler_portal_autodoc')}</option>
                                <option value="stahlgruber">{t('wholesaler_portal_stahlgruber')}</option>
                                <option value="wm_se">{t('wholesaler_portal_wmse')}</option>
                                <option value="custom">{t('wholesaler_portal_custom')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">{t('wholesaler_name_label')}</label>
                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Mein Stahlgruber Account"
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">{t('wholesaler_api_key')}</label>
                            <input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="sk-..."
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">{t('wholesaler_account_id')}</label>
                            <input type="text" value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)} placeholder="Optional"
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={handleAdd} disabled={!newApiKey}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('save')}</button>
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors">{t('cancel')}</button>
                    </div>
                </div>
            )}

            {wholesalers.length > 0 ? (
                <div className="space-y-3">
                    {wholesalers.map((ws) => (
                        <div key={ws.id} className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">{ws.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground">{portalLabels[ws.portal] || ws.portal}</span>
                                            {ws.accountId && <span className="text-xs text-muted-foreground">{t('wholesaler_account_id')}: {ws.accountId}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ws.status === 'connected' ? 'bg-green-500/10 text-green-600' : ws.status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        {ws.status === 'connected' ? t('wholesaler_connected') : ws.status === 'error' ? t('wholesaler_error') : t('wholesaler_pending')}
                                    </span>
                                    {ws.lastSync && <span className="text-xs text-muted-foreground">{t('wholesaler_last_sync')}: {new Date(ws.lastSync).toLocaleString()}</span>}
                                    <button onClick={() => handleDelete(ws.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title={t('delete')}>
                                        <X className="w-4 h-4" />
                                    </button>
                                    {/* D7 FIX: Test connection button */}
                                    <button
                                        onClick={() => handleTest(ws)}
                                        disabled={testingId === ws.id}
                                        className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {testingId === ws.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                        {t('wholesaler_test')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h4 className="text-foreground font-medium mb-1">{t('wholesaler_none')}</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">{t('wholesaler_none_desc')}</p>
                </div>
            )}

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                        API-Schlüssel werden verschlüsselt gespeichert. Nach dem Verbinden werden Produkte automatisch über die Großhändler-APIs gesucht wenn neue Kundenanfragen eingehen.
                    </p>
                </div>
            </div>
            <ConfirmDialog />
        </div>
    );
}
