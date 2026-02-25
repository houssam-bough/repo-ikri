"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../translations';

export type Language = 'fr' | 'ar';

export interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => any;
    isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('fr');

    const isRTL = language === 'ar';

    // Update <html> dir and lang attributes when language changes
    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language, isRTL]);

    const t = (key: string): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to French
                let fallback: any = translations['fr'];
                for (const fk of key.split('.')) {
                    fallback = fallback?.[fk];
                }
                if (fallback !== undefined) return fallback;
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }
        return result || key;
    };

    const value = {
        language,
        setLanguage,
        t,
        isRTL,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
