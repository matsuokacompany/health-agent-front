'use client';

import { InputHTMLAttributes, useId, useState } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  toggleLabel?: string;
  hideLabel?: string;
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" className="password-visibility-icon" fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="M2.75 12s3.25-6.25 9.25-6.25S21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      {hidden ? <path d="M4.5 19.5 19.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /> : null}
    </svg>
  );
}

export function PasswordInput({ label, toggleLabel = 'Mostrar senha', hideLabel = 'Ocultar senha', id, className, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const input = <span className="password-input-wrapper"><input {...props} id={inputId} className={className} type={visible ? 'text' : 'password'} /><button className="password-visibility-button" type="button" aria-label={visible ? hideLabel : toggleLabel} aria-pressed={visible} onClick={() => setVisible((current) => !current)}><EyeIcon hidden={!visible} /></button></span>;

  if (!label) return input;
  return <label htmlFor={inputId}>{label}{input}</label>;
}
