import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAnamnese } from '@/services/anamnese';
import { getReports } from '@/services/reports';
import { getUser, updateUserRoles } from '@/services/users';
import { patientUser, professionalUser } from '../fixtures/users';

const apiMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/api', () => ({ api: apiMock }));

describe('service-level security guards', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it('blocks patient anamnesis reads for another local user before the API request', async () => {
    await expect(getAnamnese(patientUser, 4)).rejects.toThrow('forbidden');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('blocks report reads for an unlinked patient before the API request', async () => {
    await expect(getReports(professionalUser, 4)).rejects.toThrow('forbidden');
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('blocks non-super-admin user and role administration before the API request', async () => {
    await expect(getUser(professionalUser, 1)).rejects.toThrow('forbidden');
    await expect(updateUserRoles(professionalUser, 1, ['patient'])).rejects.toThrow('forbidden');
    expect(apiMock).not.toHaveBeenCalled();
  });
});
