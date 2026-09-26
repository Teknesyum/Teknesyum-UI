# ui/hooks

Plugin hooks, registered in `hooks.json`. `ortak.js` holds the shared helpers (git root,
config read, UI-file test, shelf commands) — read it before touching any hook here.

- `baslangic.js` — SessionStart. Silent by default; tells the agent to set up/scan the
  interface first when UI files exist with no config, no audit, or a stale layout hash, or
  leaves a short note on the first UI file with no config yet.
- `once.js` — PreToolUse (Write/Edit/MultiEdit). Denies writing a UI file when the project
  has no `teknesyum-ui.json` at all.
- `guard.js` — Stop. Runs the scanner on files the turn touched and blocks on a violation;
  stands down after two blocks on the same file.

All three exit early for the plugin's own repo, for `off: true`, and (`baslangic.js` only)
on a compact. Keep new hooks this cheap — a hook that speaks on every turn is a cost, not
a feature.
