---
name: teknesyum-ui
description: Interface standard — the rules live on the private shelf, this skill reads them and the scanner enforces them. Use when changing an interface, adding an update or installer surface, or editing a README. React, Electron, WPF, Avalonia. Needs a teknesyum-ui.json.
---

# Teknesyum UI

## Gate

Look for `<project>/.claude/teknesyum-ui.json`, then `~/.claude/teknesyum-ui.json`.
The project file overrides the machine file field by field.

| Found | Do |
|---|---|
| Neither | **Do not apply this standard.** Keep the project's own style. If the turn produced UI, say once: `node <plugin>/scripts/setup.js` installs one. Do not repeat it. |
| `off: true` | Same, and do not offer. |
| A file, not off | In force. Its `note:` field beats everything below. |

## Where the rules are

The written standard is not in this file. It lives on the owner's private shelf and is
read on demand:

```
node <plugin>/scripts/raf.js <book>
```

| Work | Book |
|---|---|
| Any interface: colour, motion, forms, text, desktop window, verification, report | `ui-duzeni` |
| Update, auto-update, sync surface, installer window | `guncelleme-paneli` |
| README or repository document | `readme-protokolu` |
| Which preference books exist | no argument, it lists them |

Read a book **once per session**, when the work actually touches it. If it is already in
this conversation and no compact has happened since, do not read it again. The shelf is
the single source: never restate its rules here, in a project file, or in a comment.

If `raf.js` exits 1 there is no shelf on this machine. Then only the scanner's mechanical
rules apply — say so once, and do not invent a rule the scanner does not hold.

## Values

Never type a colour, radius, duration, size or spacing step. Setup generated them into
the project; read the one you need.

| Need | Read |
|---|---|
| Any token | the project's `theme.tokens.json`, or `--tk-*` in its `theme.css` |
| WPF / Avalonia resource names | its `Theme.xaml` / `Theme.axaml` |
| Framework quirks | `references/platform.md` |
| Checking a fixed window is actually usable in the real build | `references/primary-action-visibility.md` |

## Check

```
node <plugin>/scripts/scan.js <project-root>
node <plugin>/scripts/scan.js <project-root> --files a.css,b.tsx
```

The scanner is the mechanical rule set — tokens, states, motion properties, accessible
names, locale keys, and the update panel's contract. `--files` limits it to the files the
turn touched; the whole tree is only worth scanning when the work was broad.

## Update work

Asked for an update, auto-update or sync surface: read `guncelleme-paneli`, then write it
with `scaffold.js kur <Name>` / `scaffold.js durum`. Never hand-write the panel — the
template already carries the step contract, the creeping ceiling and the 16 ms timer, and
`scan.js --rules guncelleme` checks that what is in the project still matches.

A determinate progress bar takes `templates/ilerleme/react/ProgressBar.tsx` +
`progressbar.css`; a Tauri window checks `core/tauri-hidden-launch`,
`core/fixed-window-no-shrink` and `core/fixed-window-maximize-open`, a long `invoke`/`spawn`
call with no feedback checks `guncelleme/uzun-cagri-ilerlemesiz`, and a silent background
loop checks `guncelleme/sessiz-dongu`.

## Precedence

1. The config's `note:` field.
2. The shelf book for the work at hand.
3. `scan.js` findings.
4. `references/platform.md`.
5. The project's existing style.

A rule that is not on the shelf and not in the scanner is not part of the standard. Do not
infer one.
