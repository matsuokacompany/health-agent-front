'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import Link from 'next/link';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';

// Keep this in sync with the date at the top of docs/legal/termos-de-uso.md
// in the backend repo — the backend records exactly this string alongside
// terms_accepted_at, so it must match the version actually being linked here.
const TERMS_VERSION = '2026-08-25';

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [phone, setPhone] = useState(formatBrazilianPhone(''));
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (password !== passwordConfirmation) {
      setFormError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);

    try {
      const result = await signUp({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone: toBrazilianPhoneDigits(phone),
        city,
        state,
        gender,
        birth_date: birthDate,
        cpf,
        terms_accepted: termsAccepted,
        terms_version: TERMS_VERSION,
      });
      if (result.status === 'confirmation_pending') setConfirmationPending(true);
      else router.replace('/patient');
    } catch (err) {
      setFormError(toFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationPending) {
    return (
      <main className="login-hero">
        <aside className="panel login-panel" aria-labelledby="signup-title">
          <div className="login-heading">
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
          <h1 id="signup-title">Criar conta</h1>
          <p className="muted">Cadastre-se para acompanhar seus próprios sintomas e sua evolução ao longo do tempo.</p>
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
                Telefone (WhatsApp)
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
                CPF
                <input
                  inputMode="numeric"
                  name="cpf"
                  onChange={(event) => setCpf(event.target.value)}
                  placeholder="000.000.000-00"
                  required
                  type="text"
                  value={cpf}
                />
              </label>
              <label>
                Data de nascimento
                <input
                  name="birth_date"
                  onChange={(event) => setBirthDate(event.target.value)}
                  required
                  type="date"
                  value={birthDate}
                />
              </label>
              <label>
                Gênero
                <select name="gender" onChange={(event) => setGender(event.target.value)} required value={gender}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="nao_binario">Não binário</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
              <label>
                Cidade
                <input
                  autoComplete="address-level2"
                  name="city"
                  onChange={(event) => setCity(event.target.value)}
                  required
                  type="text"
                  value={city}
                />
              </label>
              <label>
                Estado
                <input
                  autoComplete="address-level1"
                  name="state"
                  onChange={(event) => setState(event.target.value)}
                  placeholder="Estado"
                  required
                  type="text"
                  value={state}
                />
              </label>
            </div>
            <label className="checkbox-field">
              <input checked={termsAccepted} name="terms_accepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" />
              <span>
                {/* TODO: point these at the real published URLs once the institutional
                    site (a separate repo) has the Termos de Uso / Política de
                    Privacidade pages live — plain <a>, not next/link, since these
                    likely live on a different domain than app.julha.com.br. */}
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
