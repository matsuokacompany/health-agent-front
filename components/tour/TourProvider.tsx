'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, type AuthContextValue } from '@/components/auth/AuthProvider';
import { TOUR_HOME_FOR_ROLE, TOUR_STEPS, tourStorageKey, type TourRole, type TourStep } from '@/lib/tour';

type TourContextValue = { startTour(): void; available: boolean };
const TourContext = createContext<TourContextValue>({ startTour() {}, available: false });
export const useTour = () => useContext(TourContext);

function roleFor(auth: AuthContextValue): TourRole | null {
  if (auth.isSuperAdmin) return 'admin';
  if (auth.isProfessional) return 'professional';
  if (auth.isPatient) return 'patient';
  return null;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const role = roleFor(auth);
  const steps = useMemo(() => (role ? TOUR_STEPS[role] : []), [role]);

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const autoStartedRef = useRef(false);
  const pendingStartRef = useRef(false);

  const step: TourStep | undefined = steps[stepIndex];

  const measure = useCallback(() => {
    const target = step?.target ? document.querySelector(step.target) : null;
    setRect(target ? target.getBoundingClientRect() : null);
  }, [step]);

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

  // Resume a tour requested from a page other than the role's home once
  // navigation there lands -- steps target elements that only exist on that
  // page (the professional patients table, the patient's symptom chart...).
  useEffect(() => {
    if (!pendingStartRef.current || !role) return;
    if (pathname === TOUR_HOME_FOR_ROLE[role]) {
      pendingStartRef.current = false;
      setStepIndex(0);
      setOpen(true);
    }
  }, [pathname, role]);

  useEffect(() => {
    if (!role || !auth.user || autoStartedRef.current || pathname !== TOUR_HOME_FOR_ROLE[role]) return;
    autoStartedRef.current = true;
    try {
      if (!window.localStorage.getItem(tourStorageKey(role, auth.user.id))) {
        setStepIndex(0);
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) -- skip auto-start, the help button still works
    }
  }, [role, auth.user, pathname]);

  function markSeen() {
    if (!role || !auth.user) return;
    try { window.localStorage.setItem(tourStorageKey(role, auth.user.id), '1'); } catch { /* best-effort */ }
  }

  function startTour() {
    if (!role || !steps.length) return;
    if (pathname !== TOUR_HOME_FOR_ROLE[role]) {
      pendingStartRef.current = true;
      router.push(TOUR_HOME_FOR_ROLE[role] as never);
      return;
    }
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
    <div className={`tour-tooltip ${rect ? '' : 'is-centered'}`.trim()}>
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
