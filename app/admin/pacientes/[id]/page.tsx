'use client';
import { useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';
export default function Page(){const id=Number(useParams().id);const[u,setU]=useState<User|null>(null);useEffect(()=>{usersApi.get(id).then(setU)},[id]);return <><h1>{u?.name??'Paciente'}</h1><p className="muted">{u?.email}</p><nav className="nav"><a href={`/admin/pacientes/${id}/anamnese`}>Anamnese</a><a href={`/admin/pacientes/${id}/monitoramento`}>Monitoramento</a><a href={`/admin/pacientes/${id}/relatorios`}>Relatórios</a></nav></>}
