'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import type { GeneratedReport, ReportPeriod } from '@/lib/types';
import { reportsApi } from '@/services/reports';
export default function Page(){const id=Number(useParams().id);const[periodo,setPeriodo]=useState<ReportPeriod>('semanal');const[out,setOut]=useState<GeneratedReport|null>(null);return <><h1>Relatórios do paciente #{id}</h1><div className="card"><select value={periodo} onChange={e=>setPeriodo(e.target.value as ReportPeriod)}><option value="diario">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select><button onClick={()=>reportsApi.generate(id,periodo).then(setOut)}>Gerar</button></div>{out&&<pre className="card">{JSON.stringify(out.relatorio,null,2)}</pre>}</>}
