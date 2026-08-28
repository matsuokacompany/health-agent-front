'use client';
import { useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/services/notifications';
import type { AppNotification } from '@/lib/types';

const POLL_INTERVAL_MS = 60_000;

function formatRelative(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} d`;
}

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function load() {
    notificationsApi.list()
      .then((result) => { setItems(result.items); setUnreadCount(result.unread_count); })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try {
        await notificationsApi.markAllRead();
        setUnreadCount(0);
        setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
      } catch {
        // best-effort: unread count just stays as-is until the next poll
      }
    }
  }

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="button secondary icon-control"
        type="button"
        aria-label="Notificações"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notificações"
        onClick={() => void handleOpen()}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 ? <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>
      {open ? (
        <div className="notification-menu" role="menu">
          {items.length ? items.map((item) => (
            <div className={`notification-menu-item${item.read_at ? '' : ' is-unread'}`} key={item.id} role="menuitem">
              <p>{item.message}</p>
              <span className="muted">{formatRelative(item.created_at)}</span>
            </div>
          )) : <p className="muted notification-menu-empty">Nenhuma notificação por aqui.</p>}
        </div>
      ) : null}
    </div>
  );
}
