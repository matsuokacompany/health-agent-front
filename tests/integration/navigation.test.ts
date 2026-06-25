import { describe, expect, it } from 'vitest';
import { roleHome } from '@/lib/rbac';
import { listPatients } from '@/services/patients';
import { mockUsers } from '@/lib/mockData';

describe('role navigation and data loading', () => {
  it('routes patient role to patient home', () => {
    expect(roleHome.patient).toBe('/patient/dashboard');
  });

  it('loads only linked patients for professional', async () => {
    const patients = await listPatients(mockUsers[1]);
    expect(patients.map((p) => p.id)).toEqual([1]);
  });
});
