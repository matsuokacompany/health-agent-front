'use client';

import { useEffect, useState } from 'react';
import { RoleBadge } from '@/components/ui/badges';
import { Button, Card } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { usersApi } from '@/services/users';
import type { Role } from '@/lib/types';
import { adminReportingApi, type AdminUser, type AdminUserStatus } from '@/services/adminReporting';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'patient', label: 'Paciente' },
  { value: 'professional', label: 'Profissional' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function StatusBadge({ status }: { status: AdminUserStatus }) {
  return <span className={`badge ${status === 'ACTIVE' ? 'success' : ''}`}>{status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>;
}

function EditRolesModal({ user, isSelf, onClose, onSaved }: { user: AdminUser; isSelf: boolean; onClose(): void; onSaved(roles: string[]): void }) {
  const [selected, setSelected] = useState<Role[]>(user.roles as Role[]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(role: Role) {
    if (isSelf && role === 'super_admin' && selected.includes(role)) return;
    setSelected((current) => (current.includes(role) ? current.filter((value) => value !== role) : [...current, role]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await usersApi.updateRoles(user.id, selected);
      onSaved(updated.roles ?? selected);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={`Papéis de ${user.name}`} onClose={onClose}>
      <div className="stack">
        {ROLE_OPTIONS.map((option) => (
          <label className="checkbox-field" key={option.value}>
            <input type="checkbox" checked={selected.includes(option.value)} disabled={isSelf && option.value === 'super_admin'} onChange={() => toggle(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
        {isSelf ? <p className="muted compact">Você não pode remover seu próprio papel de super admin.</p> : null}
        {selected.length === 0 ? <p className="notice danger">Selecione ao menos um papel.</p> : null}
        {error ? <p className="notice danger">{error}</p> : null}
        <div className="page-actions">
          <Button variant="secondary" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button disabled={saving || selected.length === 0} loading={saving} loadingLabel="Salvando..." onClick={() => void save()}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

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
            <thead><tr><th>Usuário</th><th>Papéis</th><th>Status</th><th>Criado em</th><th /></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><br /><span className="muted">{user.email}</span></td>
                  <td>{user.roles.map((userRole) => <RoleBadge key={userRole} role={userRole as Role} />)}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td>{formatDate(user.created_at)}</td>
                  <td><Button variant="ghost" onClick={() => setEditingUser(user)}>Editar papéis</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editingUser ? (
        <EditRolesModal
          user={editingUser}
          isSelf={String(currentUser?.id) === String(editingUser.id)}
          onClose={() => setEditingUser(null)}
          onSaved={(roles) => {
            setUsers((current) => current?.map((user) => (user.id === editingUser.id ? { ...user, roles } : user)) ?? current);
            setEditingUser(null);
          }}
        />
      ) : null}
    </>
  );
}
