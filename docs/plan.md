# Plan: Every Preview Choice Reaches The App (Issue #1)

## Problem

The preview saved eight choice groups as notes, not tokens. Setup copied the notes into the
config, and the generator hard-coded what those choices should drive. A project bound to the
owner's layout looked like the public default.

## Steps

1. `ui/scripts/esle.js` — one mapping from preview state to tokens, shared by the browser and
   Node: `ilkDurum(T)`, `tokenFarki(T, su, ilk)`, `durumdan(T, fark)`, the key table, and the
   layout-match gate (`--denetle`) plus a rewrite of the saved tokens (`--yaz`).
2. Tokens: `derived.bg-gradient` gains `type`, `angle`, `rotate`; `derived.glass` gains `blur`;
   new `derived.scrollbar-thumb`, `shape.window-edge`, `metric.btn-h`, `metric.btn-px`,
   `metric.scrollbar-style`, `metric.scroll-behavior`. Same in `neon.tokens.json` and the
   assets copy.
3. `kaydet.dogrula` accepts every new field; notes are gone.
4. `generate.js`: CSS, WPF, Avalonia and the C# palette read every token above; no literal
   radius, border, padding, blur, shadow, height or easing is left in a component rule.
5. The preview uses `esle.js` for export and state; `disaAktar` writes no `_` notes.
6. `setup.js`: no `notlar` in the config; generated files refresh when the plugin version
   changes; `--apply` runs the gate and prints its result.
7. `uc.js` and the private `ui-denetim` book: "düzen eşleşmesi 0 fark" is a finish criterion;
   usability evidence is preview and app screenshots side by side.
8. Tests, docs, release 0.12.0, DustyBytes re-apply, close issue #1.
