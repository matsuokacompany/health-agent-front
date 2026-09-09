'use client';
import { useTour } from './TourProvider';

export function TourButton() {
  const { startTour, available } = useTour();
  if (!available) return null;
  return <button className="nav-action" type="button" title="Tour guiado desta página" onClick={startTour}><span aria-hidden="true">❓</span><span className="sidebar-label">Tour guiado</span></button>;
}
