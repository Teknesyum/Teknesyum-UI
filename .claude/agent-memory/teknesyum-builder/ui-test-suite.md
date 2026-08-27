---
name: ui-test-suite
description: Teknesyum-UI's only test command is `node test/all.js` — no dependencies, no package.json, exit 1 on any failure.
metadata:
  type: project
---

`node test/all.js` runs every suite (`cost`, `scanner`, `install`, `generate`) from
`test/*.js`. There is no package.json and no test framework.

**Why:** the plugin ships as plain Node scripts; the contract that created the suite
required a single dependency-free command, matching Teknesyum-Core's `test/all.js`.

**How to apply:** run it after touching anything under `ui/scripts/`, `ui/hooks/`, or
`ui/skills/teknesyum-ui/`. Scanner tests need `CLAUDE_CONFIG_DIR` pointed at an empty
directory, otherwise the machine's own `~/.claude/teknesyum-ui.json` leaks into the
"not configured" cases — `test/lib.js` `cleanEnv()` already does this.
