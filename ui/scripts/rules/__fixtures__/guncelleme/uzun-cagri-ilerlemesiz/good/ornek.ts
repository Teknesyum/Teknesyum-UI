import { invoke } from '@tauri-apps/api/core';

export async function disaAktar(setBusy: (v: boolean) => void) {
  setBusy(true);
  try {
    return await invoke('export_all');
  } finally {
    setBusy(false);
  }
}
