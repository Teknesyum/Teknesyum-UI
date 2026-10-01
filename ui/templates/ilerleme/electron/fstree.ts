// teknesyum-ui template ilerleme/electron/fstree.ts
import { copyFile, mkdir, readdir, rm, rmdir } from 'node:fs/promises';
import path from 'node:path';

export type Tick = (done: number, total: number) => void;

const LANES = 32;

async function walk(root: string): Promise<{ files: string[]; dirs: string[] }> {
  const files: string[] = [];
  const dirs: string[] = [];
  const queue = [root];
  for (let dir = queue.shift(); dir !== undefined; dir = queue.shift()) {
    dirs.push(dir);
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else files.push(full);
    }
  }
  return { files, dirs };
}

export async function pool<T>(items: T[], run: (item: T) => Promise<void>, tick?: Tick): Promise<void> {
  let next = 0;
  let done = 0;
  const lane = async (): Promise<void> => {
    for (let i = next++; i < items.length; i = next++) {
      const item = items[i];
      if (item === undefined) continue;
      await run(item);
      done += 1;
      tick?.(done, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(LANES, items.length) }, lane));
}

export async function copyTree(from: string, to: string, tick?: Tick): Promise<void> {
  const { files, dirs } = await walk(from);
  for (const dir of dirs) await mkdir(path.join(to, path.relative(from, dir)), { recursive: true });
  await pool(files, (file) => copyFile(file, path.join(to, path.relative(from, file))), tick);
}

export async function removeTree(root: string, tick?: Tick): Promise<void> {
  const { files, dirs } = await walk(root).catch(() => ({ files: [] as string[], dirs: [] as string[] }));
  await pool(files, (file) => rm(file, { force: true }), tick);
  for (const dir of dirs.reverse()) await rmdir(dir).catch(() => rm(dir, { recursive: true, force: true }));
}
