'use client';
import Link from 'next/link';

import { use } from 'react';

export default function PatientDetail({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);

  return (
    <>
        <div className="topbar"><span className="badge">Prontuário vinculado</span><Link href="/professional/patients">← Pacientes</Link></div>
        <header className="page-header"><span className="eyebrow">Visão 360°</span><h1>Prontuário do paciente</h1><p className="muted">Visualize informações clínicas relevantes para o acompanhamento.</p></header>
        <section className="grid"><article className="card"><span className="badge risk-moderado">Risco moderado</span><h2>Resumo clínico</h2><p className="muted">Card preparado para sinais vitais, sintomas e recomendações recentes.</p></article><article className="card"><span className="badge">Timeline</span><h2>Últimos eventos</h2><p className="muted">Histórico visual organizado para revisão médica rápida.</p></article></section>
    </>
  );
}
