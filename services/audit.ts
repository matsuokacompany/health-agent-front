import type { AuditLog } from '@/lib/types';

export const auditBuffer: AuditLog[] = [];

export function audit(user_id: string | number, action: string, resource: string) {
  auditBuffer.push({ user_id, action, resource, timestamp: new Date().toISOString() });
}
