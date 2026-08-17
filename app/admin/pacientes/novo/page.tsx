'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { FormEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/services/users';
import { Button } from '@/components/ui/design';
import { MaskedInput } from '@/components/ui/MaskedInput';
export default function Page(){const router=useRouter();const[err,setErr]=useState('');const[saving,setSaving]=useState(false);async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);setSaving(true);setErr('');try{const u=await usersApi.create({name:String(f.get('name')).trim(),email:String(f.get('email')).trim().toLowerCase(),phone:String(f.get('phone')||''),roles:['patient']});router.push(`/admin/pacientes/${u.id}`)}catch(x){setErr(toFriendlyErrorMessage(x))}finally{setSaving(false)}}return <><h1>Novo paciente</h1><form className="card" onSubmit={submit}><label>Nome<input autoComplete="name" maxLength={120} name="name" required/></label><label>E-mail<input autoCapitalize="none" autoComplete="email" maxLength={254} name="email" spellCheck={false} type="email" required/></label><label>Telefone<MaskedInput autoComplete="tel" inputMode="tel" mask="phone" maxLength={19} name="phone" placeholder="+55 (11) 99999-9999"/></label><Button type="submit" loading={saving} loadingLabel="Criando...">Criar paciente</Button>{err&&<p className="notice danger" role="alert">{err}</p>}</form></>}
