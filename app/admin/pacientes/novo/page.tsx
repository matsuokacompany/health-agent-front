'use client';
import { FormEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/services/users';
export default function Page(){const router=useRouter();const[err,setErr]=useState('');async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{const u=await usersApi.create({name:String(f.get('name')),email:String(f.get('email')),phone:String(f.get('phone')||''),roles:['patient']});router.push(`/admin/pacientes/${u.id}`)}catch(x){setErr(x instanceof Error?x.message:'Erro')}}return <><h1>Novo paciente</h1><form className="card" onSubmit={submit}><label>Nome<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Telefone<input name="phone"/></label><button>Criar paciente local</button>{err&&<p className="notice danger">{err}</p>}</form></>}
