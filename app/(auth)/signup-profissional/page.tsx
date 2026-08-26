'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import Link from 'next/link';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLogo } from '@/components/ui/AuthLogo';
import { documentValidationError, formatCpfCnpj, toDocumentDigits } from '@/lib/document';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';

// Keep this in sync with the date at the top of docs/legal/termos-de-uso.md
// in the backend repo, and with app/(auth)/signup/page.tsx's own constant.
const TERMS_VERSION = '2026-08-25';

const DETAIL_MESSAGES: Record<string, string> = {
  'Email already registered': 'Este e-mail já está cadastrado.',
  'Phone already registered': 'Este telefone já está cadastrado.',
  'CPF already registered': 'Este CPF/CNPJ já está cadastrado.',
  'License already registered': 'Já existe um profissional cadastrado com esse número e estado de registro.',
  'CNPJ not found': 'Não encontramos esse CNPJ na Receita Federal. Confira o número digitado.',
  CNPJ_LOOKUP_UNAVAILABLE: 'Não foi possível verificar o CNPJ agora. Tente novamente em alguns instantes.',
};

function signupErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const payload = err.payload as { detail?: unknown } | undefined;
    const detail = payload?.detail;
    if (typeof detail === 'string' && DETAIL_MESSAGES[detail]) return DETAIL_MESSAGES[detail];
    if (Array.isArray(detail)) {
      const cpfError = detail.some((item) => Array.isArray((item as { loc?: unknown[] }).loc) && (item as { loc: unknown[] }).loc.includes('cpf'));
      if (cpfError) return 'CPF ou CNPJ inválido. Confira o número digitado.';
    }
  }
  return toFriendlyErrorMessage(err);
}

export default function SignupProfissional() {
  const router = useRouter();
  const { signUpProfessional } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState(formatBrazilianPhone(''));
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const documentError = documentValidationError(cpfCnpj);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (password !== passwordConfirmation) {
      setFormError('As senhas não coincidem.');
      return;
    }
    if (documentError) return;
    setSubmitting(true);

    try {
      const result = await signUpProfessional({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone: toBrazilianPhoneDigits(phone),
        cpf: toDocumentDigits(cpfCnpj),
        specialty,
        license_number: licenseNumber,
        license_state: licenseState,
        terms_accepted: termsAccepted,
        terms_version: TERMS_VERSION,
      });
      if (result.status === 'confirmation_pending') setConfirmationPending(true);
      else router.replace('/professional');
    } catch (err) {
      setFormError(signupErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationPending) {
    return (
      <main className="login-hero">
        <aside className="panel login-panel" aria-labelledby="signup-title">
          <div className="login-heading">
            <AuthLogo />
            <h1 id="signup-title">Verifique seu e-mail</h1>
            <p className="muted">Enviamos um link de confirmação para {email}. Clique nele para ativar sua conta e continuar.</p>
          </div>
          <Link href="/login">Voltar para o login</Link>
        </aside>
      </main>
    );
  }

  return (
    <main className="login-hero">
      <aside className="panel login-panel signup-panel-wide" aria-labelledby="signup-title">
        <div className="login-heading">
          <AuthLogo />
          <h1 id="signup-title">Criar conta de profissional</h1>
          <p className="muted">Cadastre-se para acompanhar seus pacientes na Julha. Contas novas precisam de uma assinatura ativa para cadastrar pacientes e gerar relatórios de IA.</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-fields">
            <label>
              Nome completo
              <input autoComplete="name" name="name" onChange={(event) => setName(event.target.value)} placeholder="Seu nome" required type="text" value={name} />
            </label>
            <label>
              E-mail
              <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required type="email" value={email} />
            </label>
            <PasswordInput autoComplete="new-password" label="Senha" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" required value={password} />
            <PasswordInput autoComplete="new-password" label="Confirmar senha" minLength={8} name="password_confirmation" onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Repita a senha" required value={passwordConfirmation} />
            <div className="signup-fields-grid">
              <label>
                Telefone
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  name="phone"
                  onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
                  placeholder="+55 (11) 91234-5678"
                  required
                  type="tel"
                  value={phone}
                />
              </label>
              <label>
                CPF ou CNPJ
                {documentError ? <span className="field-error">{documentError}</span> : null}
                <input
                  aria-invalid={Boolean(documentError)}
                  inputMode="numeric"
                  name="cpf_cnpj"
                  onChange={(event) => setCpfCnpj(formatCpfCnpj(event.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                  type="text"
                  value={cpfCnpj}
                />
              </label>
              <label>
                Especialidade
                <input
                  name="specialty"
                  onChange={(event) => setSpecialty(event.target.value)}
                  placeholder="Ex.: Nutrição, Endocrinologia"
                  required
                  type="text"
                  value={specialty}
                />
              </label>
              <label>
                Número do registro profissional
                <input
                  inputMode="numeric"
                  name="license_number"
                  onChange={(event) => setLicenseNumber(event.target.value)}
                  placeholder="Ex.: 12345"
                  required
                  type="text"
                  value={licenseNumber}
                />
              </label>
              <label>
                Estado do registro
                <input
                  autoComplete="address-level1"
                  name="license_state"
                  onChange={(event) => setLicenseState(event.target.value)}
                  placeholder="Ex.: PR"
                  required
                  type="text"
                  value={licenseState}
                />
              </label>
            </div>
            <label className="checkbox-field">
              <input checked={termsAccepted} name="terms_accepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" />
              <span>
                Li e concordo com os{' '}
                <a href="/termos-de-uso" rel="noopener noreferrer" target="_blank">Termos de Uso</a> e a{' '}
                <a href="/politica-de-privacidade" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>.
              </span>
            </label>
          </div>
          {formError ? <p className="notice danger">{formError}</p> : null}
          <div className="login-actions">
            <button className="button" disabled={submitting} type="submit">{submitting ? 'Criando conta...' : 'Criar conta'}</button>
            <Link href="/login">Já tenho conta</Link>
          </div>
        </form>
      </aside>
    </main>
  );
}
