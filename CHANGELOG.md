# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `setup.js --apply --targets avalonia` now registers the `ITransform` animator the generated
  `Theme.axaml` needs for its `Window.anim Panel.appbg` background loop: it writes a
  `TransformAnimator.cs` beside the app's `App.axaml.cs`/`App.xaml.cs` and inserts the
  `Animation.RegisterCustomAnimator<ITransform, TransformAnimator>()` call as the first line of
  `Initialize()`, skipping it when already present. Without `App.axaml.cs` or an `Initialize()`
  method it prints a clear warning instead of stopping the run.
- Scanner rule `core/avalonia-animator-missing`: an error when a project's `.axaml` animates
  `Window.anim Panel.appbg` but no `.cs` file registers the `ITransform` animator — the app
  crashes at launch without it.
- Preview scrollbar styles Solan (fades in while hovered or scrolled, fades out after) and
  İncelen (thin at rest, full width while hovered or scrolled, without shifting the layout).
- Preview: private themes in `teknesyum-private/teknesyum-ui/temalar/` appear under Özel Temalar.

### Changed

- **Breaking:** the brand colour tokens are named by order, not by hue: `blue`, `pink`,
  `purple`, `pink-text`, `purple-text` become `renk-1`, `renk-2`, `renk-3`, `renk-2-text`,
  `renk-3-text`, with every derived name (`--tk-renk-1-10`, `--tk-on-renk-2-30`,
  `--tk-glow-renk-3`, `--color-neon-renk-1`). Platform names follow `generate.js`'s
  kebab-to-Pascal rule, with `x` between two numbers: `NeonBlue` → `Renk1`, `NeonBlue20` →
  `Renk1x20`, `NeonBlueColor` → `Renk1Color`, `PinkText` → `Renk2Text`, `PinkText50` →
  `Renk2Text50`, `OnPink10` → `OnRenk2x10`, ANSI `Blue` → `Renk1`. The preview labels read
  Renk 1 / Renk 2 / Renk 3. A private record or theme saved with the old names is read with
  the new ones.
- Preview: Üzerine Gelince shows the scrollbar reliably; hover and scroll are tracked in script.
- Preview: Önce / Sonra, the Okunurluk summary and the change list compare against Benim Token
  Dosyam when a private record exists; Token Dosyası stays the standard defaults.
- Preview: changing a duration or the interface curve replays the Akıcılık demo; the app's own
  wizard card, wizard steps and settings groups animate with the motion tokens.
- Preview: button height and padding settings also size the wizard and dialog buttons.
- **Breaking:** the public standard token is plain: `renk-1` to `renk-3`, their text cuts,
  success and warning are white and greys, and the three glows are off (alpha 0). Tuned
  palettes live in themes and private records, not in the standard. Every pair still clears 7:1.
- Preview: choosing Token Dosyası resets every setting to the standard, not only the colours.

### Removed

- The Karbon theme is no longer public; it lives on the private shelf.
- `ui/onizleme/oneri.json` (fable's tuned readability proposal) and its `/oneri.json` route.

## [0.8.0] - 2026-09-26

### Added

- Avalonia shell templates: `scaffold.js ustcubuk <Namespace>` writes `TitleBar` (title,
  Teknesyum button, update badge, window buttons) and `KabukStilleri`, `durum <Namespace>` the
  `GuncellemePaneli`, `kur <AppName> --avalonia` the `KurulumEkrani`; the flavour follows the
  project's `.axaml` unless `--react`/`--electron` says otherwise. Each folder carries 848×640
  captures of rest, hover, pressed, focus and disabled under `ekran/`.
- `denetim` also writes `KabukTests.cs`: the sans face loads, no text is below fs-2, every button
  state fits its own clip.
- Scanner rules `kabuk/kok-yazi-boyu` (a window with no root font size),
  `kabuk/font-gomulu-degil` (`FontSans` names the token face but does not embed it) and
  `kabuk/sablon-imzasiz` (a title bar, update panel or install screen without the template
  signature line). Every template now starts with that line.
- Hedef Okunurluk picks its target with a 1-point slider (50–100), chips stay as shortcuts. In
  single-colour scope it draws a hue × lightness field with the 95, 90 and 85 readability curves
  and the target curve dashed; hovering shows hex and score, clicking applies that colour.
- The preview is titled TeknesyumUI (title bar, window and page title).
- Setup wizard in the preview (Sihirbaz): twenty-five steps from theme through every colour,
  type, shape, surface, glow, scrollbar and motion setting to readability, each opening its page
  and highlighting its settings, with Geri / Önerileni Kullan / İleri and a line saying how many
  of the step's settings differ from the recommended ones, and a Nerede, Nasıl line naming the
  control to use; Önerileni Kullan resets only that step (on the theme step, only the theme
  and the colours it set). The step's settings group moves to the top of the settings panel. It opens only
  from the Sihirbaz button. A saved private record appears as Benim Token Dosyam in the Token
  Dosyası menu and is selected on start.
- The Arka Plan group sets both gradient ends (top Siyah, bottom Yüzey) directly.
- Private settings: Kaydet now writes only the difference from the token values to
  `teknesyum-private/teknesyum-ui/onizleme/ayarlar.json` and pushes the private repo, or to the
  gitignored `ui/onizleme/ozel-ayar.json`; the preview loads it on start (`GET`/`POST
  /ozel-ayar`). Public release moved behind Herkese Açık Yayınla… with a warning.

### Fixed

- `setup.js --apply` for Avalonia and WPF copies Atkinson Hyperlegible Next and its OFL into
  the app's `Assets/Fonts`, points `FontSans` at the embedded URI and adds the resource item
  (`--app <csproj>` picks the project). Before, the face was only named and fell back.
- The generated theme sets windows to FontSans at fs-2 (Avalonia `:is(Window)`, WPF keyed
  `TkWindow`), gives PrimaryButton fs-2 and adds a DangerButton on the same base; untyped text
  no longer falls to the framework's 14.
- `typography.scale` in `teknesyum-ui.json` is read from the token file instead of a written list.
- The load test note and count no longer change height as the value moves, so scrolling past
  the slider does not jump.

- Teknik → Yük Testi marks the item-count slider: 1500 and up is a caution zone, 2000 and up a
  warning zone, measured on the dev machine (64 fps at 1500, 42 fps at 2000). The count and a note
  under the slider take the zone colour.
- Hedef Okunurluk works on one colour too: every colour setting has a "5 Alternatif" button, and
  the dialog has scope chips (Tüm Palet or any colour). The score is the readability of the items
  that colour affects; colours that affect no scored item are disabled.
- Clicking the Okunurluk number in the preview opens Hedef Okunurluk: pick a target (70–100)
  and get five fresh random palettes that score it, found by bisecting a contrast knob over
  random hues. Each click brings new ones; clicking a palette applies it. The Kötü–Mükemmel
  scale on the Okunurluk page is clickable too: the point clicked becomes the target.
- Every slider in the preview settings has five one-click presets: four points spread over its
  range and the token value (dashed). Every colour group offers five alternatives from the
  standard themes of the same kind (dark or light).
- Progress bars carry animated `/ / /` stripes, run thinner, and the scan light stays inside the
  filled part. Clicking a button or other object in the preview opens its settings group. New
  button size settings (height, horizontal padding); the title bar can be made much thinner and
  its text scales with it. The scrollbar is 4 px wide (range 2–24), and the preview turns off
  wheel smoothing so scrolling has no delay. Okunurluk shows a single number; Kaydet has no
  outline; outlined chips in the state grid no longer have their glow cut by the next cell.
- Ten standard themes in `ui/templates/temalar/`: five dark (gece, grafit, kadife, karbon,
  kor) and five light (kar, kirik, kagit, buz, keskin), drawn from 36 market palettes
  (`docs/arastirma/temalar.md`) and designed with fable (consult 004). Every theme passes the
  7:1 gate and scores 85.6–91.8. `node ui/scripts/tema.js liste | denetle [ad]`; the preview
  picks them from the header.
- Five new easing curves: `in-out`, `fast-slow-fast`, `emphasized`, `sharp`, `linear`
  (`--tk-e-<name>` in `theme.css`).
- Kaydet also writes easing curves, the four durations, the glow alpha and blur, and
  `meta.dark`.
- The preview has a three-column layout: a list of 15 components on the left, every example
  and state (normal, hover, pressed, focus, disabled) in the middle, and that component's
  settings first on the right. It has live progress, toast and modal demos. Akıcılık plays
  the easing curves, and Teknik measures FPS and frame time. New settings cover glow, UI
  easing, durations, density, border width, glass blur, shadow and scrollbar style.

- Preview proposals: `ui/onizleme/oneri.json` keeps fable's balanced readability set on
  record (blue #6ab2ff, disabled #9a9da6: score 85 → 87.4, consult 002). The preview does not
  apply it on start.
- The preview now edits text, disabled, success and warning too; the save accepts glass-base.
- The desktop app keeps one window: a second launch reloads it, and the HTTP and code caches
  are cleared on start. The window title shows the version.
- Readability score (`ui/scripts/skor.js`): 0–100, higher is better, from every text/fill pair
  in the standard CSS, weighted by how often each part appears. A new "Okunurluk" tab in the
  preview shows it against the token file, per panel, the most affected and the weak parts;
  Kaydet shows the change and writes it into the release notes.
- Preview **Kaydet**: writes the changed fields into `neon.tokens.json` and its copy,
  re-measures `on` pairs and ratio rationales, swaps the palette in the installer and fixtures,
  regenerates, tests, bumps the minor version, writes this file, commits, tags, pushes and
  publishes a GitHub release (`ui/scripts/kaydet.js`; `POST /kaydet`, `GET /kaydet/durum`,
  `GET /surum`). Progress is drawn with the installer panel.
- Preview: an "Uygulama Parçaları" tab next to "Renkler" draws the shipped components from the
  standard's own CSS (`/standart.css` concatenates `theme.css`, `forms.css`, `states.css`, the
  title bar, progress bar, badge and installer panel): title bar, the five sync states, the
  two-step update badge, the installer in running, done and error, progress bars, buttons,
  toasts, a confirm dialog and form fields.
- `ui/templates/kur/panel.css`: the installer's web twin (step sentence, percentage, last nine
  log lines, buttons only once the job ends).
- Title bar tabs (`.tk-titlebar__tab`): no fill, blue text, pink-text on hover, the current
  page underlined.
- Update badge (`.tk-update`): yellow = download, green = install; sync badge gains the
  waiting and local states.

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- The scrollbar thumb has no glow any more; only its fill colour transitions.
- Title bar: tabs and buttons lose their outline. On hover the text turns pink and an
  indicator grows from the centre under it (`scaleX`, interruptible). Every item has the
  same height and one centre line; `.tk-titlebar__chip--outlined` is the one exception, and
  it sits vertically centred in the bar. `TitleBar.tsx` takes `tabs`, `current`, `onTab` for
  navigation, with arrow keys, Home and End (research: `docs/arastirma/ustcubuk-core.md`).
- Scanner: `core/list-without-motion` also reads the motion in a component's imported CSS.
- Preview `on` colours follow the save rule: a token pair that drops under 7:1 switches to the
  better of black and text, as Kaydet will ship it.
- Ratio comments in `generate.js` are measured, not literal; the manifest palette, `setup.js`
  fallbacks and the readability tests read their colours from the tokens.
- Blue `#5aa8ff` (a true blue, no longer cyan) and pink `#c82ee0` (fuchsia), pink-text
  `#f0abfc`. Border alpha 55 %, strong border 70 %. Every ratio in the rationales re-measured.
- Ghost button: colour only in the border, body text; hover purple-10 with its `on` text. The
  primary button no longer dims on hover; it scales to 1.02 on web, WPF and Avalonia.
- Readability pass on the neon tokens, from a fable consult (`docs/danisma/001-*`): text
  `#f2f3f6` on surface `#101115` (17.00:1) instead of pure white on near-black; purple
  `#9455ea`, purple-text `#d4b3ff`,
  black `#0a0b0e`, glass-base `#14151a`, success `#4ade80`, disabled `#7c7f88`. Borders
  55 / 70 / 20 %, panel 96 %, glass 90 %, glow 18 % blur 16, gradient 16 stops. Type: hero
  32 px at 800, line height 1.6 / 1.25 / 1.5, tracking label 0.08em, h3 0.02em, h2 0, hero
  -0.015em. Every `on` pair still clears 7:1; the narrowest is text on pink-60 and purple-60 at 7.50:1.
- The primary and danger button text, hero weight and scrollbar thumb read their tokens
  instead of `#000`, `900` and purple; the thumb is purple-text, pink-text on hover.
- `setup.js`, `manifest.js` and the installer template carry the new palette.
- Preview: opens in an Electron window by default (`--tarayici` keeps the local server);
  its defaults are background swing off, instant scrolling and reduced motion on.

## [0.7.0] - 2026-09-25

### Added
- Preview: `node ui/scripts/onizleme.js` serves `ui/onizleme/` on a local port and opens it.
  Blue, pink, their text cuts, purple, surface and the background design are tuned live
  against every tone step, `on` pair and component state, each with its ratio from the
  shared `kontrast.js`; Before / After mode; export of the changed fields only.
  Tested in `test/onizleme.js`.

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- `setup.js` writes the Avalonia signature as `teknesyum-ui/avalonia/Signature.axaml.example`.
  It needs `Teknesyum.Localization.Str` and a code-behind `Click` handler, so as a `.axaml`
  it broke `dotnet build` in a bare project; as an example it stays out of the compiled glob.

### Fixed
- `Theme.xaml` and `Theme.axaml` no longer carry `--` inside an XML comment. The generator
  cleans every comment, so a bare `avalonia.app` project builds with 0 errors on Avalonia
  11.3 and 12.1.
- The Stop hook counts only open findings; `ignored` and `fixed` findings no longer stop a turn.
- `scan.js --files`: project rules such as `core/focus-ring-missing` see the whole tree, so a
  focus style in another file counts; only the report is narrowed to the named files.

## [0.6.0] - 2026-09-24

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- Scaffold target `denetim`: the Avalonia and WPF contrast tests now measure every button at
  rest, hover, pressed, focus and disabled (disabled is reported, not failed), each run of a
  multi-colour text and every icon (`Shape` fill or stroke), and take the worst stop of a
  gradient ground or text brush. They write `tmp/uc/kontrast-<UC_ETIKET>.txt` and window
  captures at 100/125/150 %. The scaffold output names the test project's packages; the
  Avalonia test needs xunit v3.

### Fixed
- Reduced motion no longer writes `transform: none !important` on `*`. It cleared positioning
  transforms, so a modal centred with `translate(-50%, -50%)` slid to the lower right; motion
  now stops through animation and transition duration and a single iteration.
- `scan.js --fix`: `core/duration-ceiling` and `core/hardcoded-duration` no longer rewrite the
  period of an infinite animation (`animation-iteration-count: infinite` or the `infinite`
  shorthand); they report it without a fix.
- `scan.js --fix`: a leading-dot duration such as `.8s` was read as `8s` and rewritten to
  `.var(--tk-t-*)`; it now reads as 800 ms and becomes `var(--tk-t-*)`.

## [0.5.0] - 2026-09-24

### Added
- Contrast gate: every fill in the tokens carries an `on` text colour; `generate.js` measures
  each pair (translucent fills composited over the surface) and stops under 7:1, then emits
  `--tk-on-*` in CSS and `On*` brushes in XAML. Rule `okunurluk/pair-contrast` measures fill
  and text on the same element across CSS, Tailwind, JSX, XAML styles and triggers, and C#
  paint code; `scripts/denetim.js` prints a live-page audit snippet for `javascript_tool`;
  scaffold target `denetim` writes a headless Avalonia or WPF contrast test.

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- `core/contrast` exempts only the approved text colours; fill cuts used as text are measured.
  The danger button, ghost hover, title-bar hover and `TkIconButton` states take their `on`
  colours, since the old pairs measured under 7:1.

## [0.4.0] - 2026-09-23

### Added
- Template `ilerleme`: `templates/ilerleme/react/ProgressBar.tsx` + `progressbar.css`, a
  determinate progress bar filled with `transform: scaleX`, a scanning light on
  `::after`/`translateX` gated by `prefers-reduced-motion`, and a percentage shown beside the
  bar. Scans clean against the repo's own rules. Optional Rust setup snippet
  `templates/ilerleme/tauri/setup.rs` pairs with `core/tauri-hidden-launch`.
- Rule `core/tauri-hidden-launch`: a `tauri.conf.json` window without `"visible": false`.
- Rules `core/fixed-window-no-shrink` and `core/fixed-window-maximize-open`: a fixed-size
  window (`resizable: false` / `CanResize="False"`) with no shrinkable body area, or one
  that still leaves its maximize control on.
- Rules `guncelleme/uzun-cagri-ilerlemesiz` and `guncelleme/sessiz-dongu`: a long call
  (`invoke`/`ipcRenderer.invoke`/`spawn`/`Command`) with no progress or busy state in the
  same file, and a background `setInterval` loop with no status indicator.
- Reference `skills/teknesyum-ui/references/primary-action-visibility.md`: a
  `getBoundingClientRect` rehearsal for checking a primary button sits inside the window's
  real inner size, at 100/125/150% OS scale.

## [0.3.0] - 2026-09-13

### Added
- `raf.js`: reads the private shelf (`TEKNESYUM_PRIVATE`, else
  `<config>/teknesyum-private/private/tercihler/`). No argument lists the books, a name
  prints one. Exit `0` fine, `1` no shelf, `2` no such book.
- Rule module `guncelleme`: `panel-yok` (an app with updater code and no `kur-*.ps1`),
  `panel-sozlesmesiz` (an installer without the `Adim` contract, the ceiling or the 16 ms
  timer) and `rozet-token-disi` (a sync badge painted with a fixed colour).
- `scan.js --files a.css,b.tsx` limits the scan to the named files.
- `scaffold.js` ends each target by naming the shelf book that governs it, and says so when
  the shelf or the book is missing.
- Test suite `raf` and cases for `--files` and the scaffolder's shelf note.

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- `SKILL.md` no longer carries the prose standard. It says where the shelf is, which book
  belongs to which work, and that a book is read once per session. 132 lines to 80.
- The Stop hook scans only the files the turn changed and does not repeat a finding it has
  already made; the memory is cleared when the conversation is compacted.

## [0.2.1] - 2026-09-12

### Added
- Config `ignore` array: `[{ rule, file, line?, reason }]` silences a named finding.
  `reason` is required; an entry without one is refused on stderr and does not apply.
  The summary line ends with `N ignored` and `--json` keeps the row as
  `"ignored": true` with its `"reason"`.
- Avalonia tooltip forms recognised by `states/disabled-affordance`: the `ToolTip.Tip`
  attribute, a `<ToolTip.Tip>` body element, and a `Setter Property="ToolTip.Tip"`
  inside a `:disabled` style.
- Fixtures for the Avalonia tooltip forms, fenced evidence blocks, `default=` flags,
  `Get("key", a + b)`, and a named scrim `LinearGradientBrush`.
- CHANGELOG, CONTRIBUTING and DCO.
- Turkish README (README.tr.md) with language badges.
- `scaffold.js` with three templates: `kur` (USB installer window), `ustcubuk` (React
  title bar) and `durum` (Electron git sync badge).
- Scanner rules `process/sync-child-process` and `process/send-sync`.
- Skill section "The Best Program Shows It Is Working".

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- README links Teknesyum Core by full URL and explains the marketplace layout.
- `trash/` is no longer tracked.

### Fixed
- `states/disabled-affordance` no longer demands a WPF-only `ToolTip` attribute on
  Avalonia markup; it reads the element body as well.
- `forms/unmeasured-label` skips lines inside fenced code blocks — raw evidence is not
  a claim — and no longer counts `default=` flag values or the literal `(Default)`
  registry value name.
- `forms/no-sentence-concat` anchors the `t(` call on a word boundary, so `Get(`,
  `Format(` and `Print(` no longer read as locale calls.
- `colour/background-gradient` judges only shell backdrop brushes in XAML — an
  `x:Key` matching app/shell/window background, or a brush inside
  `<Window.Background>` / `<Application.Background>` — and counts distinct colours
  rather than `<GradientStop>` elements.

## [0.2.0] - 2026-09-01

First release after the split from Teknesyum Base on 2026-08-28.

### Added
- Interface standard rebuilt as generated token files plus a scanner: `setup.js`,
  `generate.js`, `scan.js` and rule modules under `ui/scripts/rules/`.
- Theme generation for `css`, `react`, `wpf`, `avalonia` and `winforms` targets.
- Stop hook (`ui/hooks/guard.js`) that scans changed interface files.
- `ui-builder` role bound to the tier table.
- Test suite with cost assertions (`npm test`).

### Changed
- The preview window's minimum size rises from 720x480 to 1024x640, because the title bar needs 989 px. In the standard `titlebar.css` the tools no longer shrink, so on a narrow bar the tabs clip instead of the buttons overlapping.
- Progress bars no longer jump. `ProgressBar.tsx` gains `useSmoothPercent`: the shown value chases the target frame by frame on an exponential ease-out with a time constant of half `--tk-t-slow`. Bigger gaps move faster, the value slows near the target, and the percent shows one decimal. `aria-valuenow` stays on the rounded target, and reduced motion jumps straight to it. The fill's CSS transition is gone because the hook drives it. In the preview, every bar and the Kaydet installer flow the same way, and the live demo jumps by uneven steps to show the speed-up.
- The preview window drops the system title bar and draws the standard one. The view modes are tabs; Sıfırla, Kopyala and İndir are chips; Kaydet is the outlined chip. The window controls go through a preload bridge. A window edge shows when the window is not maximised. The settings apply to the whole app live, and a Pencere Ve Üst Çubuk group sets the edge colour and bar height. `titlebar.css` gains `.tk-titlebar__restore`, `.tk-window-edge` and a disabled chip state.
- Core contracts and leftovers moved out of this repository.
- Scanner reports exactly what it scans and no longer scans itself.

[Unreleased]: https://github.com/Teknesyum/Teknesyum-UI/compare/v0.8.0...HEAD
[0.3.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.3.0
[0.2.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.2.0
