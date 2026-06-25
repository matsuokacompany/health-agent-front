'use client';
import { FormEvent,useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { MonitoringPlan } from '@/lib/types';
import { monitoringApi } from '@/services/monitoring';
export default function Page(){const id=Number(useParams().id);const[plans,setPlans]=useState<MonitoringPlan[]>([]);const load=()=>monitoringApi.listPatientPlans(id).then(setPlans).catch(()=>setPlans([]));useEffect(load,[id]);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await monitoringApi.createPlan({patient_id:id,name:String(f.get('name')),active:true});load()}return <AdminLayout><h1>Monitoramento #{id}</h1><form className="card" onSubmit={submit}><label>Nome do plano<input name="name" required/></label><button>Criar plano</button></form>{plans.map(p=><article className="card" key={p.id}>{p.name??`Plano #${p.id}`}</article>)}</AdminLayout>}
