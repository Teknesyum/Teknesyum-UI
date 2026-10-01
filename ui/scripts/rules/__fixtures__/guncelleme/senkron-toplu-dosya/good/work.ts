import { copyTree, removeTree } from './fstree';
import { BrowserWindow } from 'electron';

export async function install(from: string, to: string, win: BrowserWindow): Promise<void> {
  const tick = (done: number, total: number): void => win.webContents.send('work:progress', { done, total });
  await copyTree(from, to, tick);
  await removeTree(from, tick);
}
