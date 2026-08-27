---
name: fixture-harness
description: How Teknesyum-UI verifies scanner rules — test/all.js, the two fixture layouts, and the one harness/production mismatch to watch for.
metadata:
  type: reference
---

`node test/all.js` is the whole suite (cost, scanner, install, generate). Its `scanner`
section requires EVERY rule in `ui/scripts/rules/*.js` to have a bad/good fixture pair
under `ui/scripts/rules/__fixtures__/<module id>/`, and fails the module if any pair
misbehaves. Two layouts, both accepted, flat tried first:
- flat: `<rule-id>.bad.css` / `<rule-id>.good.css` (colour, states)
- directory: `<rule-id>/bad/*` and `<rule-id>/good/*` (forms, core) — required for
  `projectRules` that need several files or a `package.json`

`__fixtures__/states/_run.js` is a standalone runner for that one module; the other
modules have none, so `test/all.js` is the real gate.

**Watch out:** the harness stages fixtures with `test/lib.js` `walk()`, which collects
EVERY file, while production `scan.js` collects only `.css .tsx .jsx .vue .svelte .xaml
.axaml` plus `.ts .js .mjs .cjs`. A rule that reads `package.json` or `locale/*.json`
therefore sees a different file set in the two places. That gap hid a dead
`core/installed-unused` for a while.
