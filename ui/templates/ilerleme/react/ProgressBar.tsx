import type { CSSProperties } from 'react';
import './progressbar.css';

export type ProgressStatus = 'running' | 'done' | 'error';

type Props = {
  percent: number;
  step: string;
  status?: ProgressStatus;
  label?: string;
};

type ProgressStyle = CSSProperties & { '--tk-progress-value'?: number };

export function ProgressBar({ percent, step, status = 'running', label }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  const whole = Math.round(clamped);
  const style: ProgressStyle = { '--tk-progress-value': clamped / 100 };

  return (
    <div className="tk-progress" data-status={status}>
      <span className="tk-progress__step">{step}</span>
      <div className="tk-progress__row">
        <div
          className="tk-progress__track"
          role="progressbar"
          aria-valuenow={whole}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className="tk-progress__fill" style={style} />
        </div>
        <span className="tk-progress__percent">{whole}%</span>
      </div>
    </div>
  );
}
