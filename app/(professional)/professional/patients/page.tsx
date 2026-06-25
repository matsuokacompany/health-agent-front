'use client';

import { RequireRole } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function PatientsContent() {
  const { user } = useAuth();

  return <main><div className="nav"><span className="badge">Profissional</span><a href="/logout">Sair</a></div><h1>Dashboard médico</h1><p className="muted">Profissional local #{user?.id}. Vínculos e pacientes devem vir do FastAPI usando Authorization: Bearer &lt;supabase_access_token&gt;.</p></main>;
}

export default function Patients() {
  return <RequireRole role="professional"><PatientsContent /></RequireRole>;
}
