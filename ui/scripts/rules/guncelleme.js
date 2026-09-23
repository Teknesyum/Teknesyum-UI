'use strict';

const fs = require('fs');
const path = require('path');

const GUNCELLER = /\bautoUpdater\b|electron-updater|plugin-updater|\bcheckForUpdates\b|['"]pull['"]/;
const UYGULAMA = /\b(?:electron|tauri)\b|@tauri-apps\//;
const KURULUM = /^kur-[a-z0-9-]+\.ps1$|^kur-usb\.ps1$/i;
const SOZLESME = /function\s+Adim\s*\(\s*\[int\]\s*\$y\s*,\s*\[int\]\s*\$t\s*,/;
const TAVAN = /\$S\.tavan/;
const ZAMAN = /\$zaman\.Interval\s*=\s*16\b/;
const RENK_SABIT = /#[0-9a-f]{3,8}\b/i;
const ROZET = /\.(?:tk-sync|basbar-senk)\b/;
const UZUN_CAGRI =
  /\binvoke\s*\(|ipcRenderer\.invoke\s*\(|\.spawn\s*\(|\bspawn\s*\(|new\s+Command\s*\(/;
const ILERLEME_GOSTERGESI = /progress|loading|busy|pending|aria-busy|role\s*=\s*["']?progressbar/i;
const ARKAPLAN_DONGUSU = /\bsetInterval\s*\(/;
const DURUM_GOSTERGESI = /role\s*=\s*["']?status|aria-live|badge|rozet|\bstate\b|\bdurum\b/i;
const WEB_KOD = ['.ts', '.tsx', '.js', '.jsx'];
const KOPRU_DOSYASI = /contextBridge\.exposeInMainWorld/;

function kok(ctx) {
  return ctx.root;
}

function dosyalar(ctx) {
  try {
    return fs.readdirSync(kok(ctx));
  } catch {
    return [];
  }
}

function kurulumBetigi(ctx) {
  return dosyalar(ctx).find((f) => KURULUM.test(f)) || null;
}

function uygulama(ctx) {
  const pkg = ctx.read('package.json');
  if (pkg && UYGULAMA.test(pkg)) return true;
  return dosyalar(ctx).some((f) => /\.csproj$/i.test(f));
}

function senkronYuzeyi(ctx) {
  if (!uygulama(ctx)) return null;
  for (const f of ctx.modules) if (GUNCELLER.test(String(f.text || ''))) return f.rel;
  return null;
}

function rozetDosyalari(ctx) {
  return ctx.files.filter((f) => f.ext === '.css' && ROZET.test(f.text));
}

module.exports = {
  id: 'guncelleme',

  fileRules: [
    {
      id: 'uzun-cagri-ilerlemesiz',
      severity: 'warn',
      exts: WEB_KOD,
      check(file, text) {
        if (KOPRU_DOSYASI.test(text)) return [];
        if (!UZUN_CAGRI.test(text)) return [];
        if (ILERLEME_GOSTERGESI.test(text)) return [];
        return [
          {
            line: 1,
            message:
              'this file makes a call that can take a while (invoke/ipcRenderer.invoke/spawn/Command) with no progress, loading or busy state anywhere in it.',
          },
        ];
      },
    },
    {
      id: 'sessiz-dongu',
      severity: 'warn',
      exts: WEB_KOD,
      check(file, text) {
        if (!ARKAPLAN_DONGUSU.test(text)) return [];
        if (DURUM_GOSTERGESI.test(text)) return [];
        return [
          {
            line: 1,
            message:
              'this file runs a background loop (setInterval) with no status indicator (role="status", aria-live, a badge) in it.',
          },
        ];
      },
    },
  ],

  projectRules: [
    {
      id: 'panel-yok',
      severity: 'error',
      check(ctx) {
        const yuzey = senkronYuzeyi(ctx);
        if (!yuzey) return [];
        if (kurulumBetigi(ctx)) return [];
        return [
          {
            file: yuzey,
            line: 0,
            message:
              'this project updates itself but carries no installer window: run scaffold.js kur <Name>.',
          },
        ];
      },
    },
    {
      id: 'panel-sozlesmesiz',
      severity: 'error',
      check(ctx) {
        const betik = kurulumBetigi(ctx);
        if (!betik) return [];
        let text = '';
        try {
          text = fs.readFileSync(path.join(kok(ctx), betik), 'utf8');
        } catch {
          return [];
        }
        const eksik = [];
        if (!SOZLESME.test(text)) eksik.push('the Adim(percent, ceiling, sentence) contract');
        if (!TAVAN.test(text)) eksik.push('the ceiling the bar creeps toward');
        if (!ZAMAN.test(text)) eksik.push('the 16 ms timer');
        if (!eksik.length) return [];
        return [
          {
            file: betik,
            line: 0,
            message:
              'the installer window misses ' +
              eksik.join(', ') +
              ': take it from scaffold.js kur, do not hand-write it.',
          },
        ];
      },
    },
    {
      id: 'rozet-token-disi',
      severity: 'error',
      check(ctx) {
        const out = [];
        for (const f of rozetDosyalari(ctx)) {
          const satirlar = f.text.split(/\r?\n/);
          for (let i = 0; i < satirlar.length; i++) {
            const satir = satirlar[i].replace(/\/\*.*?\*\//g, '');
            if (!RENK_SABIT.test(satir)) continue;
            out.push({
              file: f.rel,
              line: i + 1,
              message: 'the sync badge takes a fixed colour: use a --tk-* token.',
            });
          }
        }
        return out;
      },
    },
  ],
};
