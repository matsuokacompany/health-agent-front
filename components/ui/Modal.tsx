'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export function Modal({ open, title, children, onClose, className = '' }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; className?: string }) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', keydown);
    dialogRef.current?.querySelector<HTMLElement>('button, [href], input, textarea, select')?.focus();
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  // Rendered via a portal to document.body: this modal can be opened from
  // inside the sticky header, which has backdrop-filter applied. That
  // creates a new CSS containing block for position:fixed descendants, so
  // without the portal the backdrop centers inside the thin header bar
  // instead of the viewport.
  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section ref={dialogRef} className={`modal-card ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="button ghost icon-button" type="button" onClick={onClose} aria-label="Fechar modal">×</button></div>{children}</section></div>,
    document.body,
  );
}
