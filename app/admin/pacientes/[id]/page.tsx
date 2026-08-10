'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';
import { ExceptionalReportRelease } from '@/components/admin/ExceptionalReportRelease';

export default function Page() {
  const id = Number(useParams().id);
  const [user, setUser] = useState<User | null>(null);
  const load = useCallback(() => usersApi.get(id).then(setUser), [id]);
  useEffect(() => { void load(); }, [load]);
  const patientId = typeof user?.patient_id === 'number' ? user.patient_id : id;
  return <><h1>{user?.name ?? 'Paciente'}</h1><p className="muted">{user?.email}</p><nav className="nav"><Link href={`/admin/pacientes/${id}/anamnese` as never}>Anamnese</Link><Link href={`/admin/pacientes/${id}/monitoramento` as never}>Monitoramento</Link><Link href={`/admin/pacientes/${id}/relatorios` as never}>Relatórios</Link></nav>{user ? <ExceptionalReportRelease patientId={patientId} patientName={user.name} patientEmail={user.email} nextGenerationAt={user.ai_report_next_generation_at} onReleased={load} /> : null}</>;
}
