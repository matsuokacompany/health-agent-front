'use client';

import { InputHTMLAttributes, useId, useState } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  toggleLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({ label, toggleLabel = 'Mostrar senha', hideLabel = 'Ocultar senha', id, className, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const input = <span className="password-input-wrapper"><input {...props} id={inputId} className={className} type={visible ? 'text' : 'password'} /><button className="password-visibility-button" type="button" aria-label={visible ? hideLabel : toggleLabel} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>{visible ? 'Ocultar' : 'Mostrar'}</button></span>;

  if (!label) return input;
  return <label htmlFor={inputId}>{label}{input}</label>;
}
