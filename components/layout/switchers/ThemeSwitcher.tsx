'use client';
import { useI18n } from '@/components/i18n/I18nProvider';
export function ThemeSwitcher({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  return <button className="button secondary icon-control theme-toggle" type="button" onClick={onToggle} aria-pressed={isDark} aria-label={isDark ? t('theme.light') : t('theme.dark')} title={t('theme.toggle')}><span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span></button>;
}
