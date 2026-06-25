'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import type { Anamnese, DailyReport, MonitoringPlan } from '@/lib/types';
import { anamnesesApi } from '@/services/anamnese';
import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';
function Page(){const {user}=useAuth(); const [plans,setPlans]=useState<MonitoringPlan[]>([]); const [reports,setReports]=useState<DailyReport[]>([]); const [hasAnamnese,setHasAnamnese]=useState(true); useEffect(()=>{if(!user)return; monitoringApi.listPatientPlans(Number(user.id)).then(setPlans).catch(()=>setPlans([])); dailyReportsApi.list().then(setReports).catch(()=>setReports([])); anamnesesApi.me().then((a:Anamnese)=>setHasAnamnese(Boolean(a))).catch(()=>setHasAnamnese(false));},[user]); const active=plans.find(p=>p.active||p.status==='active'); return <AppLayout><div className="topbar"><span className="badge">Área do paciente</span><a href="/change-password">Alterar senha</a></div><h1>Olá, {user?.name}</h1>{!user?.phone?<p className="notice danger">Complete seu telefone em Perfil para habilitar contatos operacionais.</p>:null}{!hasAnamnese?<p className="notice"><a href="/app/anamnese">Preencha sua anamnese</a> para iniciar acompanhamento clínico.</p>:null}<section className="grid"><article className="card"><h2>Dados</h2><p>{user?.email}</p><p className="muted">{user?.city}/{user?.state}</p></article><article className="card"><h2>Plano ativo</h2>{active?<p>{active.name ?? `Plano #${active.id}`}</p>:<EmptyState title="Monitoramento ainda não iniciado" />}</article><article className="card"><h2>WhatsApp</h2><p className={user?.phone?'success':'muted'}>{user?.phone?'Telefone cadastrado':'Aguardando telefone'}</p></article></section><h2>Últimos daily reports</h2>{reports.length?reports.slice(0,5).map(r=><article className="card" key={r.id}>#{r.id} <StatusBadge status={r.status}/><p className="muted">{r.report_date}</p></article>):<EmptyState description="Nenhum daily report recebido."/>}</AppLayout>}
export default Page;
