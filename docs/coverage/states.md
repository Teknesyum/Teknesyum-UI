# Coverage — `states` module

`ui/scripts/rules/states.js`. 27 rules: 21 error, 6 warn. Fixtures in
`ui/scripts/rules/__fixtures__/states/`, one `.bad` and one `.good` per rule;
`node ui/scripts/rules/__fixtures__/states/_run.js` runs each rule against its own pair
and prints pass/fail. `_write.js` regenerates the fixtures.

## Applied

| SCAN row | Rule | Severity | Note |
|---|---|---|---|
| All five states defined per component | `five-states` | warn | Narrowed, see below |
| State layer declares only the seven allowed properties | `state-layer-properties` | error | Gated on `[data-tk…]` state rules, not on a filename |
| State layer binds to `data-tk`, not invented classes | `state-layer-binding` | error | Narrowed, see below |
| Hover signal always paired with `:focus-visible` | `hover-without-focus` | error | Silent when a global `:focus-visible` rule exists |
| Pressed state has a non-transform carrier | `pressed-without-carrier` | error | |
| No `opacity` change between component states | `state-opacity` | error | `forced-colors` and reduced-motion blocks exempt |
| No `disabled:opacity-*` | `disabled-opacity` | error | |
| Disabled controls carry `title`/`ToolTip` and `cursor: not-allowed` | `disabled-affordance` | error | CSS, markup and XAML halves |
| Focus uses `:focus-visible`, never bare `:focus` | `bare-focus` | error | `:focus:not(:focus-visible)` and sr-only focusable allowed |
| Focus ring is two layers, outline plus inner box-shadow | `focus-ring-layers` | error | `forced-colors` exempt — the inner layer is erased there by design |
| Only `opacity` and `transform` animated | `animated-property` | error | Scoped to `@keyframes`, see below |
| No raw easings outside the token file | `raw-easing` | error | Duration half is core's |
| Infinite loops only under `motion-safe:`, progress or app background | `infinite-loop-scope` | error | Split, see below |
| WPF storyboards read `SystemParameters.ClientAreaAnimation` | `wpf-animation-guard` | warn | Downgraded, see below |
| WPF storyboards touch only `RenderTransform`/`Opacity` | `storyboard-target` | error | `Freeze()` half skipped, see below |
| Avalonia `RenderTransform` set as a string, not an object | `avalonia-transform-object` | error | |
| No glow on repeated items | `glow-on-repeated-item` | error | |
| WPF: no `DropShadowEffect` inside item templates | `wpf-shadow-in-item-template` | error | Matches `DataTemplate` blocks |
| At most one `backdrop-filter` per scroll path | `backdrop-filter-count` | warn | Counted per file |
| No interactive element without an accessible name | `unnamed-interactive` | error | Markup and XAML |
| `aria-label=""` forbidden | `empty-accessible-name` | error | Also `AutomationProperties.Name=""` |
| Icons inside named buttons carry `aria-hidden` and `focusable="false"` | `icon-not-hidden` | error | |
| sr-only never uses `display: none` | `sr-only-display-none` | error | `visibility: hidden` too |
| Progress uses `role="progressbar"`, not `aria-live` | `progress-live-region` | error | |
| `assertive` only on error regions | `assertive-scope` | warn | |
| `forced-color-adjust: none` only on colour-sample selectors | `forced-color-adjust-scope` | error | |
| Hero glow gets `filter: none` under `forced-colors` | `hero-glow-forced-colors` | error | Project rule |

## Narrowed, and why

**`five-states` — warn, not error.** The SCAN row describes a matrix parse of
`durumlar.md` against `components.md` headings. Neither document exists in the rebuilt
tree, so the check has to be inferred from the stylesheet. A stylesheet cannot tell a
missing state from a legitimate "not applicable" cell: a toast has no pressed state, a
text input has no pressed state, a scrollbar thumb has no disabled state. The rule
therefore only speaks about a base selector that already declares three of the five
states — a component whose matrix is visibly being written — and it treats `focus` as
satisfied when the project has a global `:focus-visible` rule, which is the escape hatch
`durumlar.md` 1c grants by name. Against the standard's own assets this leaves one
finding: `.tk-input` has no pressed state.

**`state-layer-binding` — undefined `.tk-*` classes only.** The source rule compares the
state layer's selectors against a fixture that does not exist here. The failure it is
built to catch is a state rule bound to a class no stylesheet defines, so that is what
the rule checks: a `.tk-…` class used in a state selector with no base rule anywhere in
the project. Classes outside the `tk-` namespace are left alone; the standard has no
claim on them.

**`state-layer-properties` — content gate, not a filename gate.** Any rule that carries a
`[data-tk…]` selector plus a state pseudo is state-layer work regardless of which file it
sits in, and that is the intent of `durumlar.md` 1a.

**`hover-without-focus` — silent when a global focus ring exists.** `durumlar.md` 1c
accepts either a shared selector list or the theme's general two-layer ring as the focus
twin. When the project declares a bare `:focus-visible` rule the second form is in place
and the rule says nothing. Without it, a hover rule that changes colour, border, shadow
or transform and has no `:focus-visible` counterpart is reported.

**`animated-property` — `@keyframes` only.** Core already covers `transition-all` and
transitions of layout properties. The remaining gap is keyframes, which core does not
read. The rule flags a keyframe block that animates size, position, paint or shadow.
Transitions of `color`, `background-color` and `border-color` are deliberately not
flagged: the state layer is built on exactly those, and `states.css` itself transitions
them.

**`infinite-loop-scope` — split in two.** For Tailwind `animate-*` utilities the
`motion-safe:` prefix is required. For CSS it is not: the standard's own background loop
sits in plain CSS and is neutralised by the global `prefers-reduced-motion` block, whose
presence core enforces (`core/reduced-motion-missing`). Demanding a second wrapper would
flag `theme.css`. What the CSS half checks is the scope — the loop must belong to
progress, loading, a skeleton, the background, or the document root.

**`wpf-animation-guard` — warn.** `scan.js` collects interface files and JS/TS modules;
`.cs` is not among them, and `SystemParameters.ClientAreaAnimation` is read from
code-behind. The rule can see the looping storyboard but never its guard, so it reports a
reminder rather than a violation.

## Skipped

| SCAN row | Why |
|---|---|
| `transition-all` / only opacity and transform in transitions | `core/transition-all`, `core/layout-animated` |
| No duration above 360 ms | `core/duration-ceiling` |
| No raw durations | `core/hardcoded-duration` |
| No glow on text | `core/text-glow` |
| Hover with no transition | `core/hover-without-transition` |
| `prefers-reduced-motion` block exists | `core/reduced-motion-missing` |
| React root has `<MotionConfig reducedMotion="user">` | `core/motion-config-missing` |
| A focus ring exists at all | `core/focus-ring-missing` — this module checks its shape instead |
| Component / list ships without motion | `core/component-without-motion`, `core/list-without-motion` |
| WPF storyboards are `Freeze()`d | `Freeze()` is a C# call and `.cs` is not a scanned extension. The target half of the same SCAN row is covered by `storyboard-target`; `LayoutTransform` and `Effect` targets stay with `core/wpf-layout-target` and `core/wpf-effect-target`. |
