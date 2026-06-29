'use client';
import { useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/states';
import { anamnesesApi } from '@/services/anamnese';

function safeClinicalText(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const record = value as { info?: unknown; notes?: unknown; description?: unknown };
  return String(record.info ?? record.notes ?? record.description ?? '');
}

export default function Page(){const id=Number(useParams().id);const[info,setInfo]=useState('');const[loading,setLoading]=useState(true);useEffect(()=>{setLoading(true);anamnesesApi.byUser(id).then(a=>setInfo(safeClinicalText(a))).catch(()=>setInfo('')).finally(()=>setLoading(false))},[id]);return <><h1>Anamnese do paciente</h1>{loading?<CardSkeleton/>:info?<article className="card"><p className="readonly-clinical-text">{info}</p></article>:<EmptyState title="Anamnese não encontrada"/>}</>}
