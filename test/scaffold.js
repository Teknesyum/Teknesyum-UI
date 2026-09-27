'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

function scaffold(root, args) {
  return L.node(L.SCAFFOLD, args.concat(['--project', root]), { env: L.cleanEnv() });
}

function parsesInPowerShell(file) {
  if (process.platform !== 'win32') return true;
  const cmd =
    "$e=$null; $null=[System.Management.Automation.Language.Parser]::ParseFile('" +
    file.replace(/'/g, "''") +
    "',[ref]$null,[ref]$e); @($e).Count";
  const r = L.run('powershell', ['-NoProfile', '-Command', cmd]);
  if (r.error) return true;
  return String(r.stdout).trim() === '0';
}

function kur() {
  const root = L.tmp('tkui-kur-');
  const r = scaffold(root, ['kur', 'Görev Takip', '--simge', 'app/simge.ico', '--anahtar', 'usb-02', '--depo', 'git@github.com:Teknesyum/Gorev.git']);
  L.ok('scaffold kur exits 0', r.status === 0, r.stderr || r.stdout);

  const bat = path.join(root, 'Kur.bat');
  const ps1 = path.join(root, 'kur-gorev-takip.ps1');
  L.ok('kur writes Kur.bat and an ASCII-named kur-<name>.ps1', fs.existsSync(bat) && fs.existsSync(ps1), fs.readdirSync(root).join(' '));
  if (!fs.existsSync(ps1)) return;

  const bytes = fs.readFileSync(ps1);
  L.ok('the installer script is saved with a UTF-8 BOM', bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf);
  const text = bytes.toString('utf8');
  const batText = fs.readFileSync(bat, 'utf8');
  L.ok('no placeholder survives', !/\{\{[A-Z0-9_]+\}\}/.test(text + batText), (/\{\{[A-Z0-9_]+\}\}/.exec(text + batText) || [''])[0]);
  L.ok('Kur.bat launches the generated script', batText.includes('kur-gorev-takip.ps1'));
  L.ok('the name, key and icon reach the script', text.includes('ad = "Görev Takip"') && text.includes('"usb-02"') && text.includes('app\\simge.ico'));
  L.ok('the project steps replace the steps block', text.includes('Program motoru hazırlanıyor'));
  L.ok('rebuild sits behind -Onar', /\[switch\]\$Onar/.test(text) && text.includes('elseif ($S.onar)'));
  L.ok('the generated script parses in Windows PowerShell', parsesInPowerShell(ps1));
  const renk1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ui', 'skills', 'teknesyum-ui', 'assets', 'theme.tokens.json'), 'utf8')).brand['renk-1'].value.toLowerCase();
  L.ok('the ssh source stays the default and takes its colours from the tokens', text.includes('ls-remote') && text.includes('renk1 = Renk "' + renk1 + '"'), (/renk1 = Renk "[^"]*"/.exec(text) || [''])[0]);

  fs.writeFileSync(bat, 'kept\r\n', 'utf8');
  const again = scaffold(root, ['kur', 'Görev Takip']);
  L.ok('a second kur overwrites nothing', /\b0 file\(s\) written/.test(again.stdout) && fs.readFileSync(bat, 'utf8') === 'kept\r\n', again.stdout);
}

function kurYerel() {
  const root = L.tmp('tkui-kur-yerel-');
  const parca = path.join(root, 'adimlar.ps1');
  fs.writeFileSync(parca, '    Adim 10 40 "Gereksinimler hazırlanıyor"\n    Yaz "g"\n    Adim 40 90 "Kısayol yazılıyor"\n    Yaz "k"\n', 'utf8');
  fs.writeFileSync(path.join(root, 'Deneme.cmd'), '@echo off\r\n', 'utf8');
  const r = scaffold(root, ['kur', 'Deneme', '--kaynak', 'yerel', '--adimlar', parca, '--exe', 'Deneme.cmd']);
  L.ok('kur --kaynak yerel exits 0', r.status === 0, r.stderr || r.stdout);
  const ps1 = path.join(root, 'kur-deneme.ps1');
  if (!fs.existsSync(ps1)) return;
  const text = fs.readFileSync(ps1, 'utf8');
  L.ok('yerel: no placeholder survives', !/\{\{[A-Z0-9_]+\}\}/.test(text), (/\{\{[A-Z0-9_]+\}\}/.exec(text) || [''])[0]);
  L.ok('yerel: step names come from the fragment', text.includes('@(@("Dosyalar denetleniyor", 0), @("Gereksinimler hazırlanıyor", 10), @("Kısayol yazılıyor", 40))'));
  L.ok('yerel: installs in place, no Değiştir, no download', text.includes('$hedef = $S.kaynak') && text.includes('$yerSecVar = $false') && !text.includes('/releases/latest'));
  L.ok('yerel: the generated script parses in Windows PowerShell', parsesInPowerShell(ps1));
  if (process.platform === 'win32') {
    const sonuc = path.join(root, 'sonuc.json');
    const run = L.run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1], { env: Object.assign({}, process.env, { KUR_OTOMATIK: '1', KUR_KOK: path.join(root, 'kok'), KUR_SONUC: sonuc }) });
    const out = fs.existsSync(sonuc) ? JSON.parse(fs.readFileSync(sonuc, 'utf8').replace(/^﻿/, '')) : {};
    L.ok('yerel: a silent run finishes in the script folder', run.status === 0 && out.durum === 'bitti' && out.hedef && fs.realpathSync.native(out.hedef).toLocaleLowerCase('tr') === fs.realpathSync.native(root).toLocaleLowerCase('tr'), String(run.stdout) + String(run.stderr));
  }
  L.ok('yerel without --adimlar exits 2', scaffold(L.tmp('tkui-kur-yv-'), ['kur', 'Deneme', '--kaynak', 'yerel']).status === 2);
}

function kurReleases() {
  const root = L.tmp('tkui-kur-rel-');
  const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ui', 'skills', 'teknesyum-ui', 'assets', 'theme.tokens.json'), 'utf8'));
  tokens.brand['renk-1'].value = '#123abc';
  fs.mkdirSync(path.join(root, 'teknesyum-ui'), { recursive: true });
  fs.writeFileSync(path.join(root, 'teknesyum-ui', 'theme.tokens.json'), JSON.stringify(tokens), 'utf8');
  const r = scaffold(root, ['kur', 'Deneme', '--kaynak', 'releases', '--depo', 'Teknesyum/Deneme', '--varlik', 'Deneme-win-x64.zip']);
  L.ok('kur --kaynak releases exits 0', r.status === 0, r.stderr || r.stdout);
  const ps1 = path.join(root, 'kur-deneme.ps1');
  if (!fs.existsSync(ps1)) return;
  const text = fs.readFileSync(ps1, 'utf8');
  L.ok('releases: no placeholder survives', !/\{\{[A-Z0-9_]+\}\}/.test(text), (/\{\{[A-Z0-9_]+\}\}/.exec(text) || [''])[0]);
  L.ok('releases: asks the latest release and verifies sha256', text.includes('/releases/latest') && text.includes('.sha256') && text.includes('SHA256]::Create()') && !text.includes('Get-FileHash'));
  L.ok('releases: extracts to temp, then moves into place', text.includes('ZipFile]::ExtractToDirectory') && text.includes('Move-Item'));
  L.ok('releases: tests write permission first and never asks for admin', text.includes('Yazma izni denetleniyor') && !/RunAs|requireAdministrator/i.test(text));
  L.ok('releases: repo, asset and exe reach the script', text.includes('depo = "Teknesyum/Deneme"') && text.includes('varlik = "Deneme-win-x64.zip"') && text.includes('exe = "Deneme.exe"'));
  L.ok('releases: colours come from the project tokens', text.includes('renk1 = Renk "#123abc"'), (/renk1 = Renk "[^"]*"/.exec(text) || [''])[0]);
  L.ok('releases: keeps the step contract, ceiling and 16 ms timer', /function Adim\(\[int\]\$y, \[int\]\$t,/.test(text) && text.includes('$S.tavan') && text.includes('Interval = 16'));
  L.ok('releases: rehearsal, silent and test roots are wired', ['KUR_PROVA', 'KUR_OTOMATIK', 'KUR_KOK', 'KUR_SONUC', 'KUR_API'].every((k) => text.includes(k)));
  L.ok('releases: the address stands alone, no location label', !/Kurulum yeri[:"]/.test(text));
  L.ok('releases: layout 2 window at 720x540', text.includes('· düzen 2') && text.includes('genislik = 720; yukseklik = 540'));
  L.ok('releases: five steps, Değiştir, Kur, Yeniden dene', ['"Değiştir"', '"Kuruluyor"', '"Yeniden dene"', '"Programı aç"'].every((k) => text.includes(k)));
  L.ok('releases: the generated script parses in Windows PowerShell', parsesInPowerShell(ps1));
  L.ok('releases without --varlik exits 2', scaffold(L.tmp('tkui-kur-rv-'), ['kur', 'Deneme', '--kaynak', 'releases', '--depo', 'a/b']).status === 2);
  L.ok('an unknown --kaynak exits 2', scaffold(L.tmp('tkui-kur-rk-'), ['kur', 'Deneme', '--kaynak', 'ftp']).status === 2);
}

function copies() {
  const root = L.tmp('tkui-copy-');
  const bar = scaffold(root, ['ustcubuk']);
  L.ok('scaffold ustcubuk exits 0', bar.status === 0, bar.stderr);
  const barDir = path.join(root, 'teknesyum-ui', 'ustcubuk');
  L.ok('ustcubuk writes TitleBar.tsx and titlebar.css', ['TitleBar.tsx', 'titlebar.css'].every((n) => fs.existsSync(path.join(barDir, n))));

  const sync = scaffold(root, ['durum']);
  L.ok('scaffold durum exits 0', sync.status === 0, sync.stderr);
  const syncDir = path.join(root, 'teknesyum-ui', 'durum');
  const names = ['sync.js', 'preload.js', 'badge.js', 'badge.css'];
  L.ok('durum writes the main, preload and badge files', names.every((n) => fs.existsSync(path.join(syncDir, n))));

  const reactRoot = L.tmp('tkui-copy-react-');
  const reactDurum = scaffold(reactRoot, ['durum', '--react']);
  L.ok('scaffold durum --react exits 0', reactDurum.status === 0, reactDurum.stderr);
  const reactDir = path.join(reactRoot, 'teknesyum-ui', 'durum');
  const reactNames = ['UpdateBadge.tsx', 'UpdatePanel.tsx', 'update.css'];
  L.ok('durum --react writes the badge, panel and stylesheet', reactNames.every((n) => fs.existsSync(path.join(reactDir, n))), fs.existsSync(reactDir) ? fs.readdirSync(reactDir).join(' ') : '');
  const panelText = fs.readFileSync(path.join(reactDir, 'UpdatePanel.tsx'), 'utf8');
  L.ok('durum --react keeps the 16 ms timer and the creeping ceiling', panelText.includes('}, 16)') && panelText.includes('(c - next) * 0.006'));
}

function avalonia() {
  const root = L.tmp('tkui-av-');
  L.write(path.join(root, 'src', 'App', 'MainWindow.axaml'), '<Window xmlns="https://github.com/avaloniaui"/>\n');
  const signed = (file) => /teknesyum-ui template [\w./-]+/.test(fs.readFileSync(file, 'utf8').split(/\r?\n/)[0]);
  const clean = (file) => !/\{\{[A-Z]+\}\}/.test(fs.readFileSync(file, 'utf8'));

  L.ok('ustcubuk on an Avalonia project without a namespace exits 2', scaffold(root, ['ustcubuk']).status === 2);

  const bar = scaffold(root, ['ustcubuk', 'Deneme']);
  L.ok('scaffold ustcubuk picks Avalonia from the .axaml in the project', bar.status === 0, bar.stderr || bar.stdout);
  const barDir = path.join(root, 'teknesyum-ui', 'ustcubuk');
  const barFiles = ['TitleBar.axaml', 'TitleBar.axaml.cs', 'KabukStilleri.axaml'].map((n) => path.join(barDir, n));
  L.ok('ustcubuk writes TitleBar and KabukStilleri', barFiles.every((f) => fs.existsSync(f)), fs.existsSync(barDir) ? fs.readdirSync(barDir).join(' ') : '');
  L.ok('ustcubuk says how to link the files', /AvaloniaXaml Include=/.test(bar.stdout) && /StyleInclude/.test(bar.stdout), bar.stdout);

  const panel = scaffold(root, ['durum', 'Deneme', '--avalonia']);
  L.ok('scaffold durum --avalonia exits 0', panel.status === 0, panel.stderr || panel.stdout);
  const panelFiles = fs.readdirSync(path.join(root, 'teknesyum-ui', 'durum')).map((n) => path.join(root, 'teknesyum-ui', 'durum', n));
  L.ok('durum writes GuncellemePaneli', panelFiles.some((f) => f.endsWith('GuncellemePaneli.axaml')), panelFiles.join(' '));

  const kurRoot = L.tmp('tkui-av-kur-');
  const setup = scaffold(kurRoot, ['kur', 'Görev Takip', '--avalonia', '--ns', 'GorevTakip']);
  L.ok('kur --avalonia exits 0', setup.status === 0, setup.stderr || setup.stdout);
  const kurDir = path.join(kurRoot, 'teknesyum-ui', 'kur');
  const kurFiles = fs.existsSync(kurDir) ? fs.readdirSync(kurDir).map((n) => path.join(kurDir, n)) : [];
  L.ok('kur --avalonia adds the install screen', kurFiles.some((f) => f.endsWith('KurulumEkrani.axaml')) && fs.existsSync(path.join(kurRoot, 'Kur.bat')), kurFiles.join(' '));
  L.ok('kur --avalonia refuses an app name that is no namespace', scaffold(L.tmp('tkui-av-ns-'), ['kur', 'Görev Takip', '--avalonia']).status === 2);

  const all = barFiles.concat(panelFiles, kurFiles);
  L.ok('every Avalonia shell file carries its template signature', all.every(signed), all.filter((f) => !signed(f)).join(' '));
  L.ok('no placeholder survives in the Avalonia shell', all.every(clean), all.filter((f) => !clean(f)).join(' '));

  const audit = scaffold(root, ['denetim', 'Deneme']);
  L.ok('denetim writes the shell tests beside the contrast test', audit.status === 0 && ['KontrastTests.cs', 'KabukTests.cs'].every((n) => fs.existsSync(path.join(root, 'teknesyum-ui', 'denetim', n))), audit.stdout);
}

function usage() {
  const root = L.tmp('tkui-usage-');
  L.ok('an unknown target exits 2', scaffold(root, ['nope']).status === 2);
  L.ok('kur without a name exits 2', scaffold(root, ['kur']).status === 2);
  L.ok('a name that would break the script exits 2', scaffold(root, ['kur', 'A"b']).status === 2);
  L.ok('a refused run writes nothing', fs.readdirSync(root).length === 0, fs.readdirSync(root).join(' '));
}

function rafNotu() {
  const home = L.tmp('tkui-sc-raf-');
  const dir = path.join(home, 'private', 'tercihler');
  fs.mkdirSync(dir, { recursive: true });

  const bos = L.tmp('tkui-sc-bos-');
  const yok = L.node(L.SCAFFOLD, ['kur', 'Deneme', '--project', bos], { env: L.cleanEnv({ TEKNESYUM_PRIVATE: path.join(home, 'yok') }) });
  L.ok('kur says the shelf is missing', /shelf missing/.test(yok.stdout), yok.stdout);

  const eksik = L.tmp('tkui-sc-eksik-');
  const kitapsiz = L.node(L.SCAFFOLD, ['kur', 'Deneme', '--project', eksik], { env: L.cleanEnv({ TEKNESYUM_PRIVATE: home }) });
  L.ok('kur says the update book is missing', /no guncelleme-paneli\.md/.test(kitapsiz.stdout), kitapsiz.stdout);

  fs.writeFileSync(path.join(dir, 'guncelleme-paneli.md'), '# Panel\n', 'utf8');
  const dolu = L.tmp('tkui-sc-dolu-');
  const varsa = L.node(L.SCAFFOLD, ['kur', 'Deneme', '--project', dolu], { env: L.cleanEnv({ TEKNESYUM_PRIVATE: home }) });
  L.ok('kur points at the update book on the shelf', /raf\.js guncelleme-paneli/.test(varsa.stdout), varsa.stdout);

  fs.writeFileSync(path.join(dir, 'ui-duzeni.md'), '# Düzen\n', 'utf8');
  const cubuk = L.tmp('tkui-sc-cubuk-');
  const bar = L.node(L.SCAFFOLD, ['ustcubuk', '--project', cubuk], { env: L.cleanEnv({ TEKNESYUM_PRIVATE: home }) });
  L.ok('ustcubuk points at the layout book', /raf\.js ui-duzeni/.test(bar.stdout), bar.stdout);
}

function varsayilanlar(file, sinif) {
  const out = {};
  const re = new RegExp('Register<' + sinif + ', string>\\(nameof\\((\\w+)\\), "([^"]*)"\\)', 'g');
  for (const m of fs.readFileSync(file, 'utf8').matchAll(re)) out[m[1]] = m[2];
  return out;
}

function etiketler() {
  const tr = L.readJson(path.join(L.ASSETS, 'labels.tr.json'));
  const links = L.readJson(path.join(L.ASSETS, 'links.json'));
  const bar = varsayilanlar(path.join(L.UI, 'templates', 'ustcubuk', 'avalonia', 'TitleBar.axaml.cs'), 'TitleBar');
  const panel = varsayilanlar(path.join(L.UI, 'templates', 'durum', 'avalonia', 'GuncellemePaneli.axaml.cs'), 'GuncellemePaneli');
  const esler = [
    ['ImzaMetni', 'sig.brand'],
    ['ImzaIpucu', 'sig.brandTitle'],
    ['DestekMetni', 'sig.support'],
    ['DestekIpucu', 'sig.supportTitle'],
    ['SiteMetni', 'sig.site'],
    ['SiteIpucu', 'sig.siteTitle'],
    ['RozetMetni', 'update.label'],
    ['RozetIpucu', 'update.download'],
    ['RozetHazirIpucu', 'update.install'],
    ['SenkronMetni', 'sync.synced'],
    ['CevrimdisiMetni', 'sync.offline'],
    ['SenkronIpucu', 'sync.now'],
  ];
  const farkli = esler.filter(([p, k]) => bar[p] !== tr[k]).map(([p, k]) => p + '="' + bar[p] + '" / ' + k + '="' + tr[k] + '"');
  if (panel.Baslik !== tr['update.label']) farkli.push('GuncellemePaneli.Baslik="' + panel.Baslik + '" / update.label="' + tr['update.label'] + '"');
  L.ok('Avalonia template defaults equal labels.tr.json', farkli.length === 0, farkli.join('; '));
  L.ok(
    'Avalonia template addresses equal links.json and the site',
    bar.ImzaAdresi === links.github && bar.DestekAdresi === links.sponsor && bar.SiteAdresi === 'https://teknesyum.com',
    [bar.ImzaAdresi, bar.DestekAdresi, bar.SiteAdresi].join(' ')
  );

  const axaml = fs.readFileSync(path.join(L.UI, 'templates', 'ustcubuk', 'avalonia', 'TitleBar.axaml'), 'utf8');
  const sira = ['Name="Senkron"', 'Name="Rozet"', 'Name="ImzaDugmesi"', 'Name="DestekDugmesi"', 'Name="SiteDugmesi"', 'Name="KucultDugmesi"'].map((s) => axaml.indexOf(s));
  L.ok('Avalonia title bar order is sync, badge, brand, support, site, window', sira.every((v, i) => v >= 0 && (i === 0 || v > sira[i - 1])), sira.join(' '));

  const tsx = fs.readFileSync(path.join(L.UI, 'templates', 'ustcubuk', 'react', 'TitleBar.tsx'), 'utf8');
  const rsira = ['className={\'tk-sync\'', 'tk-titlebar__chip--brand', 'tk-titlebar__chip--support', 'href={links.site}', 'tk-titlebar__window"'].map((s) => tsx.indexOf(s));
  L.ok('React title bar order is sync, brand, support, site, window', rsira.every((v, i) => v >= 0 && (i === 0 || v > rsira[i - 1])), rsira.join(' '));
}

module.exports = function scaffoldSuite() {
  etiketler();
  kur();
  kurYerel();
  kurReleases();
  copies();
  avalonia();
  usage();
  rafNotu();
};
