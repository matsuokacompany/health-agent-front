'use client';
import { useEffect,useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { StatusBadge } from '@/components/ui/badges';
import { EmptyState } from '@/components/ui/states';
import type { DailyReport,MonitoringPlan } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';
export default function Page(){const{user}=useAuth();const[plans,setPlans]=useState<MonitoringPlan[]>([]);const[reports,setReports]=useState<DailyReport[]>([]);useEffect(()=>{if(user) monitoringApi.listPatientPlans(Number(user.id)).then(setPlans).catch(()=>setPlans([])); dailyReportsApi.list().then(setReports).catch(()=>setReports([]));},[user]);return <><h1>Monitoramento</h1><h2>Planos</h2>{plans.length?plans.map(p=><article className="card" key={p.id}>{p.name??'Plano de acompanhamento'} <span className="badge">{p.status??(p.active?'active':'inactive')}</span></article>):<EmptyState title="Monitoramento ainda não iniciado"/>}<h2>Check-ins</h2>{reports.map(r=><article className="card" key={r.id}><StatusBadge status={r.status}/></article>)}</>}
