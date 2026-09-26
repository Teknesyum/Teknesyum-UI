<!-- lang -->

[<img src="assets/badge-lang.svg" alt="English selected, switch to Türkçe" width="124" height="44">](README.tr.md)

# Teknesyum UI

An interface standard for Claude Code, shipped as data plus a scanner rather than as a
document the model has to read.

Split out of Teknesyum Base so that [Teknesyum Core](https://github.com/Teknesyum/Teknesyum-Core) stays a work relay
and nothing more. Core has no opinion about how anything looks; this project has all of it.

**Off until you ask for it.** The standard applies only where a `teknesyum-ui.json` exists.
Installing the plugin changes nothing on its own.

---

## The idea

Most of what a "standard" document contains is either something the model already does, or
a number. Neither belongs in its context window.

| Kind of rule | Where it lives | What it costs |
|---|---|---|
| A value — colour, radius, duration, scale step | generated token files in your project | nothing; read one when you need one |
| A mechanically checkable rule | `scan.js` | nothing; it runs, it does not get read |
| The written standard, in prose | the private shelf, one book per subject | nothing; a book is read once, when its work starts |
| How to reach the shelf and what to run | `SKILL.md`, 80 lines | paid once, when UI work starts |

Base spent about 27,000 tokens on `SKILL.md` and 55,000 more on eight reference files
every time an interface came up. This ships 100 scanner rules, one 80-line skill and two
reference files.

## Where the rules live

The prose half of the standard is not in this repository. It sits on the private shelf that
[Teknesyum Core](https://github.com/Teknesyum/Teknesyum-Core) keeps — `TEKNESYUM_PRIVATE`, or
`<config>/teknesyum-private/private/tercihler/` — one book per subject. You describe a rule
once, there, and both the skill and the scaffolder follow it.

```bash
node <plugin>/scripts/raf.js                     # list the books
node <plugin>/scripts/raf.js guncelleme-paneli   # read one
```

| Work | Book |
|---|---|
| Any interface change | `ui-duzeni` |
| An update, installer or sync surface | `guncelleme-paneli` |
| A README or repository document | `readme-protokolu` |

A book is read once per session. The skill says so, and the Stop hook keeps its own memory:
it names a finding once per file and stays quiet on a repeat until the conversation is
compacted.

## Install

```bash
/plugin marketplace add Teknesyum/Teknesyum-Core
```

One marketplace carries both plugins: the Core marketplace lists this plugin as a `git-subdir` source pointing at the `ui/` folder of this repository, and the `.claude-plugin/marketplace.json` here only lets the repository be added as a standalone marketplace for local development. Then `/plugin install teknesyum-ui@teknesyum`.

Then, in the project you want it in:

```bash
node <plugin>/scripts/setup.js
```

Run in your own terminal it asks its own questions and costs nothing. Run inside Claude
Code it prints what it needs, the model asks once, and calls `--apply` with the answers.

It writes `<project>/.claude/teknesyum-ui.json` and generates the theme into
`<project>/teknesyum-ui/` for the targets you pick: `css`, `react`, `wpf`, `avalonia`,
`winforms`. The Avalonia signature comes as `Signature.axaml.example`: it needs a
localisation extension and a `Click` handler, so copy it into a view of your own.

For `avalonia` and `wpf` it also embeds the sans face: Atkinson Hyperlegible Next and its
OFL go into the app project's `Assets/Fonts`, `FontSans` points at the `avares://` (or
assembly component) URI, and the project gets the resource item. `--app <csproj>` picks the
project when there are several. The generated theme sets every window to FontSans at fs-2
(Avalonia `:is(Window)`, WPF `TkWindow`), and `typography.scale` is read from the token file.

The generated Avalonia theme animates its background layer's `RenderTransform`
(`Window.anim Panel.appbg`), and Avalonia has no built-in animator for that: without one the
app crashes on launch. `setup.js` writes a `TransformAnimator.cs` beside the app's
`App.axaml.cs` and adds `Animation.RegisterCustomAnimator<ITransform, TransformAnimator>()` as
the first line of `Initialize()`, skipping it if it is already there. When `App.axaml.cs` or
its `Initialize()` method is not where expected, it prints a warning instead of failing the
run — `scan.js`'s `core/avalonia-animator-missing` then catches the gap.

Neon is the ready answer, not the only one — `--template custom` takes three brand colours
and a surface, and derives the rest on the same formulas.

## Check your work

```bash
node <plugin>/scripts/scan.js <project-root>
```

`0` clean, `1` findings, `2` not configured or off. `--json` for machine output, `--fix`
for the repairs that are safe to automate, `--list-rules` for what it enforces, `--files
a.css,b.tsx` to report only on the files that were touched while project-wide rules still read
the whole tree. `--fix` leaves the period of an
infinite animation alone and only reports it: a loop is fixed by its repeat, not its duration.

A Stop hook runs the same scan when interface files changed and blocks on a violation. It
exits before doing any work when no config exists or `off: true` is set, and it stands down
after two blocks on the same file, so a real disagreement stops the gate rather than the work.
It scans only the files the turn changed, counts only open findings (never `ignored` or
`fixed`), and it does not repeat a finding it has already
made in the same conversation.

### Contrast

Every fill in the tokens carries an `on` pair, the text colour that goes on it. `generate.js`
measures each pair, a translucent fill composited over the surface first, and stops at the
first one under 7:1 with the pair and its ratio. It writes them out as `--tk-on-*` in CSS and
`On*` brushes in XAML.

The `okunurluk/pair-contrast` rule looks for a fill and a text colour on the same element and
measures them. It reads hex, `var(--tk-*)`, Tailwind classes (arbitrary values too), XAML
`Background`/`Foreground` with Static and Dynamic resources from any file, style setters and
triggers, and C# painting: `FillPath`/`FillRectangle` and `TextRenderer.DrawText` in a paint
method, plus WinForms `BackColor`/`ForeColor` pairs. A finding reads
`bg X on fg Y — 2.1:1, below 7:1`. `core/contrast` now measures fill colours used as text;
only the approved text cuts are exempt.

The scanner cannot see a colour computed at run time. For that, audit the running page:

```bash
node <plugin>/scripts/denetim.js http://localhost:5173 [--esik 7] [--hedef 24] [--snippet out.js]
```

It prints a standalone script. The agent hands that script to the browser's
`javascript_tool` (Claude in Chrome or the preview pane) on the open page. The script checks
each visible text against its real ground, composited up the parent chain, and returns JSON
with the pairs under the threshold and the clickable targets under 24 px. No axe-core, no
install.

For a desktop app, `scaffold.js denetim <Namespace>` writes a headless xUnit test that opens
the window and measures every text the same way (see Templates).

## Templates

```bash
node <plugin>/scripts/scaffold.js kur <AppName> [--simge app/simge.ico] [--anahtar usb-01]
node <plugin>/scripts/scaffold.js kur <AppName> --avalonia [--ns <Namespace>]
node <plugin>/scripts/scaffold.js ustcubuk [<Namespace>] [--avalonia|--react]
node <plugin>/scripts/scaffold.js durum [<Namespace>] [--avalonia|--electron]
node <plugin>/scripts/scaffold.js denetim <Namespace> [--wpf|--avalonia] [--pencere MainWindow] [--esik 7]
```

| Target | Writes | What it is |
|---|---|---|
| `kur` | `Kur.bat`, `kur-<name>.ps1` | A USB installer window: creeping progress bar, live log, finish and error screens, `-Prova` dry run. Updates in place; `-Onar` or the finish screen's Onar button rebuilds. Each stick carries its own deploy key under `.kurulum/anahtar/`. |
| `kur --avalonia` | `teknesyum-ui/kur/KurulumEkrani.axaml` | The same install flow as an Avalonia screen, beside the PowerShell panel. |
| `ustcubuk` | `teknesyum-ui/ustcubuk/` | The title bar: title, Teknesyum button, update badge, window buttons. React (logo, two-part name, language slot, drag region for Electron and Tauri) or, when the project has `.axaml`, Avalonia `TitleBar` + `KabukStilleri`. |
| `durum` | `teknesyum-ui/durum/` | The update surface: an Electron git sync with a title-bar badge, or the Avalonia `GuncellemePaneli`. |
| `denetim` | `teknesyum-ui/denetim/KontrastTests.cs`, `KabukTests.cs` | A headless contrast test: Avalonia.Headless.XUnit when the project has `.axaml` (the test project needs xunit v3), otherwise WPF on an STA thread with `VisualTreeHelper`. It measures every text run and icon, every button at rest, hover, pressed, focus and disabled, and the worst stop of a gradient ground; it writes `tmp/uc/kontrast-*.txt` plus window captures at 100/125/150 % and fails with every pair under the threshold. |

Every template file starts with a `teknesyum-ui template <path>` line. Hover and press stay
inside the button (nothing grows past its bounds: hover changes colour and border), and each Avalonia folder carries
`ekran/` captures of rest, hover, pressed, focus and disabled at 848×640. `KabukTests.cs`
checks that the sans face really loads, that no text sits below fs-2, and that every button
state fits its own clip. The scanner flags a window with no root font size, a `FontSans`
that is not embedded, and a title bar, update panel or install screen without the
signature line (`kabuk/*`).

Each target ends by naming the shelf book that governs what it just wrote, and says so
plainly when the shelf or the book is missing. An existing file is never overwritten. Project-specific install steps go in with
`--adimlar <file>`; the default installs npm packages and a desktop shortcut. Keep
`.kurulum/` and `.araclar/` out of the project's git.

## Preview

```bash
node ui/scripts/onizleme.js [--tarayici [--port 4317] [--no-open]]
```

Opens in its own Electron window (`ui/onizleme/masaustu/`, Electron is installed there on
the first run); `--tarayici` serves the same page on `127.0.0.1` instead.

The window has no system title bar. It draws the standard `tk-titlebar`: brand, Tek Görünüm and Önce / Sonra as tabs, theme picker, Sıfırla, Kopyala, İndir, Kaydet as the one outlined chip, and window controls with a restore glyph when maximised. Dragging, double-click to maximise, Aero Snap, edge resize and `Alt+F4` still work. A 1 px edge frames the window unless it is maximised. The whole app takes the settings live, and the Pencere Ve Üst Çubuk group sets the edge colour and the bar height.

The layout has three columns. The left one lists 15 components: colours, buttons, forms, title bar,
progress, scrollbar, background, badges, toasts, installer, modal, type, Akıcılık, Okunurluk and
Teknik. The middle one draws the chosen component with every example and state (normal, hover,
pressed, focus, disabled). The right one shows that component's settings first. The settings
include glow (none, thin, token, neon, custom), UI easing, duration scale, density, border
width, glass blur, shadow strength and scrollbar style. Akıcılık plays the easing curves side by
side, and Teknik measures FPS and frame time. `ui/templates/temalar/` holds ten themes
(`node ui/scripts/tema.js liste`, `denetle [ad]`), five light and five dark. Each passes 7:1 and
scores at least 85.

A page for trying new brand colours before touching the tokens. It
starts from `ui/templates/neon.tokens.json` and measures with the same `kontrast.js` the
scanner uses, served to the browser as is. The left panel sets blue, pink, their text cuts,
purple, surface and the background (flat, token gradient, glass, grid, glow; stops and
angle), font family, size scale, weights, radius, scrollbar width and colour, scroll
behaviour and reduced motion. The right side shows every tone-scale step, text-scale cut
and `on` pair with its hex and ratio on surface (under 7:1 is marked), blue and pink side by
side, buttons in all five states, badge, chip, input, selected row, title bar, progress,
a long scrolling list, the type scale and panel, card and glass. The "Uygulama Parçaları" tab draws the shipped
components from the standard's own CSS: title bar, sync and update badges, the installer panel
in three states, progress bars, buttons, toasts, a dialog and form fields. The "Okunurluk" tab turns contrast into one readability score from 0 to
100, higher is better (`ui/scripts/skor.js`, also `node ui/scripts/skor.js`): every text/fill
pair the standard CSS uses is scored on a log scale (3:1 → 30, 4.5:1 → 50, 7:1 → 70, 12:1 → 90,
18:1 → 100; large headings count 7/4.5 more) and weighted by how often it appears (×1–×10), so
body text, tabs and the primary button weigh most. It shows the score now against the token
file, per panel, the parts a colour change moved most and the parts under 70; the toolbar tab
carries the live score. Before / After puts the
token values next to the current ones. Export copies or downloads only the changed fields
in `neon.tokens.json` shape. **Kaydet** saves your settings privately: only the difference from
the token values goes to `teknesyum-private/teknesyum-ui/onizleme/ayarlar.json` (committed and
pushed to the private repo) or, without the private shelf, to the gitignored
`ui/onizleme/ozel-ayar.json`; the preview loads it on start. **Sihirbaz** walks every setting in
order (theme, surface and text, main colour, accents, states, background, type, shape, title
bar, glow, scrollbar, motion, readability) and ends with that private save; a fresh install
starts it once with the recommended token values selected. **Herkese Açık Yayınla…** in the
save dialog releases the values publicly: after a warning listing the
changes and the next version, `ui/scripts/kaydet.js` writes the token source and its copy,
re-measures every `on` pair and ratio rationale, swaps the old hex in the installer and
fixtures, runs `generate.js` and the tests (scanner included), bumps the minor version,
writes the CHANGELOG, then commits, tags, pushes and runs `gh release create`. Progress is
shown in the installer panel; any failure before the commit restores every file. Screenshots: `docs/onizleme/`.

## Tests

```bash
npm test
```

225 assertions, no dependencies. Seven of them are cost assertions: they fail if a hook
starts writing to `additionalContext` or `systemMessage`, if `SKILL.md` grows past 150
lines, or if a slash command reappears.

## Layout

```
ui/skills/teknesyum-ui/   SKILL.md, references/, assets/
ui/scripts/setup.js       install and generate
ui/scripts/generate.js    tokens -> theme.css, Theme.xaml, Theme.axaml, Palette.cs
ui/scripts/raf.js         reads the private shelf
ui/scripts/scan.js        the scanner
ui/scripts/rules/*.js     the rules, one module per domain
ui/scripts/scaffold.js    copies a template into a project
ui/templates/             installer, title bar, sync badge, progress bar
ui/hooks/guard.js         the Stop hook
ui/roles/ui-builder.md    the role an agent reads to build UI
docs/DECISIONS.md         why it is shaped this way
docs/RULE-API.md          how to write a rule
docs/EXTRACT.md           every rule of the old standard, and where it went
docs/coverage/            what the scanner enforces, and what it does not
```

## Turning it off

```bash
node <plugin>/scripts/setup.js --off
```

## Contributing

Open an issue before writing code, so nobody spends an evening on something already in
progress. Keep the pull request to one concern — a fix and a feature do not belong in the
same branch — and match the surrounding code.

The repository language is English: code, commit messages, README and issues. Run
`npm test` before opening the pull request; nothing merges red.

Contributions are accepted under the project's own licence, AGPL-3.0-or-later. Every commit
must be signed off under the Developer Certificate of Origin 1.1, reproduced in
[`DCO`](DCO) — add it with `git commit -s`. The longer version of all this is in
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

<div align="center">

<a href="https://github.com/sponsors/Teknesyum"><img src="assets/badge-sponsor.svg" alt="Support Teknesyum" height="38"></a>
&nbsp;
<a href="LICENSE"><img src="assets/badge-license.svg" alt="License AGPL-3.0" height="38"></a>

</div>
