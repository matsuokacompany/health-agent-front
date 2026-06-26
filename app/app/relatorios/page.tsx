'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { GeneratedReport, ReportPeriod } from '@/lib/types';
import { reportsApi } from '@/services/reports';
export default function Page(){const{user}=useAuth();const[periodo,setPeriodo]=useState<ReportPeriod>('semanal');const[report,setReport]=useState<GeneratedReport|null>(null);return <><h1>Relatórios</h1><div className="card"><select value={periodo} onChange={e=>setPeriodo(e.target.value as ReportPeriod)}><option value="diario">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select><button onClick={()=>user&&reportsApi.generate(Number(user.id),periodo).then(setReport)}>Gerar</button></div>{report?<pre className="card">{typeof report.relatorio==='string'?report.relatorio:JSON.stringify(report.relatorio,null,2)}</pre>:null}</>}
