import type { Anamnese, User } from '@/lib/types';
import { canAccessPatient, sanitizeClinicalText } from '@/lib/rbac';
import { api } from './api';
import { audit } from './audit';

export async function saveAnamnese(user: User, data: Anamnese) {
  if (!canAccessPatient(user, data.user_id)) throw new Error('forbidden');
  const safe = { ...data, info: sanitizeClinicalText(data.info) };
  audit(user.id, 'anamnese.write', `anamnese:${data.id}`);
  return api<Anamnese>('/api/anamneses/me', { method: 'PUT', body: JSON.stringify(safe) });
}

export async function getAnamnese(user: User, patientId: number) {
  if (!canAccessPatient(user, patientId)) throw new Error('forbidden');
  audit(user.id, 'anamnese.read', `patient:${patientId}`);
  return api<Anamnese>('/api/anamneses/me');
}
