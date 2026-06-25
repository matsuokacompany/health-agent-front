'use client';
import { useEffect,useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RoleBadge } from '@/components/ui/badges';
import type { User } from '@/lib/types';
import { usersApi } from '@/services/users';
export default function Page(){const[users,setUsers]=useState<User[]>([]);useEffect(()=>{usersApi.list().then(u=>setUsers(u.filter(x=>x.roles.includes('patient')))).catch(()=>setUsers([]));},[]);return <AdminLayout><div className="topbar"><h1>Pacientes</h1><a className="button" href="/admin/pacientes/novo">Novo</a></div><div className="table-wrap"><table><tbody>{users.map(u=><tr key={u.id}><td><a href={`/admin/pacientes/${u.id}`}>{u.name}</a><br/><span className="muted">{u.email}</span></td><td>{u.roles.map(r=><RoleBadge key={r} role={r}/>)}</td></tr>)}</tbody></table></div></AdminLayout>}
