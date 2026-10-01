// teknesyum-ui template durum/react/UpdatePanel.tsx
import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import './update.css';

export type UpdatePhase = 'available' | 'downloading' | 'ready' | 'installing' | 'error';

export type UpdateState = {
  phase: UpdatePhase;
  percent: number;
  latest?: string;
  notes?: string;
  message?: string;
  dryRun?: boolean;
};

export type UpdatePanelLabels = {
  title: string;
  versionLabel: string;
  notesLabel: string;
  dryRun: string;
  available: string;
  downloading: string;
  ready: string;
  installing: string;
  failed: (reason: string) => string;
  downloadInstall: string;
  download: string;
  cancel: string;
  install: string;
  close: string;
  retry: string;
  progress: string;
};

export const UPDATE_PANEL_LABELS: UpdatePanelLabels = {
  title: 'Güncelleme',
  versionLabel: 'Yeni sürüm',
  notesLabel: 'Notlar',
  dryRun: 'Prova kipi',
  available: 'Yeni sürüm yayımlandı, indirmek ister misin?',
  downloading: 'Yeni sürüm iniyor, çalışmana devam edebilirsin.',
  ready: 'Yeni sürüm indi, yüklemeye hazır.',
  installing: 'Yükleniyor…',
  failed: (reason) => 'Güncelleme başarısız oldu: ' + reason,
  downloadInstall: 'İndir ve yükle',
  download: 'İndir',
  cancel: 'İptal',
  install: 'Yükle',
  close: 'Kapat',
  retry: 'Yeniden dene',
  progress: 'Güncelleme ilerlemesi',
};

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Ceiling per step: a step may not claim more than its own share of the bar. */
function useStepCeiling(percent: number): number {
  const last = useRef({ percent, step: 0 });
  if (percent > last.current.percent) last.current = { percent, step: percent - last.current.percent };
  else if (percent < last.current.percent) last.current = { percent, step: 0 };
  return Math.min(100, percent + last.current.step);
}

/** 16 ms refresh: fast approach to the real percent, slow creep to the ceiling while running. */
function useCeilingPercent(percent: number, ceiling: number, running: boolean): number {
  const [shown, setShown] = useState(percent);
  const shownRef = useRef(percent);
  const target = useRef({ percent, ceiling, running });
  target.current = { percent, ceiling, running };

  useEffect(() => {
    const reduce = reducedMotion();
    const id = window.setInterval(() => {
      const { percent: p, ceiling: c, running: r } = target.current;
      let next = shownRef.current;
      if (reduce) next = Math.max(next, p);
      else if (next < p) next = Math.min(p, next + Math.max(0.2, (p - next) * 0.08));
      else if (r && next < c - 0.5) next += (c - next) * 0.006;
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  return shown;
}

function tokenMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith('ms') ? n : n * 1000;
}

/** Mirrors forms.css's own data-tk-giriyor / data-tk-kapaniyor transition contract. */
function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [entering, setEntering] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      if (reducedMotion()) {
        setEntering(false);
        return;
      }
      setEntering(true);
      const frame = requestAnimationFrame(() => setEntering(false));
      return () => cancelAnimationFrame(frame);
    }
    if (!mounted) return;
    if (reducedMotion()) {
      setMounted(false);
      return;
    }
    setClosing(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, tokenMs('--tk-t-fast', 160));
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { mounted, entering, closing };
}

function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  returnTo: HTMLElement | null | undefined,
  initial?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const first = initial?.current ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    first?.focus();
    return () => {
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, [active, ref, returnTo, initial]);

  return (e: KeyboardEvent<HTMLElement>, onEscape: () => void) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const node = ref.current;
    if (!node) return;
    const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };
}

function Bar({ percent, running, label }: { percent: number; running: boolean; label: string }) {
  const ceiling = useStepCeiling(percent);
  const shown = useCeilingPercent(percent, ceiling, running);
  const value = Math.min(100, Math.max(0, shown));
  return (
    <div className="update-panel__progress" data-status={running ? 'running' : 'done'}>
      <div className="update-panel__progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="update-panel__progress-fill" style={{ transform: 'scaleX(' + value / 100 + ')' }} />
      </div>
      <span className="update-panel__progress-percent tk-mono">%{Math.floor(value)}</span>
    </div>
  );
}

type Props = {
  open: boolean;
  state: UpdateState | null;
  returnTo?: HTMLElement | null;
  labels?: Partial<UpdatePanelLabels>;
  onClose: () => void;
  onDownload: (andInstall: boolean) => void;
  onCancel: () => void;
  onInstall: () => void;
  onCheck: () => void;
};

export function UpdatePanel({ open, state, returnTo, labels, onClose, onDownload, onCancel, onInstall, onCheck }: Props) {
  const t = { ...UPDATE_PANEL_LABELS, ...labels };
  const visible = open && !!state;
  const { mounted, entering, closing } = usePresence(visible);
  const ref = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const onKey = useDialogFocus(ref, visible, returnTo, primaryRef);

  useEffect(() => {
    primaryRef.current?.focus();
  }, [state?.phase]);

  if (!mounted || !state) return null;
  const p = state.phase;

  const text =
    p === 'downloading' ? t.downloading : p === 'ready' ? t.ready : p === 'installing' ? t.installing : p === 'error' ? t.failed(state.message ?? '') : t.available;
  const version = state.latest ?? '';
  const withBar = p === 'downloading' || p === 'ready' || p === 'installing';

  const giriyor = entering ? '1' : undefined;
  const kapaniyor = closing ? '1' : undefined;

  return createPortal(
    <div className="tk-modal-scrim" data-tk-modal="update" data-tk-giriyor={giriyor} data-tk-kapaniyor={kapaniyor}>
      <div
        ref={ref}
        className="tk-modal update-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-phase={p}
        data-tk-giriyor={giriyor}
        data-tk-kapaniyor={kapaniyor}
        onKeyDown={(e) => onKey(e, () => (p === 'installing' ? undefined : onClose()))}
      >
        <div className="update-panel__head">
          <h2 id={titleId} className="tk-h3 update-panel__title">
            {t.title}
          </h2>
          {state.dryRun ? <span className="update-panel__dry">{t.dryRun}</span> : null}
        </div>

        <div className="update-panel__body">
          <p className="update-panel__status" aria-live="polite" data-tone={p === 'error' ? 'danger' : undefined}>
            {text}
          </p>
          {version ? (
            <div className="update-panel__version">
              <span className="tk-label">{t.versionLabel}</span>
              <span className="tk-mono">{version}</span>
            </div>
          ) : null}
          {p === 'available' && state.notes ? (
            <div className="update-panel__notes">
              <span className="tk-label">{t.notesLabel}</span>
              <p className="update-panel__notes-text">{state.notes}</p>
            </div>
          ) : null}
        </div>

        {withBar ? (
          <Bar percent={p === 'ready' || p === 'installing' ? 100 : Math.min(100, Math.max(0, state.percent))} running={p !== 'ready'} label={t.progress} />
        ) : null}

        <div className="update-panel__actions">
          {p === 'available' ? (
            <>
              <button ref={primaryRef} type="button" className="tk-btn tk-btn-primary" onClick={() => onDownload(true)}>
                {t.downloadInstall}
              </button>
              <button type="button" className="tk-btn tk-btn-ghost" onClick={() => onDownload(false)}>
                {t.download}
              </button>
              <button type="button" className="tk-btn tk-btn-ghost" onClick={onClose}>
                {t.cancel}
              </button>
            </>
          ) : p === 'downloading' ? (
            <button ref={primaryRef} type="button" className="tk-btn tk-btn-ghost" onClick={onCancel}>
              {t.cancel}
            </button>
          ) : p === 'ready' ? (
            <>
              <button ref={primaryRef} type="button" className="tk-btn tk-btn-primary" onClick={onInstall}>
                {t.install}
              </button>
              <button type="button" className="tk-btn tk-btn-ghost" onClick={onClose}>
                {t.close}
              </button>
            </>
          ) : p === 'error' ? (
            <>
              <button ref={primaryRef} type="button" className="tk-btn tk-btn-primary" onClick={onCheck}>
                {t.retry}
              </button>
              <button type="button" className="tk-btn tk-btn-ghost" onClick={onClose}>
                {t.close}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
