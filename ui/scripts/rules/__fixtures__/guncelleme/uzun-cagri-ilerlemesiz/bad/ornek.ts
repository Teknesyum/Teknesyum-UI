import { invoke } from '@tauri-apps/api/core';

export async function disaAktar() {
  return invoke('export_all');
}
