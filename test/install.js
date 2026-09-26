'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const TARGETS = ['css', 'wpf', 'avalonia', 'winforms', 'react'];
const TURKISH_KEYS = ['kapali', 'palet', 'tipografi', 'imza', 'ekNot'];

function setup(root, args) {
  return L.node(L.SETUP, args.concat(['--project', root]), { env: L.cleanEnv() });
}

function keysOf(value, out) {
  const found = out || [];
  if (Array.isArray(value)) for (const v of value) keysOf(v, found);
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      found.push(k);
      keysOf(v, found);
    }
  return found;
}

function applyNeon() {
  const root = L.tmp('tkui-apply-');
  const first = setup(root, ['--apply', '--template', 'neon', '--targets', TARGETS.join(',')]);
  L.ok('--apply with the neon template exits 0', first.status === 0, first.stderr || first.stdout);

  const config = path.join(root, '.claude', 'teknesyum-ui.json');
  L.ok('the config file is written', fs.existsSync(config));

  const cfg = L.readJson(config) || {};
  L.ok('the config records every target', TARGETS.every((t) => (cfg.targets || []).includes(t)), JSON.stringify(cfg.targets));

  const missing = TARGETS.filter((t) => {
    const dir = path.join(root, 'teknesyum-ui', t);
    return !fs.existsSync(dir) || fs.readdirSync(dir).length === 0;
  });
  L.ok('every target directory receives files', missing.length === 0, missing.join(' '));

  const av = path.join(root, 'teknesyum-ui', 'avalonia');
  L.ok('the Avalonia signature ships as an example, outside the compiled axaml glob', fs.existsSync(path.join(av, 'Signature.axaml.example')) && !fs.existsSync(path.join(av, 'Signature.axaml')));

  L.ok('theme.tokens.json is written',fs.existsSync(path.join(root, 'teknesyum-ui', 'theme.tokens.json')));

  const keys = keysOf(cfg);
  const turkish = keys.filter((k) => TURKISH_KEYS.includes(k));
  L.ok('no Turkish key in the written config', turkish.length === 0, turkish.join(' '));
  const nonAscii = keys.filter((k) => !/^[A-Za-z][A-Za-z0-9]*$/.test(k));
  L.ok('every config key is a plain English identifier', nonAscii.length === 0, nonAscii.join(' '));

  const second = setup(root, ['--apply', '--template', 'neon', '--targets', TARGETS.join(',')]);
  L.ok('a second --apply exits 0', second.status === 0, second.stderr || second.stdout);
  L.ok('a second --apply overwrites nothing', /\b0 file\(s\) written/.test(second.stdout), second.stdout.split(/\r?\n/).pop());

  return root;
}

function applyCustom() {
  const root = L.tmp('tkui-custom-');
  const r = setup(root, [
    '--apply',
    '--template',
    'custom',
    '--targets',
    'css',
    '--primary',
    '#3355ff',
    '--secondary',
    '#ff8800',
    '--tertiary',
    '#22cc88',
    '--surface',
    '#0b0c0e',
  ]);
  L.ok('--apply with a custom palette exits 0', r.status === 0, r.stderr || r.stdout);

  const tokens = L.readJson(path.join(root, 'teknesyum-ui', 'theme.tokens.json'));
  L.ok('the custom palette reaches the tokens', !!tokens && tokens.brand.blue.value === '#3355ff', tokens && tokens.brand.blue.value);

  const cfg = L.readJson(path.join(root, '.claude', 'teknesyum-ui.json')) || {};
  L.ok(
    'the custom palette is recorded',
    cfg.palette &&
      cfg.palette.secondary === '#ff8800' &&
      cfg.palette.tertiary === '#22cc88' &&
      cfg.palette.surface === '#0b0c0e',
    JSON.stringify(cfg.palette)
  );
  L.ok('the css target receives theme.css', fs.existsSync(path.join(root, 'teknesyum-ui', 'css', 'theme.css')));
}

function embedsFont() {
  const root = L.tmp('tkui-font-');
  L.write(
    path.join(root, 'src', 'Deneme', 'Deneme.csproj'),
    [
      '<Project Sdk="Microsoft.NET.Sdk">',
      '  <PropertyGroup>',
      '    <OutputType>WinExe</OutputType>',
      '    <AssemblyName>Deneme</AssemblyName>',
      '  </PropertyGroup>',
      '  <ItemGroup>',
      '    <PackageReference Include="Avalonia" Version="11.3.20" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\r\n')
  );
  const r = setup(root, ['--apply', '--template', 'neon', '--targets', 'avalonia']);
  L.ok('--apply with an Avalonia app exits 0', r.status === 0, r.stderr || r.stdout);

  const fonts = path.join(root, 'src', 'Deneme', 'Assets', 'Fonts');
  const want = ['AtkinsonHyperlegibleNext-Regular.ttf', 'AtkinsonHyperlegibleNext-SemiBold.ttf', 'AtkinsonHyperlegibleNext-Bold.ttf', 'OFL.txt'];
  const lost = want.filter((n) => !fs.existsSync(path.join(fonts, n)));
  L.ok('the sans face and its licence land in the app Assets/Fonts', lost.length === 0, lost.join(' '));

  const theme = fs.readFileSync(path.join(root, 'teknesyum-ui', 'avalonia', 'Theme.axaml'), 'utf8');
  L.ok(
    'FontSans points at the embedded avares URI',
    theme.includes('<FontFamily x:Key="FontSans">avares://Deneme/Assets/Fonts#Atkinson Hyperlegible Next'),
    (/<FontFamily x:Key="FontSans">[^<]*/.exec(theme) || [''])[0]
  );

  const csproj = fs.readFileSync(path.join(root, 'src', 'Deneme', 'Deneme.csproj'), 'utf8');
  L.ok('the app project compiles the fonts as AvaloniaResource', csproj.includes('<AvaloniaResource Include="Assets\\Fonts\\**"'), csproj);

  const tokens = L.readJson(path.join(L.UI, 'templates', 'neon.tokens.json'));
  const scale = ['fs-1', 'fs-2', 'fs-3', 'fs-4', 'fs-5'].map((k) => parseFloat(tokens.size[k].value));
  const cfg = L.readJson(path.join(root, '.claude', 'teknesyum-ui.json')) || {};
  L.ok('typography.scale comes from the token file', JSON.stringify((cfg.typography || {}).scale) === JSON.stringify(scale), JSON.stringify((cfg.typography || {}).scale));

  const again = setup(root, ['--apply', '--template', 'neon', '--targets', 'avalonia']);
  L.ok('a second --apply leaves the font and csproj alone', /\b0 file\(s\) written/.test(again.stdout) && fs.readFileSync(path.join(root, 'src', 'Deneme', 'Deneme.csproj'), 'utf8') === csproj, again.stdout);
}

function switches(root) {
  const off = setup(root, ['--off']);
  L.ok('--off exits 0', off.status === 0, off.stderr);
  const offStatus = setup(root, ['--status']);
  L.ok('--status reports off', /\boff\b/.test(offStatus.stdout), offStatus.stdout.split(/\r?\n/)[0]);

  const on = setup(root, ['--on']);
  L.ok('--on exits 0', on.status === 0, on.stderr);
  const onStatus = setup(root, ['--status']);
  L.ok('--status reports on again', /^Teknesyum UI on\b/m.test(onStatus.stdout), onStatus.stdout.split(/\r?\n/)[0]);
}

function check(root) {
  const r = setup(root, ['--check']);
  L.ok('--check exits 0', r.status === 0, r.stderr);
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    L.ok('--check prints valid JSON', false, e.message);
    return;
  }
  L.ok('--check prints valid JSON', !!parsed);
  L.ok('--check reports the project it inspected', parsed.project === path.resolve(root), parsed.project);
  L.ok('--check reports that the project is configured', parsed.configured === true);
}

module.exports = function install() {
  const root = applyNeon();
  applyCustom();
  embedsFont();
  switches(root);
  check(root);
};
