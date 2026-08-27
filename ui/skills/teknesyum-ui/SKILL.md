---
name: teknesyum-ui
description: Interface standard — palette, type scale, motion baseline, states, signature. Use when writing or changing an interface: component, panel, page, window, CSS, XAML, theme. Web, React, Electron, WPF, Avalonia. Applies only where a teknesyum-ui.json exists.
---

# Teknesyum UI

## Gate

Look for `<project>/.claude/teknesyum-ui.json`, then `~/.claude/teknesyum-ui.json`.
The project file overrides the machine file field by field.

| Found | Do |
|---|---|
| Neither | **Do not apply this standard.** Keep the project's own style. If the turn produced UI, say once: `node <plugin>/scripts/setup.js` installs one. Do not repeat it. |
| `off: true` | Same, and do not offer. |
| A file, not off | In force. Its `note:` field beats every rule below. |

## Values

Never type a colour, radius, duration, size or spacing step. Setup generated them into
the project; read the one you need.

| Need | Read |
|---|---|
| Any token | the project's `theme.tokens.json`, or `--tk-*` in its `theme.css` |
| WPF / Avalonia resource names | its `Theme.xaml` / `Theme.axaml` |
| Framework quirks | `references/platform.md` |

## Check

```
node <plugin>/scripts/scan.js <project-root>
```

That scanner holds the mechanical rules — tokens, states, motion properties, accessible
names, locale keys. It is the rule set. This file carries only what a static scan cannot
see, and what you would otherwise get wrong.

## Overrides

### Colour

- Dark only. Ignore `prefers-color-scheme: light`. A light theme means measuring all
  eleven colours again.
- Filled neon buttons take black text. White on neon is 1.38:1.
- No mid greys. If text is worth showing, show it white; otherwise delete it.
- Hierarchy is size, not weight or brightness: one step up the scale, never embolden.
- Pink and purple measure ΔE 5.8 apart — never the sole difference between two things on
  one screen. Make one blue, or add a second carrier.
- There is no `info` colour. A neutral notice takes the default border and white text.
- `warning` is text, border and icon. Never a fill, never a button.
- Glow goes on boxes, never on text. One exception: the hero number.
- Any outward glow needs 24px of clear space, or use a `/50` border instead.
- Never glow a list row, table row, cell, or anything from `.map()` / `ItemsControl`.
  Glow the container. The cost is scroll repaint, not element count.
- Under `forced-colors`, hand the UI to the system palette. Do not defend the neon.

### Motion

- Motion is the baseline, not decoration. Panels, tabs, list changes, notifications,
  value changes and loading animate. "Didn't seem necessary" is not a reason.
- The focus ring appears in 0 ms — the one exception.
- Loading shows a skeleton holding the incoming layout, not a spinner.

### Forms and dialogs

- No placeholders. Visible label, help text below the field.
- Confirmation modals ignore backdrop clicks; info modals close on them. `Esc` closes both.
- Do not confirm a reversible action. Do it, then offer undo.
- Error toasts never auto-dismiss. Others live 6 s; hover and keyboard focus pause it.

### Text

- Table headers and cells centre both ways.
- Every visible label, sentences included: first letter capital, rest lowercase.
  Conjunctions stay lowercase. Turkish needs its own casing map — `toLocaleUpperCase('tr')`.
- UI copy follows the config's `language` (default `tr`). Repository README and technical
  docs are English regardless.

### Scope

- Take behaviour libraries. Never visual theme libraries — no MUI, WPF UI, MahApps,
  HandyControl.
- Check the licence before copying a component; unlicensed means owned. Record every
  borrow in `docs/licenses.md`.
- Showy effects — WebGL, particles, scroll scenes, `gsap` — belong on a separate promo
  page, never in the application.

### Desktop

- Remove the system title bar and draw your own, then restore what you broke: drag,
  double-click maximise, Aero Snap, edge resize, `Alt+F4`.
- The signature block from the config's `signature` field sits in the title bar, left of
  minimise. Not the footer, not settings. Fully opaque at rest; hover is `scale(1.02)`,
  never opacity.

## Verification

Compiling proves nothing, and a static scan cannot see a render.

Open the application once per stage, screenshot it, and confirm the captured window's
process path is this repository's binary. In that one pass walk: minimum window size,
every tab, hover / focus / selected / disabled / open-dropdown, panel bottom edges, the
motion baseline, keyboard traversal, and a language switch. Error and empty screens
included.

For a suspect edge, crop and magnify at least 4× nearest-neighbour. Blurred scaling hides
a half-drawn stroke; 1 DIP is invisible at 1:1.

## Report

End a UI task with an impact block: `file:line`, the rule, what changed — and the rules
you did **not** apply, with the reason. The user cannot read that out of the diff.

## Precedence

1. The config's `note:` field.
2. This file.
3. `scan.js` findings.
4. `references/platform.md`.
5. The project's existing style.

A rule that is not here and not in the scanner is not part of the standard. Do not infer one.
