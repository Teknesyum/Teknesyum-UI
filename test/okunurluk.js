'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const L = require('./lib');

const DENETIM = path.join(path.dirname(L.SCAN), 'denetim.js');
const CONFIG = { version: '1.1.0', off: false, template: 'neon', targets: ['css'], signature: { off: false } };

function project(files) {
  const root = L.tmp('tkui-ok-');
  L.write(path.join(root, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG, null, 2));
  for (const [name, text] of Object.entries(files)) L.write(path.join(root, name), text);
  return root;
}

function scan(root, rules) {
  const r = L.node(L.SCAN, [root, '--json', '--rules', rules], { env: L.cleanEnv() });
  try {
    return JSON.parse(r.stdout);
  } catch {
    return [{ rule: 'parse', message: r.stdout + r.stderr }];
  }
}

function gate() {
  const tokens = L.readJson(path.join(L.ASSETS, 'theme.tokens.json'));
  const out = L.tmp('tkui-gate-');
  const good = path.join(out, 'good.json');
  fs.writeFileSync(good, JSON.stringify(tokens, null, 2));
  const ok = L.node(L.GENERATE, [good, out], { env: L.cleanEnv() });
  L.ok('the neon tokens pass the contrast gate', ok.status === 0, ok.stderr);
  const css = fs.existsSync(path.join(out, 'theme.css')) ? fs.readFileSync(path.join(out, 'theme.css'), 'utf8') : '';
  const xaml = fs.existsSync(path.join(out, 'Theme.xaml')) ? fs.readFileSync(path.join(out, 'Theme.xaml'), 'utf8') : '';
  L.ok('theme.css carries --tk-on-<fill> for every on pair', /--tk-on-blue: #0a0b0e;/.test(css) && /--tk-on-blue-10: #f2f3f6;/.test(css));
  L.ok('a fill without an on pair gets no --tk-on var', !/--tk-on-pink:/.test(css));
  L.ok('Theme.xaml carries On<Fill> brushes', /x:Key="OnBlue"\s+Color="#FF0A0B0E"/.test(xaml) && /x:Key="OnPurple60"/.test(xaml));

  const bad = JSON.parse(JSON.stringify(tokens));
  bad.on.pink = { on: 'black', rationale: 'black on pink: 6.44:1.' };
  const badFile = path.join(out, 'bad.json');
  fs.writeFileSync(badFile, JSON.stringify(bad, null, 2));
  const badOut = L.tmp('tkui-gate-bad-');
  const r = L.node(L.GENERATE, [badFile, badOut], { env: L.cleanEnv() });
  L.ok('a pair below 7:1 stops generation', r.status === 1 && !fs.existsSync(path.join(badOut, 'theme.css')), r.stderr);
  L.ok('the gate names the pair and its ratio', /black on pink — 4\.70:1, below 7:1/.test(r.stderr), r.stderr);

  const lie = JSON.parse(JSON.stringify(tokens));
  lie.on.blue = { on: 'black', rationale: 'black on blue: 9.99:1.' };
  const lieFile = path.join(out, 'lie.json');
  fs.writeFileSync(lieFile, JSON.stringify(lie, null, 2));
  const l = L.node(L.GENERATE, [lieFile, L.tmp('tkui-gate-lie-')], { env: L.cleanEnv() });
  L.ok('a rationale that misstates the ratio stops generation', l.status === 1 && /rationale says 9\.99:1, measured 11\.71:1/.test(l.stderr), l.stderr);
}

function contrast() {
  const root = project({
    'pink.css': '.a { color: #ff00ea; }\n',
    'pinktext.css': '.a { color: #ff54eb; }\n',
    'pair.css': '.a { background: #ff00ea; color: #000; }\n',
  });
  const found = scan(root, 'core').filter((f) => f.rule === 'core/contrast' || f.rule === 'contrast');
  L.ok('contrast flags the pink fill cut used as text', found.some((f) => /pink\.css$/.test(f.file)), JSON.stringify(found));
  L.ok('contrast exempts the approved pink-text cut', !found.some((f) => /pinktext\.css$/.test(f.file)));
  L.ok('contrast leaves a fill+text line to pair-contrast', !found.some((f) => /pair\.css$/.test(f.file)));
}

function pairs() {
  const root = project({
    'App.xaml':
      '<Application xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">\n' +
      '  <Application.Resources>\n' +
      '    <Color x:Key="SoftBlue">#6FA8DC</Color>\n' +
      '    <SolidColorBrush x:Key="SoftBlueBrush" Color="{StaticResource SoftBlue}"/>\n' +
      '  </Application.Resources>\n' +
      '</Application>\n',
    'Views/Save.xaml':
      '<UserControl xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">\n' +
      '  <Button Background="{DynamicResource SoftBlueBrush}" Foreground="#1F4E79" Content="Kaydet"/>\n' +
      '</UserControl>\n',
    'src/Bar.jsx': 'export const Bar = () => <button className="bg-sky-300 text-blue-800">Kaydet</button>;\n',
  });
  const found = scan(root, 'okunurluk');
  const xaml = found.find((f) => /Save\.xaml$/.test(f.file));
  L.ok('pair-contrast resolves a brush defined in another file', !!xaml, JSON.stringify(found));
  L.ok('the message names both colours and the ratio', !!xaml && /^bg SoftBlueBrush \(#6fa8dc\) on fg #1F4E79 — \d\.\d:1, below 7:1$/.test(xaml.message), xaml && xaml.message);
  L.ok('pair-contrast reads Tailwind bg-/text- pairs', found.some((f) => /Bar\.jsx$/.test(f.file) && /bg-sky-300/.test(f.message)));
  L.ok('pair-contrast findings are errors', found.length > 0 && found.every((f) => f.severity === 'error'));

  const more = project({
    'src/Tokens.cs': 'static class Tokens { public const string Purple = "#B026FF"; public const string PurpleText = "#C67EFF"; }\n',
    'src/Palette.cs':
      'using System.Drawing;\nstatic class Palette {\n  public static readonly Color NeonPurple = ColorTranslator.FromHtml(Tokens.Purple);\n  public static readonly Color PurpleText = ColorTranslator.FromHtml(Tokens.PurpleText);\n}\n',
    'src/NeonButton.cs':
      'class NeonButton : Button {\n  bool _hover;\n  protected override void OnPaint(PaintEventArgs e) {\n    var g = e.Graphics;\n    if (Primary) {\n      using var fill = new SolidBrush(Color.White);\n      g.FillPath(fill, path);\n    } else if (_hover) {\n      using var fill = new SolidBrush(Color.FromArgb(30, Palette.NeonPurple));\n      g.FillPath(fill, path);\n    }\n    var textColor = Primary ? Color.Black : Palette.PurpleText;\n    TextRenderer.DrawText(g, Text, Font, bounds, textColor);\n  }\n}\n',
    'src/a.css': '.drawer { --muted: #1f4e79; }\n.row { background: #000; color: var(--muted, #ffffff); }\n',
    'Views/Theme.axaml':
      '<Styles xmlns="https://github.com/avaloniaui">\n  <Style Selector="Button">\n    <Setter Property="Foreground" Value="#FFFFFF"/>\n    <Style Selector="^:pointerover">\n      <Setter Property="Foreground" Value="#000000"/>\n    </Style>\n    <Style Selector="^:pointerover /template/ Border#Root">\n      <Setter Property="Background" Value="#00F3FF"/>\n    </Style>\n  </Style>\n</Styles>\n',
  });
  const rows = scan(more, 'okunurluk');
  const paint = rows.filter((f) => /NeonButton\.cs$/.test(f.file));
  L.ok('pair-contrast follows a C# paint method through locals, branches and symbols', paint.length === 1 && /bg Palette\.NeonPurple @30 .* on fg Palette\.PurpleText .* 6\.5:1/.test(paint[0].message), JSON.stringify(rows));
  L.ok('a var scoped to another selector yields to the fallback', !rows.some((f) => /a\.css$/.test(f.file)));
  L.ok('a template state style takes the text of its sibling state style', !rows.some((f) => /Theme\.axaml$/.test(f.file)), JSON.stringify(rows));
}

function snippet() {
  const help = L.node(DENETIM, ['--help']);
  L.ok('denetim --help exits 0', help.status === 0 && /javascript_tool/.test(help.stdout));
  L.ok('denetim refuses a url without a scheme', L.node(DENETIM, ['localhost:3000']).status === 2);
  const r = L.node(DENETIM, ['http://localhost:5173', '--esik', '4.5']);
  L.ok('denetim prints a snippet', r.status === 0 && r.stdout.length > 500, r.stderr);
  let parsed = true;
  try {
    new vm.Script(r.stdout);
  } catch {
    parsed = false;
  }
  L.ok('the snippet parses as a standalone script', parsed);
  L.ok('the snippet carries its options', /"esik":4\.5/.test(r.stdout) && /"url":"http:\/\/localhost:5173"/.test(r.stdout));
  L.ok('the snippet uses no external library', !/axe|import\s|require\(/.test(r.stdout));
  const file = path.join(L.tmp('tkui-snip-'), 'denetim.js');
  const w = L.node(DENETIM, ['--snippet', file]);
  L.ok('--snippet writes the file', w.status === 0 && fs.existsSync(file));
}

function scaffold() {
  const wpf = L.tmp('tkui-den-');
  L.write(path.join(wpf, 'MainWindow.xaml'), '<Window/>\n');
  const r = L.node(L.SCAFFOLD, ['denetim', 'Runly', '--project', wpf], { env: L.cleanEnv() });
  const file = path.join(wpf, 'teknesyum-ui', 'denetim', 'KontrastTests.cs');
  L.ok('scaffold denetim exits 0', r.status === 0, r.stderr);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  L.ok('a WPF project gets the STA/VisualTreeHelper test', /ApartmentState\.STA/.test(text) && /VisualTreeHelper/.test(text));
  L.ok('the namespace and window reach the test', /namespace Runly\.Kontrast/.test(text) && /new global::Runly\.MainWindow\(\)/.test(text));
  L.ok('no placeholder survives in the test', !/\{\{[A-Z]+\}\}/.test(text));

  const ava = L.tmp('tkui-den-');
  L.write(path.join(ava, 'Views', 'MainWindow.axaml'), '<Window/>\n');
  const ar = L.node(L.SCAFFOLD, ['denetim', 'VidShrink', '--pencere', 'ShellWindow', '--project', ava], { env: L.cleanEnv() });
  const at = path.join(ava, 'teknesyum-ui', 'denetim', 'KontrastTests.cs');
  const atext = fs.existsSync(at) ? fs.readFileSync(at, 'utf8') : '';
  L.ok('an Avalonia project gets the headless test', /AvaloniaFact/.test(atext) && /ShellWindow/.test(atext));
  L.ok(
    'the Avalonia test drives hover, pressed, focus and disabled',
    /":pointerover"/.test(atext) && /":pressed"/.test(atext) && /":focus-visible"/.test(atext) && /IsEnabled = false/.test(atext)
  );
  L.ok(
    'the Avalonia test measures runs, icons and the worst gradient stop',
    /OfType<Run>\(\)/.test(atext) && /is Shape/.test(atext) && /IGradientBrush/.test(atext)
  );
  L.ok('an Avalonia scaffold names xunit v3', /xunit\.v3/.test(ar.stdout), ar.stdout);
  L.ok(
    'the WPF test drives hover, pressed, focus and disabled',
    /IsMouseOverPropertyKey/.test(text) && /SetIsPressed/.test(text) && /IsKeyboardFocusedPropertyKey/.test(text) && /IsEnabled = false/.test(text)
  );
  L.ok(
    'the WPF test measures runs, icons and the worst gradient stop',
    /OfType<Run>\(\)/.test(text) && /is Shape/.test(text) && /GradientBrush/.test(text)
  );
  L.ok('a bad namespace exits 2', L.node(L.SCAFFOLD, ['denetim', 'Bad-Name', '--project', ava], { env: L.cleanEnv() }).status === 2);
}

module.exports = function suite() {
  gate();
  contrast();
  pairs();
  snippet();
  scaffold();
};
