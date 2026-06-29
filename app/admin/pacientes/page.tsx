'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { RoleBadge } from '@/components/ui/badges';
import { TableSkeleton } from '@/components/ui/Loading';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';

export default function Page(){const[users,setUsers]=useState<User[]>([]);const[loading,setLoading]=useState(true);useEffect(()=>{setLoading(true);usersApi.list().then(u=>setUsers(u.filter(x=>x.roles.includes('patient')))).catch(()=>setUsers([])).finally(()=>setLoading(false));},[]);return <><div className="topbar"><h1>Pacientes</h1><Link className="button" href="/admin/pacientes/novo">Novo</Link></div>{loading?<TableSkeleton rows={5} columns={2}/>:<div className="table-wrap"><table><tbody>{users.map(u=><tr key={u.id}><td><Link href={`/admin/pacientes/${u.id}` as never}>{u.name}</Link><br/><span className="muted">{u.email}</span></td><td>{u.roles.map(r=><RoleBadge key={r} role={r}/>)}</td></tr>)}</tbody></table></div>}</>}
