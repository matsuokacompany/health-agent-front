'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { FormEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/services/users';
import { Button } from '@/components/ui/design';
export default function Page(){const router=useRouter();const[err,setErr]=useState('');const[saving,setSaving]=useState(false);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);setSaving(true);try{const u=await usersApi.create({name:String(f.get('name')),email:String(f.get('email')),phone:String(f.get('phone')||''),roles:['patient']});router.push(`/admin/pacientes/${u.id}`)}catch(x){setErr(toFriendlyErrorMessage(x))}finally{setSaving(false)}}return <><h1>Novo paciente</h1><form className="card" onSubmit={submit}><label>Nome<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Telefone<input name="phone"/></label><Button type="submit" loading={saving} loadingLabel="Criando...">Criar paciente</Button>{err&&<p className="notice danger">{err}</p>}</form></>}
