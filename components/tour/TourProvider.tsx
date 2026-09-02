'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { TOUR_STEPS, tourStorageKey, type TourStep } from '@/lib/tour';

type TourContextValue = { startTour(): void; available: boolean };
const TourContext = createContext<TourContextValue>({ startTour() {}, available: false });
export const useTour = () => useContext(TourContext);

const VIEWPORT_MARGIN = 16;
const GAP = 16;

type TooltipPosition = { top: number; left: number };

function computePosition(rect: DOMRect | null, size: { width: number; height: number }): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxTop = Math.max(VIEWPORT_MARGIN, vh - size.height - VIEWPORT_MARGIN);
  const maxLeft = Math.max(VIEWPORT_MARGIN, vw - size.width - VIEWPORT_MARGIN);
  const centered = { top: clamp((vh - size.height) / 2, VIEWPORT_MARGIN, maxTop), left: clamp((vw - size.width) / 2, VIEWPORT_MARGIN, maxLeft) };

  if (!rect) return centered;

  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = vw - rect.right;
  const spaceLeft = rect.left;

  // Below/above suits most targets (buttons, cards, table rows). A tall,
  // narrow target like the sidebar rarely has room on either of those, so
  // it falls through to beside it instead -- which is also a better fit
  // there. Centered is the last resort, for whatever's left over.
  if (spaceBelow >= size.height + GAP) {
    return { top: clamp(rect.bottom + GAP, VIEWPORT_MARGIN, maxTop), left: clamp(rect.left + rect.width / 2 - size.width / 2, VIEWPORT_MARGIN, maxLeft) };
  }
  if (spaceAbove >= size.height + GAP) {
    return { top: clamp(rect.top - size.height - GAP, VIEWPORT_MARGIN, maxTop), left: clamp(rect.left + rect.width / 2 - size.width / 2, VIEWPORT_MARGIN, maxLeft) };
  }
  if (spaceRight >= size.width + GAP) {
    return { top: clamp(rect.top + rect.height / 2 - size.height / 2, VIEWPORT_MARGIN, maxTop), left: clamp(rect.right + GAP, VIEWPORT_MARGIN, maxLeft) };
  }
  if (spaceLeft >= size.width + GAP) {
    return { top: clamp(rect.top + rect.height / 2 - size.height / 2, VIEWPORT_MARGIN, maxTop), left: clamp(rect.left - size.width - GAP, VIEWPORT_MARGIN, maxLeft) };
  }
  return centered;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const steps = useMemo(() => TOUR_STEPS[pathname] ?? [], [pathname]);

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const autoStartedPathRef = useRef<string | null>(null);

  const step: TourStep | undefined = steps[stepIndex];

  const measure = useCallback(() => {
    const target = step?.target ? document.querySelector(step.target) : null;
    setRect(target ? target.getBoundingClientRect() : null);
  }, [step]);

  // A tour never survives a page change -- its steps target elements that
  // only exist on the page it was written for.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open || !step) return;
    if (step.target) document.querySelector(step.target)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    const timeout = window.setTimeout(measure, 260);
    return () => window.clearTimeout(timeout);
  }, [open, step, measure]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, measure]);

  useEffect(() => {
    if (!auth.user || !steps.length || autoStartedPathRef.current === pathname) return;
    autoStartedPathRef.current = pathname;
    try {
      if (!window.localStorage.getItem(tourStorageKey(pathname, auth.user.id))) {
        setStepIndex(0);
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) -- skip auto-start, the help button still works
    }
  }, [pathname, auth.user, steps.length]);

  function markSeen() {
    if (!auth.user) return;
    try { window.localStorage.setItem(tourStorageKey(pathname, auth.user.id), '1'); } catch { /* best-effort */ }
  }

  function startTour() {
    if (!steps.length) return;
    setStepIndex(0);
    setOpen(true);
  }
  function close() { setOpen(false); markSeen(); }
  function next() { if (stepIndex >= steps.length - 1) { close(); return; } setStepIndex((current) => current + 1); }
  function back() { setStepIndex((current) => Math.max(0, current - 1)); }

  const value = useMemo(() => ({ startTour, available: steps.length > 0 }), [steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return <TourContext.Provider value={value}>
    {children}
    {open && step ? <TourOverlay step={step} rect={rect} index={stepIndex} total={steps.length} onNext={next} onBack={back} onSkip={close} /> : null}
  </TourContext.Provider>;
}

function TourOverlay({ step, rect, index, total, onNext, onBack, onSkip }: { step: TourStep; rect: DOMRect | null; index: number; total: number; onNext(): void; onBack(): void; onSkip(): void }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const reposition = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPosition(computePosition(rect, { width, height }));
  }, [rect]);

  // Runs before paint, so the card never flashes at a stale spot when the
  // step (and therefore its own size) changes.
  useLayoutEffect(reposition, [reposition, step]);

  useEffect(() => {
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [reposition]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onSkip(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSkip]);

  const isLast = index === total - 1;
  const isFirst = index === 0;
  const spotlightRect = rect ?? { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

  return <div className="tour-overlay" role="dialog" aria-modal="true" aria-label={step.title}>
    <div className="tour-click-guard" />
    <div className="tour-spotlight" style={{ top: spotlightRect.top - 8, left: spotlightRect.left - 8, width: spotlightRect.width + 16, height: spotlightRect.height + 16 }} />
    <div ref={tooltipRef} className="tour-tooltip" style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}>
      <div className="tour-tooltip-body">
        <p className="tour-progress">{index + 1} de {total}</p>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </div>
      <div className="tour-actions">
        <button className="button ghost" type="button" onClick={onSkip}>Pular tour</button>
        <div className="tour-actions-nav">
          {!isFirst ? <button className="button secondary" type="button" onClick={onBack}>Voltar</button> : null}
          <button className="button" type="button" onClick={onNext}>{isLast ? 'Concluir' : 'Próximo'}</button>
        </div>
      </div>
    </div>
  </div>;
}
