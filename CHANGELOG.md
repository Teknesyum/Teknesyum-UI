# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- CHANGELOG, CONTRIBUTING and DCO.
- Turkish README (README.tr.md) with language badges.

### Changed
- README links Teknesyum Core by full URL and explains the marketplace layout.
- `trash/` is no longer tracked.

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
