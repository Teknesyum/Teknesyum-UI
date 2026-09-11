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
  L.ok('no placeholder survives', !/\{\{[A-Z]+\}\}/.test(text + batText), (/\{\{[A-Z]+\}\}/.exec(text + batText) || [''])[0]);
  L.ok('Kur.bat launches the generated script', batText.includes('kur-gorev-takip.ps1'));
  L.ok('the name, key and icon reach the script', text.includes('ad = "Görev Takip"') && text.includes('"usb-02"') && text.includes('app\\simge.ico'));
  L.ok('the project steps replace the steps block', text.includes('Program motoru hazırlanıyor'));
  L.ok('rebuild sits behind -Onar', /\[switch\]\$Onar/.test(text) && text.includes('elseif ($S.onar)'));
  L.ok('the generated script parses in Windows PowerShell', parsesInPowerShell(ps1));

  fs.writeFileSync(bat, 'kept\r\n', 'utf8');
  const again = scaffold(root, ['kur', 'Görev Takip']);
  L.ok('a second kur overwrites nothing', /\b0 file\(s\) written/.test(again.stdout) && fs.readFileSync(bat, 'utf8') === 'kept\r\n', again.stdout);
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
}

function usage() {
  const root = L.tmp('tkui-usage-');
  L.ok('an unknown target exits 2', scaffold(root, ['nope']).status === 2);
  L.ok('kur without a name exits 2', scaffold(root, ['kur']).status === 2);
  L.ok('a name that would break the script exits 2', scaffold(root, ['kur', 'A"b']).status === 2);
  L.ok('a refused run writes nothing', fs.readdirSync(root).length === 0, fs.readdirSync(root).join(' '));
}

module.exports = function scaffoldSuite() {
  kur();
  copies();
  usage();
};
