import { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './translations';

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
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<LanguageCode>(() => {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('language');
            if (stored && languageOptions.some(opt => opt.code === stored)) {
                return stored as LanguageCode;
            }
        }
        return 'de';
    });

    const t = (key: string): string => {
        return translations[lang]?.[key] || translations.de[key] || key;
    };

    const handleSetLang = (newLang: LanguageCode) => {
        setLang(newLang);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('language', newLang);
        }
    };

    return (
        <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
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
