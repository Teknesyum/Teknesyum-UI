// teknesyum-ui template ustcubuk/react/ScaleSwitch.tsx
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import './titlebar.css';

export const SCALE_STEPS: readonly number[] = [0.9, 1, 1.1, 1.25, 1.4, 1.6];

export type ScaleSwitchLabels = {
  label: string;
  down: string;
  up: string;
  open: string;
  reset: string;
};

export const SCALE_SWITCH_LABELS: ScaleSwitchLabels = {
  label: 'Arayüz ölçeği',
  down: 'Küçült',
  up: 'Büyüt',
  open: 'Ölçeği ayarla',
  reset: 'Sıfırla',
};

function indexOf(steps: readonly number[], scale: number): number {
  const i = steps.indexOf(scale);
  if (i !== -1) return i;
  const one = steps.indexOf(1);
  return one === -1 ? 0 : one;
}

export function nextScale(scale: number, dir: number, steps: readonly number[] = SCALE_STEPS): number {
  const at = Math.min(steps.length - 1, Math.max(0, indexOf(steps, scale) + dir));
  return steps[at] ?? 1;
}

function percent(scale: number): string {
  return Math.round(scale * 100) + '%';
}

type Props = {
  scale: number;
  steps?: readonly number[];
  labels?: Partial<ScaleSwitchLabels>;
  onChange: (next: number) => void;
};

export function ScaleSwitch({ scale, steps = SCALE_STEPS, labels, onChange }: Props): ReactElement {
  const t = { ...SCALE_SWITCH_LABELS, ...labels };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);
  const [spot, setSpot] = useState<{ right: number; top: number } | null>(null);
  const group = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const down = nextScale(scale, -1, steps);
  const up = nextScale(scale, 1, steps);
  const at = draft ?? indexOf(steps, scale);
  const shown = steps[at] ?? 1;
  const placed = spot !== null;

  useLayoutEffect(() => {
    if (!open) return;
    const place = (): void => {
      const r = group.current?.getBoundingClientRect();
      if (r) setSpot({ right: window.innerWidth - r.right, top: r.bottom });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, scale]);

  useEffect(() => {
    if (!open) return;
    pop.current?.querySelector<HTMLElement>('input')?.focus();
    const close = (): void => {
      setOpen(false);
      setDraft(null);
    };
    const press = (e: PointerEvent): void => {
      const hit = e.target as Node;
      if (!pop.current?.contains(hit) && !group.current?.contains(hit)) close();
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    document.addEventListener('pointerdown', press);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', press);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, placed]);

  const commit = (): void => {
    if (draft === null) return;
    const next = steps[draft] ?? 1;
    setDraft(null);
    if (next !== scale) onChange(next);
  };

  return (
    <div ref={group} className="tk-scale" role="group" aria-label={t.label}>
      <button type="button" className="tk-scale__btn" aria-label={t.down} title={t.down} disabled={down === scale} onClick={() => onChange(down)}>
        −
      </button>
      <button
        type="button"
        className="tk-scale__btn tk-scale__value"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.open}
        title={t.open}
        onClick={() => setOpen((o) => !o)}
      >
        {percent(scale)}
      </button>
      <button type="button" className="tk-scale__btn" aria-label={t.up} title={t.up} disabled={up === scale} onClick={() => onChange(up)}>
        +
      </button>
      {open && spot
        ? createPortal(
            <div ref={pop} className="tk-panel tk-scale__pop" role="dialog" aria-label={t.label} style={spot}>
              <input
                type="range"
                className="tk-scale__range"
                min={0}
                max={steps.length - 1}
                step={1}
                value={at}
                aria-label={t.label}
                aria-valuetext={percent(shown)}
                onChange={(e) => setDraft(Number(e.target.value))}
                onPointerUp={commit}
                onKeyUp={commit}
                onBlur={commit}
              />
              <span className="tk-mono tk-scale__pct">{percent(shown)}</span>
              <button
                type="button"
                className="tk-btn tk-btn-ghost"
                title={t.reset}
                disabled={scale === 1 && draft === null}
                onClick={() => {
                  setDraft(null);
                  onChange(1);
                }}
              >
                {t.reset}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
