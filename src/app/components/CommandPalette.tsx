import { useEffect, useState, useRef } from 'react';
import { 
  Search, Home, Users, FileText, ShoppingCart, DollarSign, 
  Package, Truck, BarChart, Plus, Settings,
  MessageSquare, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  theme: 'light' | 'dark';
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  category: string;
  onSelect: () => void;
  keywords?: string[];
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        setSearch('');
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset search and selection when closed
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  const allCommands: CommandItem[] = [
    // Navigation
    {
      id: 'heute',
      icon: <Home className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_today'),
      shortcut: '1',
      category: t('cmd_nav'),
      keywords: ['home', 'dashboard', 'übersicht', 'heute', 'today'],
      onSelect: () => {
        onNavigate('heute');
        onOpenChange(false);
      },
    },
    {
      id: 'kunden',
      icon: <Users className="w-4 h-4" strokeWidth={1.5} />,
      label: t('customers_title'),
      shortcut: '2',
      category: t('cmd_nav'),
      keywords: ['customers', 'inquiries', 'anfragen', 'kunden'],
      onSelect: () => {
        onNavigate('kunden');
        onOpenChange(false);
      },
    },
    {
      id: 'angebote',
      icon: <FileText className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_offers'),
      shortcut: '3',
      category: t('cmd_nav'),
      keywords: ['quotes', 'offers', 'angebote'],
      onSelect: () => {
        onNavigate('angebote');
        onOpenChange(false);
      },
    },
    {
      id: 'auftraege',
      icon: <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_orders'),
      shortcut: '4',
      category: t('cmd_nav'),
      keywords: ['orders', 'bestellungen', 'aufträge'],
      onSelect: () => {
        onNavigate('auftraege');
        onOpenChange(false);
      },
    },
    {
      id: 'preise',
      icon: <DollarSign className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_prices'),
      shortcut: '5',
      category: t('cmd_nav'),
      keywords: ['prices', 'pricing', 'preise'],
      onSelect: () => {
        onNavigate('preise');
        onOpenChange(false);
      },
    },
    {
      id: 'belege',
      icon: <Package className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_documents'),
      shortcut: '6',
      category: t('cmd_nav'),
      keywords: ['documents', 'invoices', 'rechnungen', 'belege'],
      onSelect: () => {
        onNavigate('belege');
        onOpenChange(false);
      },
    },
    {
      id: 'lieferanten',
      icon: <Truck className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_suppliers'),
      shortcut: '7',
      category: t('cmd_nav'),
      keywords: ['suppliers', 'vendors', 'lieferanten'],
      onSelect: () => {
        onNavigate('lieferanten');
        onOpenChange(false);
      },
    },
    {
      id: 'status',
      icon: <BarChart className="w-4 h-4" strokeWidth={1.5} />,
      label: t('nav_status'),
      shortcut: '8',
      category: t('cmd_nav'),
      keywords: ['stats', 'analytics', 'dashboard', 'status'],
      onSelect: () => {
        onNavigate('status');
        onOpenChange(false);
      },
    },
    // Quick Actions
    {
      id: 'create-customer',
      icon: <Plus className="w-4 h-4" strokeWidth={1.5} />,
      label: t('cmd_new_customer'),
      shortcut: 'C',
      category: t('cmd_quick_actions'),
      keywords: ['new', 'customer', 'add', 'kunde'],
      onSelect: () => {
        onNavigate('kunden');
        onOpenChange(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('quick-action', { detail: 'create-customer' }));
        }, 100);
      },
    },
    {
      id: 'create-quote',
      icon: <FileText className="w-4 h-4" strokeWidth={1.5} />,
      label: t('cmd_new_quote'),
      shortcut: 'A',
      category: t('cmd_quick_actions'),
      keywords: ['new', 'quote', 'offer', 'angebot'],
      onSelect: () => {
        onNavigate('angebote');
        onOpenChange(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('quick-action', { detail: 'create-quote' }));
        }, 100);
      },
    },
    {
      id: 'create-order',
      icon: <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />,
      label: t('cmd_new_order'),
      category: t('cmd_quick_actions'),
      keywords: ['new', 'order', 'auftrag'],
      onSelect: () => {
        onNavigate('auftraege');
        onOpenChange(false);
      },
    },
    // Filters
    {
      id: 'filter-oem',
      icon: <AlertCircle className="w-4 h-4 text-red-500" strokeWidth={1.5} />,
      label: t('cmd_oem_pending'),
      category: t('cmd_filters'),
      keywords: ['oem', 'pending', 'waiting'],
      onSelect: () => {
        onNavigate('kunden');
        onOpenChange(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('quick-filter', { detail: 'oem_pending' }));
        }, 100);
      },
    },
    {
      id: 'filter-waiting',
      icon: <Clock className="w-4 h-4 text-yellow-500" strokeWidth={1.5} />,
      label: t('cmd_waiting'),
      category: t('cmd_filters'),
      keywords: ['waiting', 'pending', 'wartend'],
      onSelect: () => {
        onNavigate('kunden');
        onOpenChange(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('quick-filter', { detail: 'waiting' }));
        }, 100);
      },
    },
    {
      id: 'filter-today',
      icon: <CheckCircle className="w-4 h-4 text-green-500" strokeWidth={1.5} />,
      label: t('cmd_today_done'),
      category: t('cmd_filters'),
      keywords: ['today', 'completed', 'done', 'heute'],
      onSelect: () => {
        onNavigate('heute');
        onOpenChange(false);
      },
    },
    {
      id: 'filter-whatsapp',
      icon: <MessageSquare className="w-4 h-4 text-[#25D366]" strokeWidth={1.5} />,
      label: t('cmd_whatsapp_today'),
      category: t('cmd_filters'),
      keywords: ['whatsapp', 'messages', 'chat'],
      onSelect: () => {
        onNavigate('kunden');
        onOpenChange(false);
      },
    },
    // Settings
    {
      id: 'settings',
      icon: <Settings className="w-4 h-4" strokeWidth={1.5} />,
      label: t('cmd_open_settings'),
      shortcut: '⌘,',
      category: t('cmd_system'),
      keywords: ['settings', 'preferences', 'einstellungen'],
      onSelect: () => {
        onOpenChange(false);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-settings'));
        }, 100);
      },
    },
  ];

  // Filter commands based on search
  const filteredCommands = search
    ? allCommands.filter((cmd) => {
        const searchLower = search.toLowerCase();
        const labelMatch = cmd.label.toLowerCase().includes(searchLower);
        const keywordMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower));
        return labelMatch || keywordMatch;
      })
    : allCommands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Dialog */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('cmd_search_placeholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 py-4 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t('cmd_no_results')}
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </div>
                <div className="space-y-1">
                  {commands.map((cmd) => {
                    const itemIndex = globalIndex++;
                    const isSelected = itemIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.onSelect}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="text-muted-foreground">{cmd.icon}</div>
                        <span className="flex-1 text-left text-sm text-foreground">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted rounded border border-border">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">↑↓</kbd>
                <span>{t('cmd_navigate')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">↵</kbd>
                <span>{t('cmd_select')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">⌘K</kbd>
              <span>{t('cmd_close')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}