'use client';
import { useTour } from './TourProvider';

export function TourButton() {
  const { startTour, available } = useTour();
  if (!available) return null;
  return <button className="button secondary icon-control" type="button" aria-label="Ajuda" title="Ajuda: tour guiado desta página" onClick={startTour}><span aria-hidden="true">❓</span></button>;
}
