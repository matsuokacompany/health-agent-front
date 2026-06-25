'use client';

import { use } from 'react';
import { RequireRole } from '@/components/auth/guards';

export default function PatientDetail({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);

  return (
    <RequireRole role="professional">
      <main>
        <div className="topbar"><span className="badge">Prontuário vinculado</span><a href="/professional/patients">← Pacientes</a></div>
        <header className="page-header"><span className="eyebrow">Visão 360°</span><h1>Paciente local #{patientId}</h1><p className="muted">Todas as regras de negócio e vínculos clínicos permanecem no FastAPI.</p></header>
        <section className="grid"><article className="card"><span className="badge risk-moderado">Risco moderado</span><h2>Resumo clínico</h2><p className="muted">Card preparado para sinais vitais, sintomas e recomendações recentes.</p></article><article className="card"><span className="badge">Timeline</span><h2>Últimos eventos</h2><p className="muted">Histórico visual organizado para revisão médica rápida.</p></article></section>
      </main>
    </RequireRole>
  );
}
