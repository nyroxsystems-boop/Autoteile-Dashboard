import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { StatusChip } from '../../components/StatusChip';
import { wawiService, Part } from '../../services/wawiService';
import { ArticleFormModal, type ArticleFormData } from '../../components/ArticleFormModal';
import { useI18n } from '../../../i18n';
import { toast } from 'sonner';

export function ArticleListView() {
    const [articles, setArticles] = useState<Part[]>([]);
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await wawiService.getArticles();
            setArticles(data);
        } catch {
            // Failed to load articles
        } finally {
            setLoading(false);
        }
    };

    const filteredArticles = articles
        .filter(a => searchTerm ? (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.IPN.toLowerCase().includes(searchTerm.toLowerCase())) : true)
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleCreateArticle = async (articleData: ArticleFormData) => {
        try {
            await wawiService.createArticle(articleData as unknown as Partial<Part>);
            toast.success(t('wawi_article_created'));
            loadArticles();
        } catch {
            toast.error(t('error'));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('wawi_article_master')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('wawi_article_master_sub')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-medium">
                        <Download className="w-4 h-4 mr-2" />
                        {t('wawi_export')}
                    </Button>
                    <Button className="bg-primary text-white rounded-xl font-bold" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('wawi_new_article')}
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            placeholder={t('wawi_search_sku')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Filter className="w-4 h-4 mr-2" /> {t('wawi_filter')}
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-muted text-primary">
                            <List className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
                                <th className="px-6 py-4">{t('wawi_product')}</th>
                                <th className="px-6 py-4">{t('wawi_category')}</th>
                                <th className="px-6 py-4">{t('wawi_inventory')}</th>
                                <th className="px-6 py-4">{t('wawi_status')}</th>
                                <th className="px-6 py-4 text-right">{t('wawi_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">{t('wawi_loading_articles')}</td></tr>
                            ) : filteredArticles.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">{t('wawi_no_articles')}</td></tr>
                            ) : filteredArticles.map(article => (
                                <tr key={article.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border group-hover:bg-background transition-colors">
                                                {article.image ? <img src={article.image} alt="" className="w-full h-full object-cover rounded-lg" /> : article.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <Link to={`/wawi/artikel/${article.id}`} className="hover:underline">
                                                <div className="font-bold text-sm text-foreground">{article.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{article.IPN}</div>
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-muted-foreground">{article.category_name || 'Standard'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${article.total_in_stock < article.minimum_stock ? 'text-red-500' : 'text-foreground'}`}>
                                                {article.total_in_stock} {t('wawi_pieces')}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">Min: {article.minimum_stock}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusChip
                                            status={article.total_in_stock < article.minimum_stock ? 'error' : 'success'}
                                            label={article.total_in_stock < article.minimum_stock ? t('wawi_shortage') : t('wawi_ok')}
                                            size="sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ArticleFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateArticle}
            />
        </div>
    );
}
