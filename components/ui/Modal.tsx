'use client';

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="button ghost icon-button" type="button" onClick={onClose} aria-label="Fechar modal">×</button></div>{children}</section></div>;
}
