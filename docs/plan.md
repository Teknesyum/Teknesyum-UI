# Plan: One Source For Signature Texts, Automatic Bulk Uc (0.19.0)

## Automatic Bulk Uc

- `ui/hooks/baslangic.js`: on SessionStart, compare the plugin version with
  `<config>/teknesyum-ui/toplu.json`. On change, run `uc.toplu(parent of git root, true)`,
  save the version, report the written projects in `systemMessage` only.
- Test: a new version writes the ledger lines once; the same version does nothing.

## Signature Texts

- `setup.js`: the default signature keeps only `off`, `github`, `sponsor`; `--apply` drops
  `text` and `supportText` from an existing config.
- `links.json`: drop `signatureText` and `supportText`.
- New rule `rules/etiket.js` (warning): a string literal equal to a signature label
  (brand, support, site, tr and en) or the legacy `by <brand>` in a UI file, code file or
  locale JSON outside `teknesyum-ui/`. The message points to `labels.*.json`.

## Palette In Project Config

- `setup.js`: the `neon` and `benim` templates no longer copy the palette into
  `.claude/teknesyum-ui.json`; `--apply` removes it. Only `custom` keeps it (the project's own
  colours). The status line reads the palette from the tokens file.

## Release

- CHANGELOG, version 0.19.0, tests, tag, gh release, plugin update.
