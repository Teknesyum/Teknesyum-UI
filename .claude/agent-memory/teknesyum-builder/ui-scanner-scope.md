---
name: ui-scanner-scope
description: scan.js collects files by extension; a rule without `exts` runs against every collected extension, so widening the collector silently re-scopes old rules.
metadata:
  type: project
---

`ui/scripts/scan.js` has one collector (`SCAN_EXT`) feeding `ctx.files`, plus `MODULE_EXT`
feeding `ctx.modules`. Rules declare `exts`; a rule that omits it sees everything.

**Why:** widening the collector to `.cs .ts .js .md` made every `exts`-less CSS/XAML rule
start firing on prose and C#. The fix is to pin `exts` on the old rules, not to narrow the
collector.

**How to apply:** before adding an extension to `scan.js`, grep the rule modules for `id:`
lines with no `exts:` under them and pin each one to its real scope first. Generated
artifacts (`Palette.cs`, `theme.tokens.json`) are skipped by filename in `collect()`;
`theme.css` / `Theme.xaml` / `Theme.axaml` are skipped per-rule via `colour.js` `TOKEN_FILE`.

Acceptance runs are unstable while another agent is editing
`ui/skills/teknesyum-ui/assets/` — `setup.js --apply` copies straight from there, so a
scan of a fresh tmp project reflects their in-flight state, not your change. Re-run before
blaming yourself.
