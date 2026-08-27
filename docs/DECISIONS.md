# UI decisions

Locked 2026-08-28. Each entry: decision, cost class, rationale. Second opinion on all
four came from a Fable advisor pass; its conditions are folded in and marked.

Cost classes and the standing law live in [Core's cost model](../../Teknesyum-Core/docs/COST-MODEL.md).

---

## What was wrong

Base had no continuous cost in the UI standard — no hook injection, no forced banner.
The defect was the size of the **O** class:

| Item | Class | Cost |
|---|---|---|
| skill name + description | S | ~130 tok per context |
| `SKILL.md`, 60 KB Turkish | O | ~27,000 tok, every turn that touches an interface |
| `references/` ×8, 130 KB | O | ~55,000 tok if read through |
| `uisetup` + `uicheckup` commands | S | ~45 tok |

A standard was written as doctrine for a model to read. Most of its content is either
something the model already does (contrast, `aria-label`, focus trap, form validation
shape) or **data** — a palette, a scale, a set of measurements.

---

## U1 — The standard is data plus a scanner, not doctrine

Three destinations, and every rule goes to exactly one:

| Kind | Destination | Class |
|---|---|---|
| Arbitrary value — colour, radius, duration, scale step | `theme.tokens.json`, generated artifacts | **Z** |
| Mechanically checkable rule | `scan.js` assertion | **Z** |
| Runs against the model's default, or a static scan cannot see it | `SKILL.md` | **O**, paid once |

`references/` collapses from eight files to one: platform quirks — the Avalonia
`Theme=` versus `Style=` split, WPF's half-drawn outline, shared transform objects.
That is the only cluster a model does not already know.

Everything else is dropped. The test is one question: *would the model do this without
being told?* If yes, it is not worth a token.

---

## U2 — Enforcement is a scanner behind two gates

`scan.js` produces findings. A Stop hook runs it when interface files changed and blocks
on a violation. The model never reads the rules; it meets them when it breaks one.

*Fable's conditions, accepted:*

1. **The hook exits before doing anything when no `teknesyum-ui.json` exists or
   `off: true` is set.** Same shape as Core D6: for a project that never asked for the
   standard, this plugin does not exist. Without the gate, a Stop hook would block work
   in a repository that never opted in.
2. **Two blocks per file per session, then it stands down.** UI rules carry more
   interpretation than Core's contract rules. An uncapped gate turns a genuine
   disagreement into a locked session; Core D6 already paid for that lesson.

Cost: zero on an ordinary turn, one message under 200 characters when it actually fires.

*Fable's catch, accepted:* a static scan cannot see a render. The "no *done* without
looking at the running application" rule and the motion baseline cannot move to **Z** —
they stay in `SKILL.md`, or the enforcement layer quietly drops the most visual rules.

---

## U3 — Five targets stay

CSS, React, WPF, Avalonia, WinForms. Generated files sit on disk in the target project
and never enter context, so breadth costs nothing at read time. It is maintenance load,
not token load, and the two must not be confused.

---

## U4 — Neon is a template, not the standard

Consistent with Core D6: a personal convention is not baked into a published tree.
`setup.js` offers neon as the ready answer and can derive a user's own palette on the
same schema. The plugin then means something to someone who is not the author.

---

## U5 — Surface

Zero slash commands, one skill, one role file — Core D3 applied unchanged.
`/uisetup` and `/uicheckup` become `setup.js` and `manifest.js`, invoked by the skill.

## Language

English throughout, including config keys: `off`, `palette`, `typography`, `signature`,
`targets`, `note`. Base's Turkish keys are read for compatibility and not documented.
Roughly 40% fewer tokens for identical meaning, before any content is cut.
