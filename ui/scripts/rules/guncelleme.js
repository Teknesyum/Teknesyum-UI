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
const ROZET = /\.(?:tk-sync|tk-update|basbar-senk)\b/;
const UZUN_CAGRI =
  /\binvoke\s*\(|ipcRenderer\.invoke\s*\(|\.spawn\s*\(|\bspawn\s*\(|new\s+Command\s*\(/;
const ILERLEME_GOSTERGESI = /progress|loading|busy|pending|aria-busy|role\s*=\s*["']?progressbar/i;
const ARKAPLAN_DONGUSU = /\bsetInterval\s*\(/;
const DURUM_GOSTERGESI = /role\s*=\s*["']?status|aria-live|badge|rozet|\bstate\b|\bdurum\b/i;
const WEB_KOD = ['.ts', '.tsx', '.js', '.jsx'];
const KOPRU_DOSYASI = /contextBridge\.exposeInMainWorld/;
const TOPLU_SENKRON = /\b(cpSync|rmSync)\s*\([^)]*recursive\s*:\s*true/g;
const ILERLEME_OLAYI = /webContents\.send|onProgress|\btick\s*\(|['"][\w:-]*progress['"]/;
const SURUM_OGESI = />\s*(?:[Vv]ersion\s*:?\s*|v)\{[^{}]*[Vv]ersion[^{}]*\}\s*<\/([A-Za-z][\w.]*)\s*>/g;
const SURUM_METNI = /(?:textContent|innerText|innerHTML)\s*=[^;\n]*(?:`v\$\{[^}]*[Vv]ersion|['"]v['"]\s*\+[^;\n]*[Vv]ersion)/g;
const DUGME_ISARETI = /<button\b|createElement\(\s*['"]button['"]|role\s*=\s*["'{]?\s*['"]?button/;
const XAML_SURUM_YAZISI = /<TextBlock\b[^>]*\bText="(?:v\d[^"]*|[^"]*\{Binding[^}]*[Vv]ersion[^}]*\}[^"]*)"[^>]*>/g;
const XAML_SURUM_DUGMESI = /<Button\b[^>]*\bContent="[^"]*[Vv]ersion[^"]*"[^>]*>/g;
const SURUM_WEB = ['.tsx', '.jsx', '.html', '.htm'];
const SURUM_XAML = ['.axaml', '.xaml'];
const SURUM_KOD = ['.ts', '.tsx', '.js', '.jsx'];

const SABLON = /teknesyum-ui template ([\w./-]+)(?:\s*·\s*düzen (\d+))?/;
const DUZENLI = new Set(['kur/kur.ps1', 'kur/avalonia/KurulumEkrani.axaml', 'kur/avalonia/KurulumEkrani.axaml.cs', 'durum/avalonia/GuncellemePaneli.axaml', 'durum/avalonia/GuncellemePaneli.axaml.cs']);
const SABLONLAR = path.join(__dirname, '..', '..', 'templates');
const guncelDuzen = {};

function duzenOku(text) {
  const m = SABLON.exec(String(text).slice(0, 300));
  if (!m || !DUZENLI.has(m[1])) return null;
  return { sablon: m[1], duzen: Number(m[2] || 1) };
}

function standart(sablon) {
  if (!(sablon in guncelDuzen)) {
    let d = null;
    try {
      const o = duzenOku(fs.readFileSync(path.join(SABLONLAR, sablon), 'utf8'));
      d = o ? o.duzen : null;
    } catch {}
    guncelDuzen[sablon] = d;
  }
  return guncelDuzen[sablon];
}

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
      id: 'surum-tetik',
      severity: 'warn',
      exts: [...SURUM_WEB, ...SURUM_XAML, ...SURUM_KOD],
      check(file, text) {
        const line = (i) => text.slice(0, i).split('\n').length;
        const out = [];
        const say = (i, why) =>
          out.push({
            line: line(i),
            message: 'the version text is ' + why + ': make it a button named update.check that checks for an update on click.',
          });
        const ext = path.extname(file).toLowerCase();
        if (SURUM_WEB.includes(ext)) {
          for (const m of text.matchAll(SURUM_OGESI)) {
            const tag = m[1];
            const open = text.lastIndexOf('<' + tag, m.index);
            const attrs = open < 0 ? '' : text.slice(open, m.index);
            if (tag.toLowerCase() !== 'button') say(m.index, 'shown in a <' + tag + '>, not a button');
            else if (!/\bon[cC]lick\s*=/.test(attrs)) say(m.index, 'a button with no click handler');
            else if (!/\baria-label\s*=/.test(attrs)) say(m.index, 'a button with no accessible name');
          }
        }
        if (SURUM_KOD.includes(ext) && !DUGME_ISARETI.test(text)) {
          for (const m of text.matchAll(SURUM_METNI)) say(m.index, 'written as plain text');
        }
        if (SURUM_XAML.includes(ext)) {
          for (const m of text.matchAll(XAML_SURUM_YAZISI)) {
            const before = text.slice(0, m.index);
            const inButton = (before.match(/<Button\b/g) || []).length > (before.match(/<\/Button>/g) || []).length;
            if (!inButton) say(m.index, 'a TextBlock outside any Button');
          }
          for (const m of text.matchAll(XAML_SURUM_DUGMESI)) {
            if (!/\b(?:Click|Command)\s*=/.test(m[0])) say(m.index, 'a button with no click handler');
            else if (!/AutomationProperties\.Name\s*=/.test(m[0])) say(m.index, 'a button with no accessible name');
          }
        }
        return out;
      },
    },
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
      id: 'senkron-toplu-dosya',
      severity: 'warn',
      exts: WEB_KOD,
      check(file, text) {
        if (!ILERLEME_OLAYI.test(text)) return [];
        const out = [];
        for (const m of text.matchAll(TOPLU_SENKRON)) {
          out.push({
            line: text.slice(0, m.index).split('\n').length,
            message:
              m[1] + ' with recursive in a file that reports progress: a synchronous bulk file call blocks the event loop, so progress events never reach the screen. Walk the tree and run copyFile/rm through an async pool (templates/ilerleme/electron/fstree.ts).',
          });
        }
        return out;
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
      id: 'eski-duzen',
      severity: 'warn',
      check(ctx) {
        if (path.resolve(kok(ctx)) === path.resolve(SABLONLAR, '..', '..')) return [];
        const adaylar = [];
        for (const f of ctx.files) if (f.ext === '.axaml' || f.ext === '.cs') adaylar.push({ rel: f.rel, text: f.text });
        for (const ad of dosyalar(ctx)) {
          if (!KURULUM.test(ad)) continue;
          try {
            adaylar.push({ rel: ad, text: fs.readFileSync(path.join(kok(ctx), ad), 'utf8') });
          } catch {}
        }
        const out = [];
        for (const a of adaylar) {
          const o = duzenOku(a.text);
          if (!o) continue;
          const std = standart(o.sablon);
          if (!std || o.duzen >= std) continue;
          const komut = o.sablon.startsWith('kur/') ? 'scaffold.js kur <Ad> (same --kaynak/--depo/--varlik)' : 'scaffold.js durum';
          out.push({
            file: a.rel,
            line: 1,
            message:
              'generated from ' + o.sablon + ' layout ' + o.duzen + ', the standard is layout ' + std +
              ': delete the generated files and run ' + komut + ' again.',
          });
        }
        return out;
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
              message: 'the badge takes a fixed colour: use a --tk-* token.',
            });
          }
        }
        return out;
      },
    },
  ],
};
