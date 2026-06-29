'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';
export default function Page(){const id=Number(useParams().id);const[u,setU]=useState<User|null>(null);useEffect(()=>{usersApi.get(id).then(setU)},[id]);return <><h1>{u?.name??'Paciente'}</h1><p className="muted">{u?.email}</p><nav className="nav"><Link href={`/admin/pacientes/${id}/anamnese` as never}>Anamnese</Link><Link href={`/admin/pacientes/${id}/monitoramento` as never}>Monitoramento</Link><Link href={`/admin/pacientes/${id}/relatorios` as never}>Relatórios</Link></nav></>}
