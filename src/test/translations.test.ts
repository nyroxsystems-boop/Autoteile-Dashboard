import { describe, it, expect } from 'vitest';
import { translations } from '../translations';

describe('Translations', () => {
    const languages = Object.keys(translations) as Array<keyof typeof translations>;

    it('has at least de and en languages', () => {
        expect(languages).toContain('de');
        expect(languages).toContain('en');
    });

    it('all languages have the same keys', () => {
        const deKeys = Object.keys(translations.de).sort();
        for (const lang of languages) {
            if (lang === 'de') continue;
            const langKeys = Object.keys(translations[lang]).sort();
            const missingInLang = deKeys.filter(k => !langKeys.includes(k));
            const extraInLang = langKeys.filter(k => !deKeys.includes(k));

            expect(missingInLang, `Missing keys in ${lang}: ${missingInLang.join(', ')}`).toEqual([]);
            expect(extraInLang, `Extra keys in ${lang}: ${extraInLang.join(', ')}`).toEqual([]);
        }
    });

    it('no empty string values in de', () => {
        const emptyKeys = Object.entries(translations.de)
            .filter(([_, v]) => v === '')
            .map(([k]) => k);
        expect(emptyKeys, `Empty values in de: ${emptyKeys.join(', ')}`).toEqual([]);
    });

    it('has more than 100 translation keys', () => {
        expect(Object.keys(translations.de).length).toBeGreaterThan(100);
    });
});
