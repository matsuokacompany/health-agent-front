import type { ProfessionalObservation } from '@/components/patient/ProfessionalObservations';

export function getMockProfessionalObservations(): ProfessionalObservation[] {
  return [
    { id: 'mock-1', professionalName: 'Dr. João Silva', date: '12/06/2026', text: 'Paciente apresentou melhora.' },
  ];
}
