# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
