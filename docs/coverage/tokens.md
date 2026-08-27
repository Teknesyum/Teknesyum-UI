# Coverage — numeric tokens

`ui/skills/teknesyum-ui/assets/theme.tokens.json` (mirror: `ui/templates/neon.tokens.json`).
New sections: `size`, `space`, `shape`, `metric`, `motion`, plus two colour entries in
`derived`. Every value comes from the `docs/EXTRACT.md` DATA table; nothing was invented.

Derivable values are references, not second measurements: `{ "ref": "space.5" }` follows
the same shape as the colour `ref` + `alpha` pattern and emits `var(--tk-sp-5)` in CSS.

## Applied

| DATA row | Token | CSS | XAML / AXAML | Palette.cs |
|---|---|---|---|---|
| Panel drop shadow `0 0 40px rgba(0,0,0,0.8)` | `derived.shadow-panel` | `--tk-shadow-panel` | — | — |
| Modal scrim `rgba(0,0,0,0.6)` | `derived.scrim` | `--tk-scrim` | — | — |
| Type scale 14 / 16 / 20 / 24 / 30 | `size.fs-1…5` | `--tk-fs-1…5` | `FontSize1…5` | `FontSize1…5` |
| Weights 400 / 600 / 900 | `size.fw-body`, `fw-semi`, `fw-hero` | `--tk-fw-*` | `WeightBody/Semi/Hero` (`FontWeight`) | `WeightBody/Semi/Hero` |
| Tracking 0.15 / 0.05 / 0.02 / −0.01 em | `size.tr-label`, `tr-h3`, `tr-h2`, `tr-hero` | `--tk-tr-*` | `TrackingLabel/H3/H2/Hero` | `TrackingLabel/H3/H2/Hero` |
| Line heights 1.5 / 1.2 / 1.4 | `size.lh-body`, `lh-heading`, `lh-mono` | `--tk-lh-*` | `LineHeightBody/Heading/Mono` | same |
| Max measure 65ch | `size.measure` | `--tk-measure` | `MeasureCh` | `MeasureCh` |
| Spacing ladder 4 / 8 / 12 / 16 / 24 | `space.1…5` | `--tk-sp-1…5` | `Space1…5` | `Space1…5` |
| Panel padding 24, section gap 24, row gap 12 | `space.panel-padding`, `section-gap`, `row-gap` → ladder refs | `--tk-panel-padding`, `--tk-section-gap`, `--tk-row-gap` | `PanelPadding` (`Thickness`), `SectionGap`, `RowGap` | same |
| Field inner gap 8, between fields 16 | `space.field-gap`, `field-stack` → refs | `--tk-field-gap`, `--tk-field-stack` | `FieldGap`, `FieldStack` | same |
| Text input h-padding 12 | `space.input-padding-x` → ref | `--tk-input-padding-x` | `InputPadding` (`Thickness`) | `InputPaddingX` |
| Toast inset 24, stack gap 12 | `space.toast-inset`, `toast-gap` → refs | `--tk-toast-inset`, `--tk-toast-gap` | `ToastInset`, `ToastGap` | same |
| Radius 6 | `shape.r` | `--tk-r` | `Radius` (`CornerRadius`) | `Radius` |
| Window shell radius 12 | `shape.r-window` | `--tk-r-window` | `WindowRadius` (`CornerRadius`) | `WindowRadius` |
| Tab outline 1 DIP inset (border width) | `shape.border-w` | `--tk-border-w` | `BorderWidth` (`Thickness`) | `BorderWidth` |
| Focus ring 2 DIP outline, 2 DIP offset | `shape.focus-w`, `focus-offset` | `--tk-focus-w`, `--tk-focus-offset` | `FocusWidth`, `FocusOffset` | same |
| Min target 24×24 (checkbox cell too) | `metric.target-min` | `--tk-target-min` | `TargetMin` | `TargetMin` |
| Scrollbar track 10 | `metric.scrollbar-w` | `--tk-scrollbar-w` | `ScrollbarWidth` | `ScrollbarWidth` |
| Title bar height 32–40 | `metric.titlebar-h-min`, `titlebar-h-max` | `--tk-titlebar-h-min/max` | `TitleBarHeightMin/Max` | same |
| Sidebar 240 / 48 | `metric.sidebar-w`, `sidebar-collapsed-w` | `--tk-sidebar-w`, `--tk-sidebar-collapsed-w` | `SidebarWidth`, `SidebarCollapsedWidth` | same |
| Text input min-height 40 | `metric.input-h` | `--tk-input-h` | `InputHeight` | `InputHeight` |
| Modal width `min(560px, 90vw)` | `metric.modal-w` (`vw-max`) | `--tk-modal-w` | `ModalWidth` (560) | `ModalWidth` |
| Modal max height ratio 0.85 | `metric.modal-max-ratio` | `--tk-modal-max-ratio` | `ModalMaxRatio` | `ModalMaxRatio` |
| Toast width `min(360px, 100vw − 48px)` | `metric.toast-w` (`gutter-ref` → `space.5`) | `--tk-toast-w` | `ToastWidth` (360) | `ToastWidth` |
| Toast max 3, life 6000 ms | `metric.toast-max`, `toast-life` | `--tk-toast-max`, `--tk-toast-life` | `ToastMax`, `ToastLife` (`Duration`/`TimeSpan`) | `ToastMax`, `ToastLifeMs` |
| Icon sizes 14 / 16 / 22 / 56 | `metric.icon-1…4` | `--tk-icon-1…4` | `IconSize1…4` | `IconSize1…4` |
| Hover 1.02, press 0.98, icon hover 1.1 | `motion.scale-hover`, `scale-press`, `scale-icon-hover` | `--tk-scale-*` | `ScaleHover/Press/IconHover` | same |
| Entry offset 8, menu/tooltip offset 4 | `motion.entry-offset`, `overlay-offset` → refs | `--tk-entry-offset`, `--tk-overlay-offset` | `EntryOffset`, `OverlayOffset` | same |
| List stagger 40 ms, max 6 (empty→filled uses the same step) | `motion.stagger`, `stagger-max` | `--tk-stagger`, `--tk-stagger-max` | `Stagger`, `StaggerMax` | `StaggerMs`, `StaggerMax` |
| Glow clearance 24 | `motion.glow-margin` → ref | `--tk-glow-margin` | `GlowMargin` | `GlowMargin` |
| Loading loop ≥ 1.4 s | `motion.loading-loop-min` | `--tk-loading-loop-min` | `LoadingLoopMin` | `LoadingLoopMinMs` |
| Background rotation ≥ 40 s, sweep ≤ 20° | `motion.bg-rotate-min`, `bg-sweep-max` | `--tk-bg-rotate-min`, `--tk-bg-sweep-max` | `BgRotateMin`, `BgSweepMax` | `BgRotateMinMs`, `BgSweepMaxDeg` |
| Frame budget 16 ms | `motion.frame-budget` | `--tk-frame-budget` | `FrameBudget` | `FrameBudgetMs` |

64 tokens: 62 numeric (11 of them references into the spacing ladder) plus 2 colour
entries in `derived`.

## Not applied

| DATA row | Why |
|---|---|
| Avalonia focus adorner radii 7 / 9 DIP | Derived: `shape.r` + 1 and + 3. The generated adorner already computes them and the source itself marks the row "derived from r". |
| Tabs: 8 DIP gap, 2 DIP bottom safe area | The gap is `space.2`; the 2 DIP safe area belongs to one control and has no token name in the table. |
| Checkbox 20×20 draw | The 24×24 cell is `metric.target-min`; the 20 DIP glyph is a single control's drawing size, not a shared measure. |
| Info badge 12×12, 6 DIP from text | One control, no token name in the table. |
| Window buttons 42×30 DIP, glyph 12pt, icons 10–12px | Title-bar chrome geometry; the icon range does not match the 14/16/22/56 icon scale and would need a measurement to reconcile. |
| Footer strip height 18px | No component owns it in the rebuild yet; add it with the footer. |
| Resize grip 7px on three edges | Window chrome hit-testing, not a visual measure. |
| Avalonia bg layer: sweep 8.42°, scale 1.12 | Platform quirk; belongs in the single `references/` file, not in the shared token set. |

8 rows skipped. None of them is referenced by a rule module today.

## Verification

- `node ui/scripts/generate.js` writes all four files.
- Before/after diff of the four generated files: colours, durations and easings byte-identical;
  additions only, with one exception — `Theme.xaml`'s root element gains
  `xmlns:sys="clr-namespace:System;assembly=mscorlib"`, without which `sys:Double`
  resources cannot be declared.
- `node ui/scripts/scan.js --list-rules` still runs (exit 0).
- `setup.js --apply --template neon --targets css,wpf,avalonia` and
  `--template custom --targets css` both emit the new `--tk-fs-*`, `--tk-sp-*`, `--tk-r`
  properties; the custom template inherits every non-colour value from neon.
