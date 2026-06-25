import { describe, expect, it } from 'vitest';
import { getPatient } from '@/services/patients';
import { createReport } from '@/services/symptoms';
import { patientUser, professionalUser } from '../fixtures/users';

describe('security access controls', () => {
  it('patient cannot read another patient via service before any API request', async () => {
    await expect(getPatient(patientUser, 4)).rejects.toThrow('forbidden');
  });

  it('professional cannot access unlinked patient before any API request', async () => {
    await expect(getPatient(professionalUser, 4)).rejects.toThrow('forbidden');
  });

  it('blocks report creation for another local user before any API request', async () => {
    await expect(createReport(patientUser, { id: 'x', user_id: 4, report_date: '2026-06-19', check_type: 'daily', symptom_description: 'Dor', had_symptoms: true, completed: true })).rejects.toThrow('forbidden');
  });
});
