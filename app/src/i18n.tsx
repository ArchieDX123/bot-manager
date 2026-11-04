import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { EN } from './i18n.en';

export type Lang = 'nl' | 'en';
type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

/**
 * Vertalingen: de Nederlandse tekst is de sleutel. Voor Engels zoeken we de
 * vertaling op in i18n.en.ts; ontbreekt die, dan blijft de Nederlandse tekst staan.
 * Variabelen schrijf je als {naam}.
 */
function translate(lang: Lang, text: string, vars?: Vars) {
  const base = lang === 'en' ? EN[text] ?? text : text;
  return vars ? base.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : base;
}

const LangContext = createContext<Lang>('nl');

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT(): T {
  const lang = useContext(LangContext);
  return useCallback((text: string, vars?: Vars) => translate(lang, text, vars), [lang]);
}
