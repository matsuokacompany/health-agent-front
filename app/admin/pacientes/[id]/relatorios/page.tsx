'use client';
import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import type { GeneratedReport, ReportPeriod } from '@/lib/types';
import { reportsApi } from '@/services/reports';

export default function Page(){const id=Number(useParams().id);const[periodo,setPeriodo]=useState<ReportPeriod>('semanal');const[out,setOut]=useState<GeneratedReport|null>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState('');async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError('');try{setOut(await reportsApi.generate(id,periodo))}catch(err){setError(toFriendlyErrorMessage(err))}finally{setLoading(false)}}return <><h1>Relatórios do paciente</h1><form className="card" onSubmit={submit}><label>Período<select value={periodo} onChange={e=>setPeriodo(e.target.value as ReportPeriod)}><option value="diario">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select></label><Button type="submit" loading={loading} loadingLabel="Gerando...">Gerar</Button></form>{error?<p className="notice danger">{error}</p>:null}{out&&<article className="card"><pre>{typeof out.relatorio==='string'?out.relatorio:JSON.stringify(out.relatorio,null,2)}</pre></article>}</>}
