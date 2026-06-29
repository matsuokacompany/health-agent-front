'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { RoleBadge } from '@/components/ui/badges';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';
export default function Page(){const[users,setUsers]=useState<User[]>([]);useEffect(()=>{usersApi.list().then(u=>setUsers(u.filter(x=>x.roles.includes('patient')))).catch(()=>setUsers([]));},[]);return <><div className="topbar"><h1>Pacientes</h1><Link className="button" href="/admin/pacientes/novo">Novo</Link></div><div className="table-wrap"><table><tbody>{users.map(u=><tr key={u.id}><td><Link href={`/admin/pacientes/${u.id}` as never}>{u.name}</Link><br/><span className="muted">{u.email}</span></td><td>{u.roles.map(r=><RoleBadge key={r} role={r}/>)}</td></tr>)}</tbody></table></div></>}
