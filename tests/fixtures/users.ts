import type { User } from '@/lib/types';

const now = '2026-06-01T10:00:00Z';

export const patientUser: User = {
  id: 1,
  name: 'Ana Paciente',
  email: 'ana@example.com',
  roles: ['patient'],
  created_at: now,
  updated_at: now,
  linkedPatientIds: [],
};

export const professionalUser: User = {
  id: 2,
  name: 'Dra. Silva',
  email: 'dr@example.com',
  roles: ['professional'],
  created_at: now,
  updated_at: now,
  linkedPatientIds: [1],
};

export const superAdminUser: User = {
  id: 3,
  name: 'Admin',
  email: 'admin@example.com',
  roles: ['super_admin', 'admin'],
  created_at: now,
  updated_at: now,
};
