// teknesyum-ui template durum/react/UpdateBadge.tsx
import { useRef, useState, type MouseEvent } from 'react';
import './update.css';

export type UpdateBadgePhase = 'available' | 'downloading' | 'ready';

export type UpdateBadgeLabels = {
  available: string;
  downloadingPercent: (percent: number) => string;
  ready: string;
  availableAria: (version: string) => string;
  downloadingAria: (percent: number) => string;
  readyAria: string;
  downloadTitle: string;
  installTitle: string;
};

export const UPDATE_BADGE_LABELS: UpdateBadgeLabels = {
  available: 'Güncelleme',
  downloadingPercent: (percent) => 'İniyor %' + percent,
  ready: 'Hazır, kur',
  availableAria: (version) => 'Yeni sürüm ' + version + ' var, indirmek için tıkla',
  downloadingAria: (percent) => 'Güncelleme iniyor, yüzde ' + percent,
  readyAria: 'Güncelleme yüklemeye hazır, kurmak için tıkla',
  downloadTitle: 'İndir',
  installTitle: 'Yükle',
};

type Props = {
  phase: UpdateBadgePhase | null | undefined;
  percent: number;
  version?: string;
  labels?: Partial<UpdateBadgeLabels>;
  onOpen: (opener: HTMLElement) => void;
};

export function UpdateBadge({ phase, percent, version, labels, onOpen }: Props) {
  const t = { ...UPDATE_BADGE_LABELS, ...labels };
  if (phase !== 'available' && phase !== 'downloading' && phase !== 'ready') return null;
  const n = Math.floor(Math.min(100, Math.max(0, percent)));
  const text = phase === 'ready' ? t.ready : phase === 'downloading' ? t.downloadingPercent(n) : t.available;
  const name = phase === 'ready' ? t.readyAria : phase === 'downloading' ? t.downloadingAria(n) : t.availableAria(version ?? '');
  return (
    <button
      type="button"
      className="tk-update"
      data-step={phase === 'ready' ? 'install' : 'download'}
      aria-label={name}
      aria-haspopup="dialog"
      title={phase === 'ready' ? t.installTitle : t.downloadTitle}
      onClick={(e: MouseEvent<HTMLButtonElement>) => onOpen(e.currentTarget)}
    >
      {text}
    </button>
  );
}

const TOAST_MAX = 3;

export type VersionCheck =
  | { state: 'current' }
  | { state: 'available'; latest?: string; notes?: string }
  | { state: 'error'; message?: string };

export type VersionButtonLabels = {
  check: string;
  current: (version: string) => string;
  error: (reason: string) => string;
};

export const VERSION_BUTTON_LABELS: VersionButtonLabels = {
  check: 'Güncellemeleri denetle',
  current: (version) => 'Güncel sürümdesiniz (' + version + ')',
  error: (reason) => 'Güncelleme denetlenemedi' + (reason ? ': ' + reason : ''),
};

type VersionProps = {
  version: string;
  check: () => Promise<VersionCheck>;
  install: (found: VersionCheck) => void;
  askFirst?: boolean;
  ask?: (found: VersionCheck, opener: HTMLElement) => void;
  labels?: Partial<VersionButtonLabels>;
  toastMs?: number;
};

export function VersionButton({ version, check, install, askFirst, ask, labels, toastMs = 6000 }: VersionProps) {
  const t = { ...VERSION_BUTTON_LABELS, ...labels };
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: 'success' | 'danger' }[]>([]);
  const next = useRef(0);

  const show = (text: string, tone: 'success' | 'danger') => {
    const id = next.current++;
    setToasts((list) => [...list, { id, text, tone }].slice(-TOAST_MAX));
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), toastMs);
  };

  const run = async (opener: HTMLElement) => {
    if (busy) return;
    setBusy(true);
    try {
      const found = await check();
      if (found.state === 'current') show(t.current(version), 'success');
      else if (found.state === 'error') show(t.error(found.message ?? ''), 'danger');
      else if (askFirst && ask) ask(found, opener);
      else install(found);
    } catch (e) {
      show(t.error(e instanceof Error ? e.message : String(e)), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="tk-version"
        aria-label={t.check}
        aria-busy={busy || undefined}
        title={t.check}
        onClick={(e: MouseEvent<HTMLButtonElement>) => void run(e.currentTarget)}
      >
        {version}
      </button>
      {toasts.length ? (
        <div className="tk-toast-stack">
          {toasts.map((x) => (
            <div key={x.id} className={'tk-toast tk-toast-' + x.tone} role="status">
              {x.text}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
