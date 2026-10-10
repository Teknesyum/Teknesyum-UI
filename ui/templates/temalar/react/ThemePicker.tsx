// teknesyum-ui template temalar/react/ThemePicker.tsx
import { useRef, type KeyboardEvent, type ReactElement } from 'react';
import { THEMES, type Theme } from './theme';
import './themepicker.css';

type Props = {
  value: string;
  label?: string;
  themes?: readonly Theme[];
  disabled?: boolean;
  onChange: (id: string) => void;
};

const DOTS = ['renk-1', 'renk-2', 'renk-3'] as const;

export function ThemePicker({ value, label = 'Tema', themes = THEMES, disabled = false, onChange }: Props): ReactElement {
  const group = useRef<HTMLDivElement>(null);
  const found = themes.findIndex((th) => th.id === value);
  const at = found === -1 ? 0 : found;

  const move = (e: KeyboardEvent<HTMLDivElement>): void => {
    const last = themes.length - 1;
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? at === last ? 0 : at + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? at === 0 ? last : at - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    const next = themes[to];
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus();
  };

  return (
    <div ref={group} className="tk-themes" role="radiogroup" aria-label={label} onKeyDown={move}>
      {themes.map((th, i) => (
        <button
          key={th.id}
          type="button"
          role="radio"
          className="tk-theme"
          aria-checked={i === at}
          tabIndex={i === at ? 0 : -1}
          title={th.ad}
          disabled={disabled}
          style={{ background: th.black, color: th.text }}
          onClick={() => onChange(th.id)}
        >
          <span className="tk-theme__dots" aria-hidden="true">
            {DOTS.map((d) => (
              <span key={d} className="tk-theme__dot" style={{ background: th[d] }} />
            ))}
          </span>
          <span className="tk-theme__name">{th.ad}</span>
          <svg className="tk-theme__check" viewBox="0 0 11 9" aria-hidden="true" focusable="false">
            <path d="M1 5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
