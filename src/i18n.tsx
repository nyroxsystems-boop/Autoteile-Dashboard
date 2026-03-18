import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import deTranslations from './locales/de.json';

export type LanguageCode = 'de' | 'en' | 'fr' | 'es' | 'it' | 'pl' | 'tr';

interface LanguageOption {
    code: LanguageCode;
    label: string;
}

export const languageOptions: LanguageOption[] = [
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'it', label: '🇮🇹 Italiano' },
    { code: 'pl', label: '🇵🇱 Polski' },
    { code: 'tr', label: '🇹🇷 Türkçe' }
];

interface I18nContextType {
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
    t: (key: string) => string;
    isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Cache for loaded translations
const loadedTranslations: Record<string, Record<string, string>> = {
    de: deTranslations
};

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<LanguageCode>(() => {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('language');
            if (stored && languageOptions.some(opt => opt.code === stored)) {
                return stored as LanguageCode;
            }
        }
        return 'de';
    });
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (lang !== 'de' && !loadedTranslations[lang]) {
            setIsLoading(true);
            // Dynamic import for code splitting
            import(`./locales/${lang}.json`)
                .then((module) => {
                    loadedTranslations[lang] = module.default;
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to load translations for', lang, err);
                    setIsLoading(false);
                });
        }
    }, [lang]);

    const t = (key: string): string => {
        const dict = loadedTranslations[lang] || loadedTranslations.de;
        return dict?.[key] || loadedTranslations.de[key] || key;
    };

    const handleSetLang = (newLang: LanguageCode) => {
        setLangState(newLang);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('language', newLang);
        }
    };

    return (
        <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, isLoading }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
