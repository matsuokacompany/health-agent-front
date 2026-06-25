'use client';
import { FormEvent, useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { anamnesesApi } from '@/services/anamnese';
export default function Page(){const [info,setInfo]=useState(''); const [exists,setExists]=useState(false); useEffect(()=>{anamnesesApi.me().then(a=>{setInfo(String(a.info??''));setExists(true)}).catch(()=>setExists(false));},[]); async function submit(e:FormEvent){e.preventDefault(); exists?await anamnesesApi.updateMe({info}):await anamnesesApi.create({info}); setExists(true)} return <AppLayout><h1>Anamnese</h1><form className="card" onSubmit={submit}><label>Informações clínicas<textarea rows={10} value={info} onChange={e=>setInfo(e.target.value)}/></label><button>{exists?'Atualizar':'Criar'} anamnese</button></form></AppLayout>}
