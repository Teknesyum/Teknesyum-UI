// teknesyum-ui template ilerleme/electron/work.ts
import { BrowserWindow } from 'electron';

export type WorkStatus = 'running' | 'done' | 'error';

export type WorkEvent = {
  task: string;
  step: string;
  percent: number;
  done?: number;
  total?: number;
  status: WorkStatus;
};

export const WORK_CHANNEL = 'work:progress';

export class Work {
  private percent = -1;
  private step = '';

  constructor(private readonly task: string) {}

  at(step: string, from: number, to: number, done = 0, total = 0): void {
    const share = total > 0 ? Math.min(1, done / total) : 0;
    const percent = Math.floor(from + (to - from) * share);
    if (percent === this.percent && step === this.step) return;
    this.percent = percent;
    this.step = step;
    this.emit({ task: this.task, step, percent, done, total, status: 'running' });
  }

  ticker(step: string, from: number, to: number): (done: number, total: number) => void {
    return (done, total) => this.at(step, from, to, done, total);
  }

  finish(ok: boolean): void {
    this.emit({ task: this.task, step: this.step, percent: 100, status: ok ? 'done' : 'error' });
  }

  private emit(event: WorkEvent): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(WORK_CHANNEL, event);
    }
  }
}
