# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/Teknesyum/Teknesyum-UI/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.2.0
