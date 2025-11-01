import React, { createContext, useState, ReactNode } from 'react';
import { translations } from '../translations';

export type Language = 'en' | 'fr';

export interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                console.warn(`Translation key not found: ${key}`);
                return key; // Return the key itself as a fallback
            }
        }
        return result || key;
    };

    const value = {
        language,
        setLanguage,
        t,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
