import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package, Warehouse, ShoppingCart, History, ArrowLeft,
    ExternalLink, Edit, Trash2, Truck, AlertTriangle, Box
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { wawiService, Part } from '../../services/wawiService';
import { StatusChip } from '../../components/StatusChip';
import { BOMManager } from '../../components/BOMManager';
import { MovementLog } from '../../components/MovementLog';
import { StockLocationManager } from '../../components/StockLocationManager';

export function ArticleDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'bom' | 'purchase' | 'history'>('overview');
    const [article, setArticle] = useState<Part | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadArticle(id);
        }
    }, [id]);

    const loadArticle = async (articleId: string | number) => {
        setLoading(true);
        try {
            const data = await wawiService.getArticleDetails(articleId);
            setArticle(data);
        } catch (err) {
            console.error('Failed to load article detail', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Lade Artikeldetails...</div>;
    if (!article) return <div className="p-20 text-center">Artikel nicht gefunden.</div>;

    const tabs = [
        { id: 'overview', label: 'Übersicht', icon: Package },
        { id: 'stock', label: 'Lager & Bestand', icon: Warehouse },
        ...(article.article_type === 'set' ? [{ id: 'bom', label: 'Baukasten', icon: Box }] : []),
        { id: 'purchase', label: 'Einkauf', icon: ShoppingCart },
        { id: 'history', label: 'Historie', icon: History },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{article.name}</h1>
                            <StatusChip
                                status={article.total_in_stock < article.minimum_stock ? 'error' : 'success'}
                                label={article.total_in_stock < article.minimum_stock ? 'Mangel' : 'OK'}
                                size="sm"
                            />
                        </div>
                        <p className="text-muted-foreground font-mono text-sm mt-1">{article.IPN || `#${article.id}`}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="rounded-xl">
                        <Edit className="w-4 h-4 mr-2" /> Bearbeiten
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                        Bestellen
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b border-border">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
              flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative
              ${activeTab === tab.id
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}
            `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'overview' && (
                        <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Kategorie</h4>
                                        <p className="text-lg font-medium">{article.category_name || 'Standard'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Beschreibung</h4>
                                        <p className="text-muted-foreground leading-relaxed italic">{article.description || 'Keine Beschreibung hinterlegt.'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-right">
                                    <div className="w-32 h-32 bg-muted rounded-2xl ml-auto flex items-center justify-center border border-border">
                                        <Package className="w-12 h-12 text-muted-foreground/20" />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/20 rounded-2xl flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Status</span>
                                    <span className="text-emerald-500 font-bold">AKTIV</span>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Typ</span>
                                    <span className="font-bold capitalize">
                                        {article.article_type === 'set' && '🎁 Set/Baukasten'}
                                        {article.article_type === 'deposit' && '💰 Pfand'}
                                        {(!article.article_type || article.article_type === 'standard') && '📦 Standard'}
                                    </span>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Marke</span>
                                    <span className="font-bold">{article.brand || '--'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                <h3 className="font-bold text-xl mb-6">Bestandsdetails</h3>
                                <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-3xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                            <Warehouse className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Aktueller Gesamtbestand</div>
                                            <div className="text-3xl font-bold">{article.total_in_stock} Stück</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Mindestbestand</div>
                                        <div className="text-xl font-semibold text-red-500">{article.minimum_stock} Stück</div>
                                    </div>
                                </div>

                                <StockLocationManager
                                    locations={article.stock_locations || [
                                        { location_id: 1, location_name: 'Hauptlager A1-03', location_code: 'A1-03', quantity: article.total_in_stock }
                                    ]}
                                    totalStock={article.total_in_stock}
                                    minimumStock={article.minimum_stock}
                                />
                            </div>

                            <Button onClick={() => navigate('/wawi/lager')} className="w-full bg-accent text-accent-foreground rounded-2xl py-6 font-bold hover:bg-accent/80 transition-all border border-border">
                                Bestand buchen (Korrektur/Verschieben)
                            </Button>
                        </div>
                    )}

                    {activeTab === 'bom' && article.article_type === 'set' && (
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                            <BOMManager
                                components={article.bom_components || []}
                                onChange={(components) => {
                                    // In a real app, this would trigger an API call
                                    console.log('Updated BOM:', components);
                                }}
                                availableArticles={[]}
                            />
                        </div>
                    )}

                    {activeTab === 'purchase' && (
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm text-center py-20">
                            <Truck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="font-bold text-xl mb-2">Lieferanten & Einkauf</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                Hier werden bald verknüpfte Lieferanten, Einkaufspreise und die Bestellhistorie angezeigt.
                            </p>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                            <MovementLog partId={article.id} />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Schnellzugriff</h4>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" className="justify-start rounded-xl h-11">
                                <ExternalLink className="w-4 h-4 mr-2" /> InvenTree öffnen
                            </Button>
                            <Button variant="outline" className="justify-start rounded-xl h-11 text-red-500 hover:text-red-600 hover:bg-red-50 border-dashed">
                                <Trash2 className="w-4 h-4 mr-2" /> Artikel löschen
                            </Button>
                        </div>
                    </div>

                    {article.total_in_stock < article.minimum_stock && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
                            <div className="flex items-center gap-3 text-red-600 mb-3">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-bold font-sm">Bestand zu niedrig!</span>
                            </div>
                            <p className="text-xs text-red-500/80 leading-relaxed">
                                Der aktuelle Bestand unterschreitet den Mindestbestand. Bitte lösen Sie eine Nachbestellung aus.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
