import { ipcMain } from 'electron';
import { spawnSync } from 'node:child_process';

ipcMain.handle('build', () => spawnSync('npm', ['run', 'build']).status);
