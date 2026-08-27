# Extracted standard

## DATA

| Value | Where it lives now | Token name | Note |
|---|---|---|---|
| `#00f3ff` | SKILL §2, tokens `marka.blue` | `blue` | existing |
| `#ff00ea` | SKILL §2, tokens `marka.pink` | `pink` | existing — fill only |
| `#b026ff` | SKILL §2, tokens `marka.purple` | `purple` | existing — fill only |
| `#ff54eb` | SKILL §2, tokens `marka.pink-text` | `pink-text` | existing — text cut |
| `#c67eff` | SKILL §2, tokens `marka.purple-text` | `purple-text` | existing — text cut |
| `#08090a` | SKILL §2, tokens `marka.surface` | `surface` | existing |
| `#000000` | SKILL §2, tokens `marka.black` | `black` | existing |
| `#0a0a0f` | tokens `marka.glass-base` | `glass-base` | existing |
| `#34d399` | SKILL §2, tokens `rol.success` | `success` | existing |
| `#fbbf24` | SKILL §2, tokens `rol.warning` | `warning` | existing — surface/text/border only |
| `#ffffff` | SKILL §2, tokens `rol.text` | `text` | existing |
| `#71717a` | SKILL §2, tokens `rol.disabled` | `disabled` | existing |
| `danger` → pink, `danger-text` → pink-text, `text-label` → blue | tokens `rol.*` | role refs | existing |
| `warning-border` = warning @ 0.5 | tokens `rol.warning-border` | `warning-border` | existing |
| panel = surface @ 0.95 | tokens `turetilmis.panel` | `panel` | existing |
| glass = glass-base @ 0.85 | tokens `turetilmis.glass` | `glass` | existing |
| border 0.5 · border-strong 0.6 · border-decorative 0.3 | tokens `turetilmis.*` | `border*` | existing |
| alpha ladder 10 / 20 / 30 / 50 / 60 on blue, pink, purple | tokens `ton-merdiveni` | `<base>/<step>` | existing |
| text ladder step 50 on pink-text, purple-text | tokens `metin-merdiveni` | — | existing |
| glow: alpha 0.3, blur 20 | tokens `turetilmis.glow` | `glow-<base>` | existing |
| glow-hero: alpha 0.8, blur 8 | tokens `glow-hero` | `glow-hero` | existing |
| glow-button: alpha 0.35, blur 20 (`0x59`) | tokens `glow-buton` | `glow-buton` | existing |
| bg gradient: black → surface, 11 stops | tokens `bg-gradient` | `bg` | existing |
| panel drop shadow `0 0 40px rgba(0,0,0,0.8)` | components.md Panel | `shadow-panel` | missing |
| 90 / 160 / 240 / 360 ms | tokens `sure`, SKILL §5.4 | `t-instant` … `t-slow` | existing |
| 48000 ms background rotation | tokens `sure.bg-donus` | `bg-donus` | existing |
| `cubic-bezier(0.2,0,0,1)` / `(0.4,0,1,1)` / `(0.34,1.36,0.64,1)` | tokens `easing` | `e-out` `e-in` `e-spring` | existing |
| Sans chain: Atkinson Hyperlegible Next → Segoe UI → system-ui, -apple-system, sans-serif | tokens `font.sans` | `font-sans` | existing |
| Mono chain: Cascadia Mono → Consolas → ui-monospace, 'Courier New', monospace | tokens `font.mono` | `font-mono` | existing |
| Type scale 14 / 16 / 20 / 24 / 30 (1.25 major third) | SKILL §3 | `fs-1` … `fs-5` | missing |
| Weights: body 400, h2/h3/label/mono 600, hero 900 | SKILL §3 | `fw-*` | missing |
| Tracking 0.15 / 0.05 / 0.02 / −0.01 em | SKILL §3 | `tr-label` `tr-h3` `tr-h2` `tr-hero` | missing |
| Line heights 1.5 / 1.2 / 1.4 | SKILL §3 | `lh-body` `lh-heading` `lh-mono` | missing |
| Max measure 65ch | SKILL §3 | `measure` | missing |
| Radius 6px (single) | SKILL §5, layout.md §5.1 | `r` | missing |
| Window shell radius 12px | desktop.md §10 | `r-window` | missing |
| Spacing ladder 4 / 8 / 12 / 16 / 24 | SKILL §5 | `sp-1` … `sp-5` | missing |
| Panel padding 24, section gap 24, row gap 12 | SKILL §5 | — | missing |
| Min target 24×24 DIP | SKILL §5.3 | `target-min` | missing |
| Focus ring: 2 DIP outline, 2 DIP offset, inner `#000000` | SKILL §5.3 | `focus-w` `focus-offset` | missing |
| Avalonia focus adorner radii 7 / 9 DIP | avalonia.md §10 | — | missing (derived from r) |
| Scrollbar track 10 DIP | SKILL §5.3 | `scrollbar-w` | missing |
| Tabs: outline 1 DIP inset, 8 DIP gap, 2 DIP bottom safe area | SKILL §5.3 | — | missing |
| Checkbox 20×20 draw, 24×24 cell | SKILL §5.3 | — | missing |
| Info badge 12×12, 6 DIP from text | SKILL §5.3 | — | missing |
| Window buttons 42×30 DIP, glyph 12pt, icons 10–12px | SKILL §5.3, desktop.md §10 | — | missing |
| Title bar height 32–40px | SKILL §4, desktop.md §10 | `titlebar-h` | missing |
| Footer strip height 18px | desktop.md §10 | — | missing |
| Sidebar 240 DIP open / 48 DIP collapsed | layout.md §5.7 | — | missing |
| Text input min-height 40px, h-padding 12px | forms.md §1 | `input-h` | missing |
| Field inner gap 8px, between fields 16px | forms.md §1 | — | missing (ladder) |
| Modal width `min(560px, 90vw)` | forms.md §3 | `modal-w` | missing |
| Modal max height ratio 0.85 | forms.md §3 | `modal-max-ratio` | missing |
| Modal scrim `rgba(0,0,0,0.6)` / `#99000000` | forms.md §3 | `scrim` | missing |
| Toast width `min(360px, 100vw − 48px)` | forms.md §4 | `toast-w` | missing |
| Toast max visible 3, life 6000 ms, danger persistent | forms.md §4 | `toast-max` `toast-life` | missing |
| Toast inset 24px, stack gap 12px | forms.md §4 | — | missing (ladder) |
| Glow clearance 24px | SKILL §2, motion.md M15 | `glow-margin` | missing |
| Hover `scale(1.02)`, press `scale(0.98)`, icon hover `1.1` | SKILL §5, §5.4 | `scale-hover` `scale-press` | missing |
| Entry offset 8 DIP; menu/tooltip offset 4 DIP | SKILL §5.4 | — | missing |
| List stagger 40 ms, max 6 items | SKILL §5.4, motion.md M8 | `stagger` | missing |
| Empty→filled stagger 40 ms | SKILL §5.4 | — | missing |
| Loading loop ≥ 1.4 s | SKILL §5.4, motion.md M2 | `loading-loop-min` | missing |
| Background rotation ≥ 40 s, angle sweep ≤ 20° | SKILL §2, motion.md M10 | — | missing |
| Avalonia bg layer: sweep 8.42°, scale 1.12 | avalonia.md §5 | — | missing |
| Frame budget 16 ms (95th pct) | motion.md M15 | — | missing |
| Icon sizes 14 / 16 / 22 / 56 | components.md | — | missing |
| Resize grip 7px on three edges | desktop.md §10 | — | missing |
| Selection background = blue/30, caret = blue | forms.md §1 | — | existing (border-decorative) |
| Support link `https://github.com/sponsors/Teknesyum`, GitHub `https://github.com/Teknesyum` | assets/links.json | — | existing |

## SCAN

| Rule | Check | Severity | Source |
|---|---|---|---|
| No raw hex / rgb in components | color literal outside token files | error | SKILL §8.1 |
| No arbitrary Tailwind palette (`text-cyan-400`) | class matching built-in color scale | error | SKILL §6 |
| No mid greys `#d1d5db` `#9ca3af` `#6b7280` | literal match | error | SKILL §2 |
| Only tokenized radii | `border-radius` / `CornerRadius` not `--tk-r`, `--tk-r-window`, or 50%/full | error | SKILL §5 |
| No Tailwind default radius/tracking/size utilities | `rounded-2xl`, `tracking-widest`, `text-xl` | error | components.md |
| Type sizes come from the 5-step scale | font-size literal not in 14/16/20/24/30 | error | SKILL §3 |
| No font-size below 14 | numeric compare | error | SKILL §3 |
| Weight 700 forbidden outside hero | `font-weight: 700` / `Bold` in heading or label role | error | SKILL §3 |
| `line-height` always declared on text roles | missing declaration | warn | SKILL §3 |
| WPF text styles carry `LineStackingStrategy="BlockLineHeight"` | attribute present where `LineHeight` set | error | SKILL §3 |
| Body sets `font-variant-numeric: tabular-nums` / `NumeralAlignment="Tabular"` | declaration present | warn | SKILL §3 |
| Data numbers use mono class | `.tk-mono` / `MonoValue` on value cells | warn | SKILL §3 |
| Mono value color is `pink-text`, never `pink` | selector color compare | error | SKILL §3 |
| Ghost button text is `purple-text`, never `purple` | selector color compare | error | SKILL §2 |
| Filled button text is `#000` | `.tk-btn-primary` / `-danger` color | error | SKILL §2 |
| Default border is `/50`; `/30` only on decorative selectors | alpha step per selector role | error | SKILL §2 |
| `warning` never used as fill or button background | `background` using warning token | error | SKILL §2 |
| No `--tk-info` token or info variant | token/class name exists | error | SKILL §2, forms.md §4 |
| Unused token = debt | token declared but never referenced | warn | durumlar.md 1b |
| No white backgrounds | `background: #fff` / `White` on panel, row, dialog | error | SKILL §2 |
| Background is the 11-stop gradient, not flat black | gradient stop count ≥ 11 | error | SKILL §2, layout.md §5.2 |
| WPF gradients use `ColorInterpolationMode="ScRgbLinearInterpolation"` | attribute present | error | layout.md §5.2 |
| No glow on text | `text-shadow` / `drop-shadow` outside hero selector | error | SKILL §2 |
| Hero glow is the token, never inline | inline blur/opacity numbers | error | SKILL §2 |
| No glow on repeated items | glow declared on list/row/cell/item-template selector | error | motion.md M15 |
| WPF: no `DropShadowEffect` inside `ItemsControl` item templates | XAML tree walk | error | motion.md M15 |
| At most one `backdrop-filter` per scroll path | count per container | warn | motion.md M15 |
| Only `opacity` and `transform` animated | `transition-property` / animated props include size, color-shadow, filter | error | SKILL §5.4 |
| No duration above 360 ms except `bg-donus` | numeric compare | error | SKILL §5.4 |
| No raw durations/easings | literal `ms`/`s`/`cubic-bezier` outside token file | error | SKILL §5.4 |
| `prefers-reduced-motion` block exists and contains `transition-property: opacity` and `transform: none` on `*` | block parse | error | SKILL §5.4, motion.md M4 |
| React root has `<MotionConfig reducedMotion="user">` | AST search | error | motion.md M13 |
| Infinite loops only under `motion-safe:` and only for progress or app background | `animation-iteration-count: infinite` audit | error | SKILL §5.4 |
| WPF storyboards read `SystemParameters.ClientAreaAnimation` | reference present per infinite storyboard | error | motion.md M4 |
| WPF storyboards are `Freeze()`d and touch only `RenderTransform`/`Opacity` | XAML/C# scan | error | motion.md M14 |
| Avalonia: `RenderTransform` set as string, not object | `<ScaleTransform>` inside `Setter` | error | avalonia.md §9 |
| Focus uses `:focus-visible`, never bare `:focus` | selector scan | error | SKILL §5.3 |
| Focus ring is two layers (outline + inner box-shadow) | rule shape | error | SKILL §5.3 |
| No `opacity` change between component states | `opacity` in state layer | error | durumlar.md 1e |
| No `disabled:opacity-*` | class scan | error | components.md |
| Disabled controls carry `title`/`ToolTip` and `cursor: not-allowed` | attribute presence | error | SKILL §2 |
| All five states defined per component; empty cell forbidden | matrix parse of durumlar.md vs components.md headings | error | durumlar.md §6 |
| State layer declares only the seven allowed properties | property whitelist | error | durumlar.md 1a |
| State layer binds to `data-tk` attributes, not invented classes | selector vs fixture | error | durumlar.md §2.1 |
| Hover signal always paired with `:focus-visible` | selector list check | error | durumlar.md 1c |
| Pressed state has a non-transform carrier | state row has color change | error | durumlar.md 1d |
| No named interactive element without an accessible name | `aria-label` / `AutomationProperties.Name` on icon-only controls | error | SKILL §5.8 |
| `aria-label=""` forbidden | attribute value empty | error | a11y.md §1 |
| Icons inside named buttons carry `aria-hidden` + `focusable="false"` | attribute check | error | a11y.md §1 |
| sr-only never uses `display: none` | class definition | error | a11y.md §1 |
| Progress uses `role="progressbar"`, not `aria-live` | attribute check | error | a11y.md §2 |
| `assertive` only on error regions | value audit | warn | a11y.md §2 |
| `forced-color-adjust: none` only on colour-sample selectors | selector allowlist | error | a11y.md §3 |
| Hero glow gets `filter: none` under `forced-colors` | block present | error | a11y.md §3 |
| No placeholder attribute | attribute scan | error | forms.md §1 |
| Error field has `aria-invalid` **and** `aria-describedby` | paired attributes | error | forms.md §2 |
| `role="alert"` only on persistent danger toast | occurrence audit | error | forms.md §2, §4 |
| Error border is the full `danger` hex, not `/50` | value compare | error | forms.md §2 |
| Toast stack capped at 3 by CSS/`TkToastEnFazla` | rule present | error | forms.md §4 |
| No `MessageBox.Show` | call scan | error | desktop.md §10 |
| Panels use `MinHeight`, never fixed `Height` | XAML attribute | error | layout.md §5.1, desktop.md §7.1 |
| `UseLayoutRounding` / `SnapsToDevicePixels` not disabled | attribute value `False` | error | layout.md §5.1 |
| Template outline is the template root, not a sibling | XAML tree shape | error | desktop.md §7.1 |
| `ItemsControl` containers get their own template when outlined | `TabControl`/`ToolBar`/`Menu` template override present | error | desktop.md §7.1 |
| No UI string literals in code | literal text outside `locale/*.json` | error | SKILL §3.1 |
| `locale/tr.json` and `en.json` share an identical key set | key diff | error | desktop.md §9 |
| Placeholders are named `{count}`, not positional `{0}` | pattern scan | error | desktop.md §9 |
| No string concatenation of sentence fragments | pattern scan | warn | desktop.md §9 |
| No UPPERCASE UI labels | text case check on locale values | error | SKILL §3 |
| Turkish casing uses `toLocaleUpperCase('tr')` / `CultureInfo("tr-TR")` | call scan | error | SKILL §3 |
| Paragraphs in UI copy ≤ 4 lines, blank line between | locale/help text lint | warn | SKILL §3.2 |
| No prebuilt theme library (WPF UI, MahApps, HandyControl, MUI) | dependency scan | error | SKILL §1 |
| `gsap` absent from application code | dependency/import scan | error | SKILL §5.5 |
| Every borrowed component recorded in `docs/licenses.md` | file line presence | warn | SKILL §5.6 |
| Unmeasured numbers carry the `(default, unmeasured)` label | doc lint | warn | forms.md preamble |

## SKILL

| Rule | Why it must stay | Words |
|---|---|---|
| Opt-in gate | Model applies a loaded skill by default | No `teknesyum-ui.json` in project or home: do not apply this standard; keep the project's own style. |
| Dark only | Model auto-generates a light variant | Dark only. Ignore `prefers-color-scheme: light`. A light theme means measuring all 11 colours again. |
| Motion is baseline | Model ships static UIs unless told | Motion is required, not decoration. Panels, tabs, list changes, notifications, value changes and loading must animate; "didn't seem necessary" is not a reason. |
| Focus ring never animates | Model would transition it with everything else | Focus ring appears with 0 ms — the one exception to the motion baseline. |
| No text glow | Neon prompt makes the model glow everything | Glow goes on boxes, never on text. Only exception: the hero number. |
| Black text on filled buttons | Model defaults to white on coloured fill | Filled neon buttons take `color: #000`. White on neon is 1.38:1. |
| No dim text | Model builds hierarchy with grey | No mid greys. If text is worth showing, show it white; otherwise delete it. |
| Hierarchy by size | Model reaches for bold and brightness | Heading hierarchy is size: 24 / 20 / 14. Need emphasis? Go one step up, don't embolden. |
| Pink and purple are indistinguishable | Model cannot see this; measured ΔE 5.8 | Pink and purple can never be the sole differentiator on one screen. Make one blue or add a second carrier. |
| No `info` role | Model invents one for status sets | There is no `info` colour. A neutral notice takes the default border and white text. |
| Warning is surface-only | Model uses amber as a fill | `warning` is text, border and icon only. Never a fill or a button. |
| No placeholder | Model adds placeholders reflexively | No placeholders. Visible label plus help text below the field. |
| Confirm modals ignore backdrop clicks | Model closes every overlay on outside click | Confirmation modals do not close on backdrop click; info modals do. `Esc` closes both. |
| Danger toasts persist | Model auto-dismisses everything | Error toasts never auto-dismiss. Others live 6 s; hover and keyboard focus pause the timer. |
| Modal is last resort | Model asks "are you sure?" by default | Don't ask for confirmation on reversible actions. Do it, then offer undo. |
| Skeleton, not spinner | Model reaches for a spinner | Loading shows a skeleton that holds the incoming layout, not a spinner. |
| Surrender neon under forced-colors | Model tries to preserve the design | Under `forced-colors`, hand the UI to the system palette. Don't defend the neon. |
| Glow needs clearance | Invisible in code, only in layout | Any outward glow needs 24px of clear space around it; otherwise use a `/50` border instead. |
| Glow off repeated items | Cost is scroll repaint, not element count | Never glow list rows, table rows, cells or anything produced by `.map()` / `ItemsControl`. Glow the container. |
| Draw the title bar | Model keeps the OS chrome | Remove the system title bar and draw your own — then restore drag, double-click maximise, Aero Snap, edge resize and `Alt+F4`. |
| Signature placement | Non-obvious, and easy to bury in settings | The signature block sits in the title bar, left of minimise: `Destek ☕` then `Teknesyum`. Not the footer, not settings. |
| Signature is opaque at rest | Measured: 0.8 opacity broke contrast | The signature is fully opaque at rest; hover feedback is `scale(1.02)`, never opacity. |
| Centre table content | Model left-aligns tables | Table headers and cells are centred horizontally and vertically. |
| First letter capital | Model title-cases or upper-cases labels | Every visible label, including full sentences: first letter capital, rest lowercase. Conjunctions stay lowercase. Turkish casing map required. |
| Turkish UI, English docs | Model follows the prompt language everywhere | UI text is Turkish; repository README and technical docs are English. |
| Promo page exception | Model applies app limits everywhere | Showy effects (WebGL, particles, scroll scenes, `gsap`) are allowed on a separate promo page only, never in the app. |
| No prebuilt theme libraries | Model installs MUI/WPF UI to move fast | Take behaviour libraries (Base UI), never visual theme libraries. |
| Licence before copying | Model copies components silently | Check the licence before copying a component; unlicensed means owned. Record every borrow in `docs/licenses.md`. |
| Verify by running, in batches | Model calls "compiles" done | Compiling proves nothing. Open the app once per stage, screenshot it, and confirm the captured window's process path is this repo's binary. |
| What the batch pass covers | Model checks the happy path only | In that one pass walk: minimum window size, every tab, hover/focus/selected/disabled/open dropdown, panel bottom edges, the motion baseline, keyboard traversal, and TR→EN. Error and empty screens included. |
| Pixel verification method | 1 DIP is invisible at 1:1 | Crop suspect edges and magnify at least 4× nearest-neighbour; blurred scaling hides half-drawn strokes. |
| Impact report | User cannot infer this from code | End every UI task with the `Teknesyum ▸ Etki` block: file:line, rule, what changed, which section — including the rules you did not apply and why. |

## DROPPED

| Rule | Why (model default / duplicate / obsolete) |
|---|---|
| Contrast must be sufficient | model default |
| Give icon buttons an accessible name | model default (also SCAN) |
| Modal focus trap, `Esc` closes, focus returns to opener | model default |
| `Tab` order follows visual order | model default |
| Use semantic HTML / native `<button>` and `<input>` | model default |
| Colour is not the only carrier (WCAG 1.4.1) | model default; the specific dot-shape rule survives in SCAN |
| Grid lines and decorative rules are exempt from text contrast | model default |
| Empty states explain what and why plus one action | model default |
| Don't clip text; ellipsize with a tooltip | model default |
| Window opens large enough for its content | model default |
| Layout measured against the longest language | model default |
| Keys are never translated or renamed | model default |
| Missing key falls back to source language | model default |
| Flat JSON, one level, `area.object.state` keys | model default |
| Read the diff after editing a shared stylesheet | model default |
| Define a token first, then point controls at it | model default |
| Don't define the same colour in two places | model default |
| Sidebar above five targets, tabs at five or fewer | model default |
| Narrow window: reposition → resize → reflow → hide | model default |
| Drag has a single-tap alternative (WCAG 2.5.7) | model default |
| Layout animation does not move the click target | model default |
| Entry animation plays once | model default |
| Prefer `transition` over `keyframes` (cancellable) | model default |
| Library defaults are not tokens | duplicate of the no-raw-durations scan |
| Read `motion.md` before doing motion work | doctrine about reading files; the rules themselves are in SCAN/DATA |
| Read `desktop.md` / `avalonia.md` / `durumlar.md` / `forms.md` before that platform's work | same |
| `M1`…`M15` citation apparatus | doctrine; references collapse into one platform-quirks file (U1) |
| Rationale prose for every measured ratio | belongs with the token, not in context |
| Historical change logs (23.08.2026 decisions, "used to be 700", "was 16/12/8/6") | obsolete |
| Open items and handover lists (`U4`…`U11`, "not decided, not measured") | obsolete — rebuild supersedes them |
| `references/forms.md` should be split into `overlays.md` | obsolete |
| `.tk-mono-input` specificity explanation | belongs in the generated stylesheet's own comment |
| Cascadia Mono `İ` dot caveat, Avalonia version caveats | platform quirks file |
| Note that `system-ui` has no .NET equivalent | platform quirks file |
| Explanation of why 11 gradient stops | belongs with the token |
