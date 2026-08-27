---
name: teknesyum-ui-standard-state
description: Teknesyum-UI is the standard ITSELF, not a consumer — scan.js findings here mean the standard failed its own rules, and generated vs static assets have different fix paths.
metadata:
  type: project
---

In the `Teknesyum-UI` repo the standard is the product, so `ui/scripts/scan.js` runs
against the standard's own generated output. A finding here is never "fix the project" —
it is one of three verdicts: broken asset, false-positive rule, or a deliberate exception.

**Why:** a UI standard that cannot pass its own scanner has either bad assets or bad rules.
Contract K (2026-08-28) resolved 28 such findings: 8 asset/generator, 15 rule narrowings,
5 exceptions.

**How to apply:**
- `theme.css`, `Theme.xaml`, `Theme.axaml`, `Palette.cs` are `generate.js` output. Never
  hand-edit them in `assets/` — the copies there are stale. Fix `ui/scripts/generate.js`.
- Everything else in `ui/skills/teknesyum-ui/assets/` (`a11y.css`, `forms.css`,
  `states.css`, `Forms.xaml`, `States.xaml`, `Signature.*`) is edited directly.
- Deliberate exceptions go in `docs/coverage/exceptions.md`, defined by PATTERN, and must
  be pinned by a `good` fixture.
- `forms.css` is still Turkish (class names `tk-toast-yigin`, attributes
  `data-tk-giriyor`, all comments) although BRIEF.md requires English. Translating it is
  its own job — check whether it has been done before assuming.
