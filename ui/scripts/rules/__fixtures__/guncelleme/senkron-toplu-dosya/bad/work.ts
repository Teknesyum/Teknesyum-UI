import { cpSync, rmSync } from 'node:fs';
import { BrowserWindow } from 'electron';

export function install(from: string, to: string, win: BrowserWindow): void {
  win.webContents.send('work:progress', { percent: 0 });
  cpSync(from, to, { recursive: true });
  rmSync(from, { recursive: true, force: true });
  win.webContents.send('work:progress', { percent: 100 });
}
