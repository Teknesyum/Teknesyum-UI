# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Preview proposals: `ui/onizleme/oneri.json` loads a suggested colour set on start when the
  token file still holds its base values. The first one is fable's balanced readability set
  (blue #6ab2ff, disabled #9a9da6: score 85 → 87.4, consult 002).
- The preview now edits text, disabled, success and warning too; the save accepts glass-base.
- The desktop app keeps one window: a second launch reloads it, and the HTTP and code caches
  are cleared on start. The window title shows the version.
- Readability score (`ui/scripts/skor.js`): 0–100, higher is better, from every text/fill pair
  in the standard CSS, weighted by how often each part appears. A new "Okunurluk" tab in the
  preview shows it against the token file, per panel, the most affected and the weak parts;
  Kaydet shows the change and writes it into the release notes.
- Preview **Kaydet**: writes the changed fields into `neon.tokens.json` and its copy,
  re-measures `on` pairs and ratio rationales, swaps the palette in the installer and fixtures,
  regenerates, tests, bumps the minor version, writes this file, commits, tags, pushes and
  publishes a GitHub release (`ui/scripts/kaydet.js`; `POST /kaydet`, `GET /kaydet/durum`,
  `GET /surum`). Progress is drawn with the installer panel.
- Preview: an "Uygulama Parçaları" tab next to "Renkler" draws the shipped components from the
  standard's own CSS (`/standart.css` concatenates `theme.css`, `forms.css`, `states.css`, the
  title bar, progress bar, badge and installer panel): title bar, the five sync states, the
  two-step update badge, the installer in running, done and error, progress bars, buttons,
  toasts, a confirm dialog and form fields.
- `ui/templates/kur/panel.css`: the installer's web twin (step sentence, percentage, last nine
  log lines, buttons only once the job ends).
- Title bar tabs (`.tk-titlebar__tab`): no fill, blue text, pink-text on hover, the current
  page underlined.
- Update badge (`.tk-update`): yellow = download, green = install; sync badge gains the
  waiting and local states.

### Changed
- Preview `on` colours follow the save rule: a token pair that drops under 7:1 switches to the
  better of black and text, as Kaydet will ship it.
- Ratio comments in `generate.js` are measured, not literal; the manifest palette, `setup.js`
  fallbacks and the readability tests read their colours from the tokens.
- Blue `#5aa8ff` (a true blue, no longer cyan) and pink `#c82ee0` (fuchsia), pink-text
  `#f0abfc`. Border alpha 55 %, strong border 70 %. Every ratio in the rationales re-measured.
- Ghost button: colour only in the border, body text; hover purple-10 with its `on` text. The
  primary button no longer dims on hover; it scales to 1.02 on web, WPF and Avalonia.
- Readability pass on the neon tokens, from a fable consult (`docs/danisma/001-*`): text
  `#f2f3f6` on surface `#101115` (17.00:1) instead of pure white on near-black; purple
  `#9455ea`, purple-text `#d4b3ff`,
  black `#0a0b0e`, glass-base `#14151a`, success `#4ade80`, disabled `#7c7f88`. Borders
  55 / 70 / 20 %, panel 96 %, glass 90 %, glow 18 % blur 16, gradient 16 stops. Type: hero
  32 px at 800, line height 1.6 / 1.25 / 1.5, tracking label 0.08em, h3 0.02em, h2 0, hero
  -0.015em. Every `on` pair still clears 7:1; the narrowest is text on pink-60 and purple-60 at 7.50:1.
- The primary and danger button text, hero weight and scrollbar thumb read their tokens
  instead of `#000`, `900` and purple; the thumb is purple-text, pink-text on hover.
- `setup.js`, `manifest.js` and the installer template carry the new palette.
- Preview: opens in an Electron window by default (`--tarayici` keeps the local server);
  its defaults are background swing off, instant scrolling and reduced motion on.

## [0.7.0] - 2026-09-25

### Added
- Preview: `node ui/scripts/onizleme.js` serves `ui/onizleme/` on a local port and opens it.
  Blue, pink, their text cuts, purple, surface and the background design are tuned live
  against every tone step, `on` pair and component state, each with its ratio from the
  shared `kontrast.js`; Before / After mode; export of the changed fields only.
  Tested in `test/onizleme.js`.

### Changed
- `setup.js` writes the Avalonia signature as `teknesyum-ui/avalonia/Signature.axaml.example`.
  It needs `Teknesyum.Localization.Str` and a code-behind `Click` handler, so as a `.axaml`
  it broke `dotnet build` in a bare project; as an example it stays out of the compiled glob.

### Fixed
- `Theme.xaml` and `Theme.axaml` no longer carry `--` inside an XML comment. The generator
  cleans every comment, so a bare `avalonia.app` project builds with 0 errors on Avalonia
  11.3 and 12.1.
- The Stop hook counts only open findings; `ignored` and `fixed` findings no longer stop a turn.
- `scan.js --files`: project rules such as `core/focus-ring-missing` see the whole tree, so a
  focus style in another file counts; only the report is narrowed to the named files.

## [0.6.0] - 2026-09-24

### Changed
- Scaffold target `denetim`: the Avalonia and WPF contrast tests now measure every button at
  rest, hover, pressed, focus and disabled (disabled is reported, not failed), each run of a
  multi-colour text and every icon (`Shape` fill or stroke), and take the worst stop of a
  gradient ground or text brush. They write `tmp/uc/kontrast-<UC_ETIKET>.txt` and window
  captures at 100/125/150 %. The scaffold output names the test project's packages; the
  Avalonia test needs xunit v3.

### Fixed
- Reduced motion no longer writes `transform: none !important` on `*`. It cleared positioning
  transforms, so a modal centred with `translate(-50%, -50%)` slid to the lower right; motion
  now stops through animation and transition duration and a single iteration.
- `scan.js --fix`: `core/duration-ceiling` and `core/hardcoded-duration` no longer rewrite the
  period of an infinite animation (`animation-iteration-count: infinite` or the `infinite`
  shorthand); they report it without a fix.
- `scan.js --fix`: a leading-dot duration such as `.8s` was read as `8s` and rewritten to
  `.var(--tk-t-*)`; it now reads as 800 ms and becomes `var(--tk-t-*)`.

## [0.5.0] - 2026-09-24

### Added
- Contrast gate: every fill in the tokens carries an `on` text colour; `generate.js` measures
  each pair (translucent fills composited over the surface) and stops under 7:1, then emits
  `--tk-on-*` in CSS and `On*` brushes in XAML. Rule `okunurluk/pair-contrast` measures fill
  and text on the same element across CSS, Tailwind, JSX, XAML styles and triggers, and C#
  paint code; `scripts/denetim.js` prints a live-page audit snippet for `javascript_tool`;
  scaffold target `denetim` writes a headless Avalonia or WPF contrast test.

### Changed
- `core/contrast` exempts only the approved text colours; fill cuts used as text are measured.
  The danger button, ghost hover, title-bar hover and `TkIconButton` states take their `on`
  colours, since the old pairs measured under 7:1.

## [0.4.0] - 2026-09-23

### Added
- Template `ilerleme`: `templates/ilerleme/react/ProgressBar.tsx` + `progressbar.css`, a
  determinate progress bar filled with `transform: scaleX`, a scanning light on
  `::after`/`translateX` gated by `prefers-reduced-motion`, and a percentage shown beside the
  bar. Scans clean against the repo's own rules. Optional Rust setup snippet
  `templates/ilerleme/tauri/setup.rs` pairs with `core/tauri-hidden-launch`.
- Rule `core/tauri-hidden-launch`: a `tauri.conf.json` window without `"visible": false`.
- Rules `core/fixed-window-no-shrink` and `core/fixed-window-maximize-open`: a fixed-size
  window (`resizable: false` / `CanResize="False"`) with no shrinkable body area, or one
  that still leaves its maximize control on.
- Rules `guncelleme/uzun-cagri-ilerlemesiz` and `guncelleme/sessiz-dongu`: a long call
  (`invoke`/`ipcRenderer.invoke`/`spawn`/`Command`) with no progress or busy state in the
  same file, and a background `setInterval` loop with no status indicator.
- Reference `skills/teknesyum-ui/references/primary-action-visibility.md`: a
  `getBoundingClientRect` rehearsal for checking a primary button sits inside the window's
  real inner size, at 100/125/150% OS scale.

## [0.3.0] - 2026-09-13

### Added
- `raf.js`: reads the private shelf (`TEKNESYUM_PRIVATE`, else
  `<config>/teknesyum-private/private/tercihler/`). No argument lists the books, a name
  prints one. Exit `0` fine, `1` no shelf, `2` no such book.
- Rule module `guncelleme`: `panel-yok` (an app with updater code and no `kur-*.ps1`),
  `panel-sozlesmesiz` (an installer without the `Adim` contract, the ceiling or the 16 ms
  timer) and `rozet-token-disi` (a sync badge painted with a fixed colour).
- `scan.js --files a.css,b.tsx` limits the scan to the named files.
- `scaffold.js` ends each target by naming the shelf book that governs it, and says so when
  the shelf or the book is missing.
- Test suite `raf` and cases for `--files` and the scaffolder's shelf note.

### Changed
- `SKILL.md` no longer carries the prose standard. It says where the shelf is, which book
  belongs to which work, and that a book is read once per session. 132 lines to 80.
- The Stop hook scans only the files the turn changed and does not repeat a finding it has
  already made; the memory is cleared when the conversation is compacted.

## [0.2.1] - 2026-09-12

### Added
- Config `ignore` array: `[{ rule, file, line?, reason }]` silences a named finding.
  `reason` is required; an entry without one is refused on stderr and does not apply.
  The summary line ends with `N ignored` and `--json` keeps the row as
  `"ignored": true` with its `"reason"`.
- Avalonia tooltip forms recognised by `states/disabled-affordance`: the `ToolTip.Tip`
  attribute, a `<ToolTip.Tip>` body element, and a `Setter Property="ToolTip.Tip"`
  inside a `:disabled` style.
- Fixtures for the Avalonia tooltip forms, fenced evidence blocks, `default=` flags,
  `Get("key", a + b)`, and a named scrim `LinearGradientBrush`.
- CHANGELOG, CONTRIBUTING and DCO.
- Turkish README (README.tr.md) with language badges.
- `scaffold.js` with three templates: `kur` (USB installer window), `ustcubuk` (React
  title bar) and `durum` (Electron git sync badge).
- Scanner rules `process/sync-child-process` and `process/send-sync`.
- Skill section "The Best Program Shows It Is Working".

### Changed
- README links Teknesyum Core by full URL and explains the marketplace layout.
- `trash/` is no longer tracked.

### Fixed
- `states/disabled-affordance` no longer demands a WPF-only `ToolTip` attribute on
  Avalonia markup; it reads the element body as well.
- `forms/unmeasured-label` skips lines inside fenced code blocks — raw evidence is not
  a claim — and no longer counts `default=` flag values or the literal `(Default)`
  registry value name.
- `forms/no-sentence-concat` anchors the `t(` call on a word boundary, so `Get(`,
  `Format(` and `Print(` no longer read as locale calls.
- `colour/background-gradient` judges only shell backdrop brushes in XAML — an
  `x:Key` matching app/shell/window background, or a brush inside
  `<Window.Background>` / `<Application.Background>` — and counts distinct colours
  rather than `<GradientStop>` elements.

## [0.2.0] - 2026-09-01

First release after the split from Teknesyum Base on 2026-08-28.

### Added
- Interface standard rebuilt as generated token files plus a scanner: `setup.js`,
  `generate.js`, `scan.js` and rule modules under `ui/scripts/rules/`.
- Theme generation for `css`, `react`, `wpf`, `avalonia` and `winforms` targets.
- Stop hook (`ui/hooks/guard.js`) that scans changed interface files.
- `ui-builder` role bound to the tier table.
- Test suite with cost assertions (`npm test`).

### Changed
- Core contracts and leftovers moved out of this repository.
- Scanner reports exactly what it scans and no longer scans itself.

[Unreleased]: https://github.com/Teknesyum/Teknesyum-UI/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.3.0
[0.2.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.2.0
