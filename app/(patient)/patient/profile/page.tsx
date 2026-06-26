'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button, Card, PageHeader } from '@/components/ui/design';
import { usersApi } from '@/services/users';

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <label>{label}<input readOnly value={value ? String(value) : 'Não informado'} /></label>;
}

export default function PatientProfile() {
  const { user, refreshMe } = useAuth();
  const [msg, setMsg] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    await usersApi.update(Number(user.id), { phone: String(f.get('phone') || ''), city: String(f.get('city') || ''), state: String(f.get('state') || '') });
    await refreshMe();
    setMsg('Dados de contato atualizados.');
  }

  return <><PageHeader eyebrow="Perfil" title="Meus dados" description="Confira seus dados cadastrados. Por segurança, apenas telefone, cidade e estado podem ser alterados pelo paciente." />
    <form className="profile-layout" onSubmit={submit}><Card className="profile-card"><h2>Dados pessoais</h2><div className="form-grid"><Field label="Nome" value={user?.name} /><Field label="CPF" value={user?.cpf} /><Field label="E-mail" value={user?.email} /><Field label="Data de nascimento" value={user?.birth_date} /><Field label="Sexo" value={user?.gender} /><Field label="Convênio" value={(user as { health_plan?: string })?.health_plan} /></div></Card><Card className="profile-card"><h2>Contato editável</h2><label>Telefone<input name="phone" defaultValue={user?.phone ?? ''} /></label><div className="form-grid"><label>Cidade<input name="city" defaultValue={user?.city ?? ''} /></label><label>Estado<input name="state" defaultValue={user?.state ?? ''} /></label></div><Field label="Profissional responsável" value={user?.linkedPatientIds?.length ? 'Equipe vinculada' : 'Não informado'} /><Field label="Demais informações" value={user?.consent?.accepted_at ? `Consentimento aceito em ${user.consent.accepted_at}` : 'Sem informações adicionais'} /><Button type="submit">Salvar telefone, cidade e estado</Button>{msg ? <p className="notice success">{msg}</p> : null}</Card></form>
  </>;
}
