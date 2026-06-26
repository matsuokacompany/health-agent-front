'use client';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button, PageHeader } from '@/components/ui/design';
import { usersApi } from '@/services/users';

export default function Page() {
  const { user, refreshMe } = useAuth();
  const [msg, setMsg] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    await usersApi.update(Number(user.id), { name: String(f.get('name')), phone: String(f.get('phone') || ''), city: String(f.get('city') || ''), state: String(f.get('state') || '') });
    await refreshMe();
    setMsg('Perfil atualizado.');
  }

  return <AppLayout><PageHeader title="Perfil" description="Mantenha dados simples e atualizados para facilitar o contato da equipe de cuidado." /><form className="card form-card" onSubmit={submit}><label>Nome<input name="name" defaultValue={user?.name} /></label><label>Telefone<input name="phone" defaultValue={user?.phone ?? ''} /></label><div className="form-grid"><label>Cidade<input name="city" defaultValue={user?.city ?? ''} /></label><label>Estado<input name="state" defaultValue={user?.state ?? ''} /></label></div><Button type="submit">Salvar alterações</Button>{msg && <p className="notice success">{msg}</p>}</form></AppLayout>;
}
