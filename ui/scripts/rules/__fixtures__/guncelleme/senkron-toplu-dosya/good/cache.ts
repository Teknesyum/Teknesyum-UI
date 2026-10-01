import { rmSync } from 'node:fs';

export function clearCache(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
