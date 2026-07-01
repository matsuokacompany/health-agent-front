'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, locales, messages, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'julha-language';

type I18nContextValue = { locale: Locale; setLocale(locale: Locale): void; t(path: string, params?: Record<string, string | number>): string; raw<T = unknown>(path: string): T };
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function isLocale(value: string | null): value is Locale { return Boolean(value && (locales as readonly string[]).includes(value)); }
function readPath(path: string, locale: Locale): unknown { return path.split('.').reduce<unknown>((current, key) => typeof current === 'object' && current && key in current ? (current as Record<string, unknown>)[key] : undefined, messages[locale]); }

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  useEffect(() => { const stored = window.localStorage.getItem(STORAGE_KEY); if (isLocale(stored)) setLocaleState(stored); }, []);
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale(nextLocale) { window.localStorage.setItem(STORAGE_KEY, nextLocale); setLocaleState(nextLocale); },
    t(path, params) { const value = readPath(path, locale); const template = typeof value === 'string' ? value : path; return Object.entries(params ?? {}).reduce((text, [key, val]) => text.replaceAll(`{${key}}`, String(val)), template); },
    raw(path) { return readPath(path, locale) as never; },
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { const context = useContext(I18nContext); if (!context) throw new Error('useI18n must be used inside I18nProvider'); return context; }
