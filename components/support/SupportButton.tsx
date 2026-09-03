'use client';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SUPPORT_SUBJECTS, supportApi, supportContactError } from '@/services/support';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function SupportButton() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(SUPPORT_SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function reset() {
    setSubject(SUPPORT_SUBJECTS[0]);
    setMessage('');
    setAttachment(null);
    setError(null);
    setSent(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function chooseAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Anexe uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }
    setError(null);
    setAttachment(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      setError('Escreva uma mensagem antes de enviar.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      await supportApi.sendContact({ subject, message: message.trim(), attachment });
      setSent(true);
      setMessage('');
      setAttachment(null);
    } catch (err) {
      setError(supportContactError(err));
    } finally {
      setSending(false);
    }
  }

  return <>
    <button className="button secondary icon-control" type="button" aria-label="Suporte" title="Falar com o suporte" onClick={() => setOpen(true)}><span aria-hidden="true">🆘</span></button>
    <Modal open={open} title="Falar com o suporte" onClose={close}>
      {sent ? (
        <div className="stack">
          <p className="notice success">Mensagem enviada! Nossa equipe vai responder pelo seu e-mail cadastrado.</p>
          <button className="button secondary" type="button" onClick={close}>Fechar</button>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted compact">Conte o que está acontecendo — respondemos por e-mail o quanto antes.</p>
          <label>
            Assunto
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              {SUPPORT_SUBJECTS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Mensagem
            <textarea rows={5} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Descreva o que aconteceu, o mais detalhado possível." />
          </label>
          <label>
            Anexar uma imagem (opcional)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAttachment} />
          </label>
          {attachment ? <p className="muted compact">📎 {attachment.name} — <button className="button ghost" type="button" onClick={() => setAttachment(null)}>remover</button></p> : null}
          {error ? <p className="notice danger">{error}</p> : null}
          <button className="button" disabled={sending} aria-busy={sending} type="submit">{sending ? <><span className="spinner" aria-hidden="true" />Enviando...</> : 'Enviar mensagem'}</button>
        </form>
      )}
    </Modal>
  </>;
}
