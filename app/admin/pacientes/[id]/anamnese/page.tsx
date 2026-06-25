'use client';
import { useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { anamnesesApi } from '@/services/anamnese';
export default function Page(){const id=Number(useParams().id);const[info,setInfo]=useState('');useEffect(()=>{anamnesesApi.byUser(id).then(a=>setInfo(JSON.stringify(a,null,2))).catch(()=>setInfo('Sem anamnese.'))},[id]);return <AdminLayout><h1>Anamnese do paciente #{id}</h1><pre className="card">{info}</pre></AdminLayout>}
