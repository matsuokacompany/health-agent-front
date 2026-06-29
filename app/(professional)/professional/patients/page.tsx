'use client';
import Link from 'next/link';

import { useAuth } from '@/components/auth/AuthProvider';

function PatientsContent() {
  const { user } = useAuth();

  return <><div className="topbar"><span className="badge">⚕️ Painel médico</span></div><header className="page-header"><span className="eyebrow">Acompanhamento</span><h1>Pacientes em acompanhamento</h1><p className="muted">Acompanhe pacientes vinculados e priorize casos que precisam de atenção.</p></header><section className="grid"><article className="card"><span className="badge risk-alto">Prioritário</span><h2>Fila de risco</h2><p className="muted">Casos críticos ficam visualmente destacados para acelerar a tomada de decisão.</p><Link className="button" href="/professional/patients/1">Ver prontuário</Link></article><article className="card"><span className="badge">Coorte</span><div className="metric">128</div><p className="muted">pacientes vinculados à equipe clínica.</p></article><article className="card"><span className="badge success">SLA</span><div className="metric">96%</div><p className="muted">check-ins revisados dentro do prazo.</p></article></section></>;
}

export default function Patients() {
  return <PatientsContent />;
}
