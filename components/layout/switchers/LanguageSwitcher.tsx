'use client';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { languageOptions } from '@/lib/i18n';
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onPointerDown(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('pointerdown', onPointerDown); window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, []);
  return <div className="language-switcher" ref={ref}><button className="button secondary icon-control" type="button" aria-label={t('language.change')} aria-haspopup="menu" aria-expanded={open} title={t('language.change')} onClick={() => setOpen((current) => !current)}><span aria-hidden="true">🌐</span></button>{open ? <div className="language-menu" role="menu">{languageOptions.map((option) => <button className={option.locale === locale ? 'is-current' : ''} key={option.locale} type="button" role="menuitemradio" aria-checked={option.locale === locale} onClick={() => { setLocale(option.locale); setOpen(false); }}>{option.label}</button>)}</div> : null}</div>;
}
