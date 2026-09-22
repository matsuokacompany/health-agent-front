'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CaretRight, Info, SignOut, User } from '@phosphor-icons/react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/components/i18n/I18nProvider';

// Brazilian convention: address people by their first name, not a full name
// or a generic "Perfil" label -- the menu still opens the same profile page,
// this only changes what's shown on the trigger.
function firstName(fullName: string | undefined | null): string | null {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed.split(/\s+/)[0] : null;
}

type ProfileMenuProps = { profileHref: string; footerHref: string; footerLabel: string; onNavigate?: () => void };

/** Replaces the sidebar's separate "Perfil" and "Sair" links with a single
 * dropdown under the person's own name, opening as a flyout to the right of
 * the sidebar (mirrors LanguageSwitcher's click-outside/Escape handling,
 * but positioned beside the trigger instead of below it -- opening below
 * would overlap the rest of the sidebar in that narrow column). */
export function ProfileMenu({ profileHref, footerHref, footerLabel, onNavigate }: ProfileMenuProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const profileLabel = firstName(user?.name) ?? t('nav.profile');

  useEffect(() => {
    function onPointerDown(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, []);

  function choose() {
    setOpen(false);
    onNavigate?.();
  }

  return <div className="sidebar-profile-menu" ref={ref}>
    <button className="nav-action" type="button" aria-haspopup="menu" aria-expanded={open} title={t('nav.profile')} onClick={() => setOpen((current) => !current)}>
      <User aria-hidden="true" size={20} weight="duotone" /><span className="sidebar-label">{profileLabel}</span><CaretRight aria-hidden="true" size={14} weight="bold" className="sidebar-profile-caret" />
    </button>
    {open ? <div className="sidebar-profile-flyout" role="menu">
      <Link role="menuitem" href={profileHref as never} onClick={choose}><Info aria-hidden="true" size={18} weight="duotone" />{t('nav.viewInfo')}</Link>
      <Link role="menuitem" href={footerHref as never} onClick={choose}><SignOut aria-hidden="true" size={18} weight="duotone" />{footerLabel}</Link>
    </div> : null}
  </div>;
}
