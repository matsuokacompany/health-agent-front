'use client';
import Link from 'next/link';
export default function Page(){return <><h1>Dashboard administrativo</h1><section className="grid"><article className="card"><h2>Pacientes</h2><p className="muted">Cadastre pacientes, consulte anamneses, planos e relatórios.</p><Link className="button" href="/admin/pacientes">Abrir</Link></article><article className="card"><h2>Profissionais</h2><p className="muted">Listagem de profissionais em preparação.</p></article><article className="card"><h2>WhatsApp</h2><p className="muted">Configurações operacionais em preparação.</p></article></section></>}
