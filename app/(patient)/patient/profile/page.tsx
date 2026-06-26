'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Button, Card, PageHeader } from '@/components/ui/design';
import { usersApi } from '@/services/users';

type PatientExtraFields = {
  address?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  health_plan?: string | null;
  insurance?: string | null;
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <label>{label}<input readOnly value={value ? String(value) : 'Não informado'} /></label>;
}

export default function PatientProfile() {
  const { user, refreshMe } = useAuth();
  const { plans } = usePatientData();
  const [msg, setMsg] = useState('');
  const extra = user as (typeof user & PatientExtraFields);
  const professionals = useMemo(() => plans.flatMap((plan) => plan.professionals ?? []).map((professional) => professional.name || professional.specialty || `Profissional #${professional.id}`), [plans]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    await usersApi.update(Number(user.id), { phone: String(f.get('phone') || ''), city: String(f.get('city') || ''), state: String(f.get('state') || '') });
    await refreshMe();
    setMsg('Telefone, cidade e estado atualizados.');
  }

  return <><PageHeader eyebrow="Perfil" title="Meus dados" description="Confira todos os dados cadastrados. Por segurança, apenas telefone, cidade e estado podem ser alterados pelo paciente." />
    <form className="profile-layout" onSubmit={submit}><Card className="profile-card"><h2>Dados pessoais</h2><div className="form-grid"><Field label="Nome" value={user?.name} /><Field label="CPF" value={user?.cpf} /><Field label="E-mail" value={user?.email} /><Field label="Data de nascimento" value={user?.birth_date} /><Field label="Sexo" value={user?.gender} /><Field label="ID local" value={user?.id} /></div></Card><Card className="profile-card"><h2>Contato editável</h2><label>Telefone<input name="phone" defaultValue={user?.phone ?? ''} /></label><div className="form-grid"><label>Cidade<input name="city" defaultValue={user?.city ?? ''} /></label><label>Estado<input name="state" defaultValue={user?.state ?? ''} /></label></div><Button type="submit">Salvar telefone, cidade e estado</Button>{msg ? <p className="notice success">{msg}</p> : null}</Card><Card className="profile-card"><h2>Endereço e convênio</h2><div className="form-grid"><Field label="Endereço" value={extra?.address ?? extra?.street} /><Field label="Bairro" value={extra?.neighborhood} /><Field label="CEP" value={extra?.zip_code} /><Field label="Cidade" value={user?.city} /><Field label="Estado" value={user?.state} /><Field label="Convênio" value={extra?.health_plan ?? extra?.insurance} /></div></Card><Card className="profile-card"><h2>Acompanhamento</h2><div className="form-grid"><Field label="Profissional responsável" value={professionals.length ? professionals.join(', ') : 'Não informado'} /><Field label="Papéis" value={user?.roles?.join(', ')} /><Field label="Criado em" value={user?.created_at} /><Field label="Atualizado em" value={user?.updated_at} /><Field label="ID Supabase" value={user?.supabase_user_id} /><Field label="Consentimento" value={user?.consent?.accepted_at ? `Aceito em ${user.consent.accepted_at}` : 'Não informado'} /></div></Card></form>
  </>;
}
