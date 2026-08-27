# Platform quirks

Framework behaviour that goes against the obvious guess. Values are not here — read the
token file.

## WPF

- Put the template outline on the `ControlTemplate` root itself, not on a `Rectangle`/`Border`
  sibling inside a root `Grid`; a sibling sizes from the root and half its stroke falls outside
  the control's draw bounds and is clipped.
- When you outline an `ItemsControl` (`TabControl`, `ToolBar`, `Menu`, `ListBox`), override the
  container's template too — its default items host clips the headers, and `ClipToBounds="False"`
  on the item does nothing because the clipper is above it. Put the items in a panel with
  `IsItemsHost="True"`.
- Set `LineStackingStrategy="BlockLineHeight"` wherever you set `LineHeight`; otherwise WPF grows
  the line box from font metrics and `LineHeight` is not what CSS means by it.
- Never set `UseLayoutRounding` or `SnapsToDevicePixels` to `False`: 1 DIP strokes land on half a
  pixel and render grey instead of neon.
- Gradients need `ColorInterpolationMode="ScRgbLinearInterpolation"`; sRGB interpolation bands
  visibly on a dark background.
- `Storyboard` animates `RenderTransform` and `Opacity` only — not `Width`/`Height`. `Freeze()`
  every storyboard, and stop animation while the window is hidden.
- Reduced motion is not honoured automatically. Every infinite storyboard must read
  `SystemParameters.ClientAreaAnimation` and not start when it is off.
- `DropShadowEffect` inside a repeated item template is forbidden: `Effect` renders the subtree to
  an intermediate surface and repaints it every frame while scrolling, once more per recycle.
- Never give a transform object as a `Style` `Setter` value. The single object is shared by every
  matching element, and it seals once frozen so it can no longer be written.
- The default `FocusVisualStyle` is a dotted black rectangle, invisible on a black surface.
  Replace it app-wide through the `{x:Static SystemParameters.FocusVisualStyleKey}` key —
  merging the dictionary is the whole job, and WPF already draws it in keyboard modality only.
- `AutomationProperties.Name` goes on the control, never on an inner template element: the UIA
  node that carries the name must be the interactive one. `Path`/`Shape` produce no automation
  peer, so decoration cannot leak a name.
- `AutomationProperties.LiveSetting` is silent on its own — raise
  `AutomationEvents.LiveRegionChanged` by hand on the element's peer after the text changes.
- Under `SystemParameters.HighContrast`, do not load the neon dictionary at all — leaving the
  controls on WPF defaults beats a neon mix that half-overrides the system theme. Subscribe to
  `SystemParameters.StaticPropertyChanged`; the mode can change while the app runs.
- For a modal, a separate `Window` plus `ShowDialog()` is the cheapest correct path: focus trap,
  `Esc` via `IsCancel="True"`, and focus return come from the window manager. An in-window overlay
  needs all of `KeyboardNavigation.TabNavigation="Cycle"`, an explicit `Keyboard.Focus` on open,
  a stored `Keyboard.FocusedElement` to restore on close, and `IsHitTestVisible="False"` on the
  content beneath — `FocusManager.IsFocusScope` does not bound `Tab` navigation.
- Turn off the default validation adorner (the red outline); it is outside the palette.
- Text inputs need `CaretBrush`, `SelectionBrush` and `SelectionOpacity="1"` set explicitly.
- `CornerRadius` does nothing on `Window`; it belongs on the shell `Border`.
- `WindowStyle="None"` + `WindowChrome` removes the OS behaviours with the bar. The window must
  still carry `WS_THICKFRAME` and `WS_MAXIMIZEBOX` for Aero Snap and edge resize, and
  `WM_NCCALCSIZE` must return zero to erase the frame those styles draw back. All three work
  together; miss one and three behaviours die silently.
- Anything clickable inside the caption strip needs `WindowChrome.IsHitTestVisibleInChrome="True"`,
  or the mouse-down starts a window drag instead.
- Use `x:Shared="False"` for any resource that must not be a single shared instance.

## Avalonia

- `Style` has no `x:Key` here; it matches by selector and cannot be assigned. The keyed
  equivalent is `ControlTheme`, assigned to `Theme="{StaticResource X}"`, not `Style=`.
- The theme file's root is `Styles`, not `ResourceDictionary` — a `Style` cannot live inside a
  `ResourceDictionary`, and `Styles.Resources` carries both brushes and rules.
- `FluentTheme` goes before your `StyleInclude`: later wins.
- There are no triggers. State is a pseudo-class selector (`:pointerover`, `:pressed`,
  `:disabled`, `:focus`, `:checked`); smoothing is `Transitions`, which run in both directions.
- Do not imitate `Trigger` + `ExitActions` with keyframes: Avalonia does not rewind a keyframe
  when the pseudo-class ends, so the element stays stuck at the last frame. Keyframes are for
  genuinely looping things only. This does not fail at build time.
- A `Transition` takes one `Easing` — there is no separate enter/exit easing.
- Template parts are reached with `^:pointerover /template/ Border#bd`. An unnamed template part
  makes the selector match nothing, with no error.
- Set `RenderTransform` as a string (`Value="scale(0.98)"`), never as an object: the object is one
  shared instance across every match, and `TransformOperationsTransition` will not run on it.
- There is no `prefers-reduced-motion` and no `ClientAreaAnimation`. Read the OS preference
  yourself and toggle a single class on the `Window`; default to animated when the read fails, and
  keep the class in one place. macOS and Linux have no read path — offer an in-app switch there.
- A gradient brush's sub-properties cannot be interpolated; animate the painted layer's
  `RenderTransform` instead.
- The background layer is an empty sibling behind the content: children of a rotating layer rotate
  with it.
- Missing with no substitute: `x:Shared`, `ColorInterpolationMode`, `LineStackingStrategy`
  (`LineHeight` already behaves like a box here), `Freezable` sealing.
- No `Hyperlink`. Use a `Button` with a `ControlTheme`, and open URLs with
  `TopLevel.Launcher.LaunchUriAsync`.
- Renamed members that look the same: `ToolTip.Tip` (not `ToolTip`), `StrokeJoin` /
  `StrokeLineCap` (not `StrokeLineJoin` / `StrokeStartLineCap`), `FontFeatures="+tnum"` (not
  `Typography.NumeralAlignment`), `DropShadowEffect.OffsetX`/`OffsetY` (not `ShadowDepth`).
- Box glow is `BoxShadow`, not an effect — opacity is the alpha of the colour, not a property.
  `Effect` is only for the one text glow, since `BoxShadow` cannot reach text.
- Focus is `Control.FocusAdorner`, and Avalonia already restricts it to keyboard modality.
  Replace it, never remove it.
- Window chrome: `ExtendClientAreaToDecorationsHint`, `ExtendClientAreaChromeHints="NoChrome"`,
  `ExtendClientAreaTitleBarHeightHint="-1"`. Drag is your own `BeginMoveDrag(e)` on the strip's
  panel, resize is `BeginResizeDrag(edge, e)`. Bind drag to the strip, not the window root, or the
  whole surface drags. No hit-test opt-out is needed for buttons — they consume the pointer event.
- Embedded fonts use `avares://`, not pack URIs, and the family key must be overridden or the
  theme falls back to the system font without complaint.
- A markup extension needs no base class — any class with `ProvideValue` works — but name it `Str`,
  not `StrExtension`. It resolves once, so a runtime language switch needs an `IBinding` instead.

## WinForms

- Native scrollbars are white. Before any window opens, call `uxtheme.dll` ordinal 135
  `SetPreferredAppMode(2)`, then `SetWindowTheme(handle, "DarkMode_Explorer", null)` on every
  scrollable control. The ordinal is undocumented — wrap it in try/catch and keep booting on failure.
- There is no focus-visual hook, and `ControlPaint.DrawFocusRectangle` also draws dotted. Draw the
  two-layer ring by hand, and trigger it on focus that follows a `KeyDown`, not on `Enter`/`Leave`,
  so mouse users do not get a ring.
- `DataGridView` cell and row backgrounds ignore the alpha channel and paint white. Pre-blend any
  tint with the surface colour and pass it opaque. The rule generalises: never give a semi-
  transparent colour to a control that does not paint its own background.
- An `AutoSize` row with a `Dock=Fill` child mis-measures its height and the content below overlaps.
  Make that row `Absolute` and compute the height yourself.
- Set `AutoEllipsis = true` on anything that can overflow; clipped text is invisible on a dark
  surface and the user never learns something is missing.
- `FormBorderStyle.None` removes drag, double-click maximise, Aero Snap, edge resize and `Alt+F4`.
  `WM_NCHITTEST` must report the edge regions, and a `Dock=Fill` child swallows the hit-test
  entirely — leave a grip margin on the three resizable edges.
- Rounded window corners come from `Region`, recomputed on every resize, and a maximised window
  must stay square or the corners show the desktop through.
- Return `HTCLIENT` from `WM_NCHITTEST` for clickable rectangles in your caption panel.
