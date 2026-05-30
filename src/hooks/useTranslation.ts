import { create } from 'zustand';
import { en } from '../locales/en';
import { id } from '../locales/id';

export type Language = 'en' | 'id';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: (() => {
    const saved = localStorage.getItem('sfrt_language') as Language;
    if (saved === 'en' || saved === 'id') return saved;
    // Browser detection fallback
    const browserLang = navigator.language;
    if (browserLang && browserLang.toLowerCase().startsWith('id')) {
      return 'id';
    }
    return 'en';
  })(),
  setLanguage: (lang: Language) => {
    localStorage.setItem('sfrt_language', lang);
    set({ language: lang });
  }
}));

const translations = { en, id };

export function useTranslation() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  const t = (path: string): string => {
    const dict = translations[language] as any;
    const parts = path.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return path; // Fallback to path key itself
      }
    }
    return typeof current === 'string' ? current : path;
  };

  return { t, language, setLanguage };
}
