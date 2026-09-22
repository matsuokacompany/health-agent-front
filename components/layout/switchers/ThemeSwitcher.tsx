'use client';
import { SunDim, Moon } from '@phosphor-icons/react';
import { useI18n } from '@/components/i18n/I18nProvider';
export function ThemeSwitcher({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  return <button className="button secondary icon-control theme-toggle" type="button" onClick={onToggle} aria-pressed={isDark} aria-label={isDark ? t('theme.light') : t('theme.dark')} title={t('theme.toggle')}>{isDark ? <SunDim aria-hidden="true" size={18} weight="duotone" /> : <Moon aria-hidden="true" size={18} weight="duotone" />}</button>;
}
