'use client';

import { useEffect, useState } from 'react';
import { RoleBadge } from '@/components/ui/badges';
import { Card } from '@/components/ui/design';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import type { Role } from '@/lib/types';
import { adminReportingApi, type AdminUser, type AdminUserStatus } from '@/services/adminReporting';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function StatusBadge({ status }: { status: AdminUserStatus }) {
  return <span className={`badge ${status === 'ACTIVE' ? 'success' : ''}`}>{status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminReportingApi.listUsers({
        role: role || undefined,
        status: (status as AdminUserStatus) || undefined,
        search: search || undefined,
      });
      setUsers(result);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [role, status]);

  const activeCount = users?.filter((user) => user.status === 'ACTIVE').length ?? 0;
  const inactiveCount = users?.filter((user) => user.status === 'INACTIVE').length ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Usuários</h1>
          <p className="muted">Todos os usuários da plataforma — pacientes, profissionais e administradores.</p>
        </div>
      </div>

      <section className="grid admin-metrics-grid">
        <article className="card"><span className="metric-label">Total</span><strong className="metric">{users?.length ?? '—'}</strong></article>
        <article className="card"><span className="metric-label">Ativos</span><strong className="metric">{activeCount}</strong></article>
        <article className="card"><span className="metric-label">Inativos</span><strong className="metric">{inactiveCount}</strong></article>
      </section>

      <Card className="admin-section-offset">
        <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label>
            Buscar por nome ou e-mail
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" />
          </label>
          <label>
            Papel
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">Todos</option>
              <option value="patient">Paciente</option>
              <option value="professional">Profissional</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </label>
          <button className="button" type="submit">Buscar</button>
        </form>
      </Card>

      {loading ? <LoadingState message="Carregando usuários..." /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && users?.length === 0 ? <EmptyState description="Nenhum usuário encontrado com esses filtros." /> : null}
      {!loading && !error && users?.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuário</th><th>Papéis</th><th>Status</th><th>Criado em</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><br /><span className="muted">{user.email}</span></td>
                  <td>{user.roles.map((userRole) => <RoleBadge key={userRole} role={userRole as Role} />)}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
