// teknesyum-ui template durum/react/UpdateBadge.tsx
import type { MouseEvent } from 'react';
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
