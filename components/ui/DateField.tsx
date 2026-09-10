'use client';

import { useEffect, useId, useRef, useState } from 'react';

function isoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function maskInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

// Returns the ISO (yyyy-mm-dd) value for a complete, calendar-valid dd/mm/aaaa
// string, or null while the user is still typing / typed something impossible
// (e.g. 31/02) -- callers only commit the null case by leaving the field as-is.
function displayToIso(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (month < 1 || month > 12 || year < 1000) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

function CalendarPopover({
  value,
  min,
  max,
  onSelect,
}: {
  value: string;
  min?: string;
  max?: string;
  onSelect: (iso: string) => void;
}) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const validInitial = Number.isNaN(initial.getTime()) ? new Date() : initial;
  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const cellIso = (day: number) => `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
  const cells: Array<number | null> = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function changeMonth(delta: number) {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) { month = 11; year -= 1; } else if (month > 11) { month = 0; year += 1; }
    setViewMonth(month);
    setViewYear(year);
  }

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(firstOfMonth);
  const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="date-field-calendar" role="dialog" aria-label="Selecionar data">
      <div className="date-field-calendar-header">
        <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>‹</button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>›</button>
      </div>
      <div className="date-field-calendar-weekdays">{weekdayLabels.map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="date-field-calendar-grid">
        {cells.map((day, index) => {
          if (day === null) return <span key={index} />;
          const iso = cellIso(day);
          const disabled = Boolean((min && iso < min) || (max && iso > max));
          const selected = iso === value;
          return (
            <button
              key={index}
              type="button"
              className={`date-field-day${selected ? ' selected' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateField({
  id,
  name,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  ariaInvalid,
  ariaDescribedBy,
  placeholder = 'dd/mm/aaaa',
}: {
  id?: string;
  name?: string;
  /** ISO yyyy-mm-dd, or '' when empty -- same shape a native <input type="date"> would give. */
  value: string;
  onChange: (isoValue: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  // Only resync the visible text from the committed value -- while the user
  // is mid-edit, handleTextChange is the source of truth for `text`, and a
  // value that hasn't changed (e.g. a parent re-render) must not clobber an
  // in-progress, still-incomplete keystroke.
  useEffect(() => { setText(isoToDisplay(value)); }, [value]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleTextChange(raw: string) {
    const masked = maskInput(raw);
    setText(masked);
    const iso = displayToIso(masked);
    if (iso) onChange(iso);
  }

  function handleBlur() {
    // Whatever's left half-typed or invalid (31/02, "12/2") reverts to the
    // last value the parent actually committed, rather than leaving the
    // field showing something that was never a real date.
    if (!displayToIso(text)) setText(isoToDisplay(value));
  }

  function handleSelect(iso: string) {
    onChange(iso);
    setText(isoToDisplay(iso));
    setOpen(false);
  }

  return (
    <div className="date-field" ref={containerRef}>
      <input
        id={fieldId}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        maxLength={10}
        value={text}
        onChange={(event) => handleTextChange(event.target.value)}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="date-field-toggle"
        aria-label="Abrir calendário"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">📅</span>
      </button>
      {open ? <CalendarPopover value={value} min={min} max={max} onSelect={handleSelect} /> : null}
    </div>
  );
}
