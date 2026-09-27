# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.22.0] - 2026-09-27

### Fixed
- `kur.ps1` measures and draws the title with typographic spacing, so the gap between the app name and "Kurulum" is one space wide.

## [0.21.0] - 2026-09-27

### Added
- Tokens `metric.installer-w` (720) and `metric.installer-h` (540): every installer takes the same window. Emitted as `--tk-installer-w/h`, `InstallerWidth`/`InstallerHeight`.
- Rule `guncelleme/eski-duzen` (warn): a generated installer or update panel whose `düzen` marker is older than the template's. Delete the generated files and run the scaffold again.
- `scaffold.js durum --react` writes a React/Tauri update-panel flavour (`UpdateBadge.tsx`, `UpdatePanel.tsx`, `update.css`), matching the Avalonia template's texts, 16 ms timer and creeping-ceiling contract.

### Changed
- `kur.ps1` redrawn on one standard (layout 2): 720×540, system-rounded corners, drawn title bar with the brand chip, fs-1 body, pill progress bar with a mono percent, mono log that fades at the top. The footer shows the install address alone on one line; the "Kurulum yeri" label is gone.
- Avalonia `KurulumEkrani` follows the same layout; `GuncellemePaneli` and the React update panel take the same title size, progress bar and buttons.

## [0.20.0] - 2026-09-27

### Fixed
- `uc.js --toplu --yaz` moves an open uc line written by an older plugin to this version, so the ledger no longer points at an old `uc.js` whose instruction lacks the newer steps.

## [0.19.0] - 2026-09-27

### Added
- The first session after a plugin update runs `uc.js --toplu --yaz` on its own: every project in the parent folder whose last `uc` is older gets one ledger line. The version is kept in `<config>/teknesyum-ui/toplu.json`; the result is a `systemMessage` only, no context.
- Rule `etiket/signature-text` (warn): a brand, support or site text, its hint, or the legacy `by <brand>` written by hand in a UI file, code file or locale JSON. Read it from `labels.<lang>.json` so every app shows the same text. Files carrying a template signature line are skipped.
- `artik.js [root] [--sil]` measures build output, caches, logs and temp files. `--sil` deletes only what git ignores and does not track; `node_modules` and `trash/` are only reported. The `uc` instruction carries the step.

### Changed
- The default signature no longer holds `text` and `supportText`; `--apply` removes them from an existing config. `links.json` drops `signatureText` and `supportText`.
- The `neon` and `benim` templates no longer copy the palette into `.claude/teknesyum-ui.json`, and `--apply` removes it. Only `custom` keeps its own colours.

## [0.18.0] - 2026-09-27

### Added
- `uc.js --toplu [root] [--yaz]` lists the projects under `root` (default: the parent folder) whose last recorded `uc` is older than the plugin. `--yaz` adds one `- [ ] uc çalıştır: UI <old> → <new>` line to each project's `.claude/acik.md`, only once, so the next session in that project picks it up without typing `uc`.

### Changed
- The session start note no longer orders an audit before the user's request. For an unset, unaudited or failing project, and for a pending shelf book, it says one line and leaves the work to `uc`. An ordinary turn costs no extra tokens.

### Removed
- The title bar no longer shows the program icon at the top left: only the name. `Logo` is gone from the Avalonia `TitleBar` and `logo` from the React one.

## [0.17.0] - 2026-09-27

### Fixed
- `GhostButton` pressed state uses `Renk3x20`/`OnRenk3x20` like hover instead of `Renk3x30`: on darker owner palettes the best On colour on `Renk3x30` fell below 7:1. Pressed stays distinct through the press scale.

## [0.16.0] - 2026-09-27

### Fixed
- `core/focus-ring-missing` no longer warns "no FocusVisualStyle" on Avalonia projects: `.axaml` accepts `FocusAdorner`, and a project bound to the generated `teknesyum-ui/avalonia/Theme.axaml` counts as having one. WPF `.xaml` still needs `FocusVisualStyle`.
- The `avalonia-animator-missing` message no longer says `setup.js` registers the animator; it stopped doing so in 0.13.0.

## [0.15.0] - 2026-09-27

### Fixed
- Title bar, maximized: the top-right screen pixel now hits Close instead of a resize edge. Avalonia answers `WM_NCHITTEST` for the bar itself while maximized (client for the buttons, `MaxButton` for maximize, never an edge) and pads the bar by `OffScreenMargin` so the buttons sit flush with the screen. React drops the `.tk-window` border and radius when maximized.
- Title bar: the maximize button follows the window state. Avalonia swaps to the restore glyph and the new `GeriAlMetni` text (default "Önceki boyuta getir") for its tooltip and automation name, subscribing to the window after attach and unsubscribing on detach. React takes `maximized` and a `restore` label and sets `data-window` on the bar.
- Title bar: nothing in the bar has an outline. The Avalonia support and signature chips and the update badge are text with an underline that opens from the centre on hover and focus (Renk2 when pressed, support chip in `LabelSupportBrush`), matching `.tk-titlebar__chip`; `GhostButton` is borderless at `ButtonHeight`/`ButtonPadding` with On-pair fills. The window buttons' pressed fill no longer drops the icon below 7:1.
- Signature assets (`Signature.axaml`, `.xaml`, `.tsx`): the support and brand chips have no border. Size and padding come from `TargetMin` and `InputPadding` instead of fixed `10,3`/`24`, and hover opens a `FocusWidth` underline from the centre instead of scaling a framed button.

## [0.14.0] - 2026-09-27

### Added
- `uc.js --bitti [--project <dir>]` records a finished `uc` (plugin version, layout, project commit) once the layout gate shows 0 differences. The next `uc` does not rescan from scratch: it lists the changelog entries between the recorded and the current version and the interface files changed in the project since, and says there is nothing to convert when neither moved.
- The `uc` instruction asks for a program icon that matches the theme (recolouring is enough) and for the desktop and Start menu shortcuts to point at it.

### Fixed
- The layout gate no longer reports the Avalonia/WPF theme as different after `setup` points `FontSans` at the embedded font URI.

## [0.13.0] - 2026-09-27

### Added
- `scripts/esle.js` is the one mapping from preview choices to tokens, shared by the preview and Node. `esle.js --denetle [--project <dir>]` is the layout gate: it prints `düzen eşleşmesi N fark` and exits 1 on any unmapped choice, setting that never reached the tokens, leftover notes file, project token copy that differs, or generated file that is not byte-equal to a fresh generation. It reports token paths only, never values. `esle.js --yaz` rewrites the private tokens from the saved preview settings.
- A `label` token group: brand, support, site, update, sync and title each carry TR and EN text, hint and state texts, a colour, an accent, a size and a weight. `scripts/etiket.js` turns it into `labels.tr.json` / `labels.en.json` (written for every target), `--tk-label-*` CSS variables and `Label*` XAML resources. The signature assets and the React title bar read them.
- The preview has a Yazılar section to edit every label, in both languages.
- WPF, Avalonia and `Palette.cs` are generated from the tokens with no fixed numbers left: button height and padding, glass blur, background type and angle, scrollbar style, thumb, hover and track, window edge, the app background and its overlay.

### Changed
- `setup.js --apply --template benim` ends on the layout gate, and a plugin version change refreshes the layout on the next apply.
- The `uc` instruction is an order to convert the whole interface, not an audit: when the agent will not convert something it asks in its first message. It refreshes the layout on a bound project and finishes on `düzen eşleşmesi 0 fark` plus side-by-side preview and app screenshots.
- Neon defaults: background rotation off, scrollbar thumb hover `renk-2`, XAML button height 50, React support chip in `renk-3-text`.

### Removed
- The preview notes file (`benim.notlar.json`): every preview choice now has a token.
- The Avalonia `TransformAnimator` registration: the background rotation is a brush animation and needs no custom animator.

## [0.12.0] - 2026-09-27

### Added
- The Avalonia title bar (`ustcubuk`) has two slots for app content: `Orta` fills the free centre column (a disclaimer notice, a search box) and `Ek` sits first in the right-hand group before the update badge (a data-version badge, a language switcher; hidden while null). Projects that patched these in locally, such as AbxPilot, re-scaffold with `node scripts/scaffold.js ustcubuk AbxPilot.UI --avalonia` after moving their old `teknesyum-ui/ustcubuk` files aside (scaffold never overwrites), then drop the patch.

### Fixed
- The support chip takes its measured on pairs: `OnRenk2x20` on hover and `OnRenk2x10` on keyboard focus. Focus used `Renk2Text`, which held only 7.93:1 in the Kar palette and would fall to 6.80:1 on the hover fill; the on pairs are the gated text for each fill and clear 7:1 in every shipped palette (lowest 11.22:1 hover, 12.93:1 focus, both Kağıt).

## [0.11.0] - 2026-09-27

### Added
- `scripts/uc.js` writes the instruction for the `uc` mark (Teknesyum Core 0.47.0 hands it over): the owner's layout applied to every window, panel and dialog from a screen inventory, setup when the project is not bound, the pending shelf books, the scan, live contrast and the finish line. It reads the procedure through `raf.js ui-denetim`.

## [0.10.1] - 2026-09-27

### Fixed
- A shelf book's hash no longer depends on line endings, so a CRLF checkout does not make it pending.

## [0.10.0] - 2026-09-27

### Added
- The private shelf is enforced like a built-in rule set. A book in `private/tercihler/` with a
  frontmatter block (`tetik`, `icerik`, `her`, `ister`) applies to the projects it matches: the
  session hook names a pending book, the first write to its subject is refused once per
  session, and the new `raf/ister` rule runs its checks. `raf.js --uydu <book>` records a book
  in `.claude/teknesyum-raf.json` once its checks pass; `raf.js --uyan` lists the state.

## [0.9.0] - 2026-09-27

### Added
- `scan.js --fix` binds an in-palette hex in a `.css` file to its token (`var(--tk-renk-1)`), and
  `colour/raw-colour` names the token to use in every message.
- An icon for the preview app, its window and its desktop shortcut (`ui/onizleme/masaustu/ikon/`).
- A README banner in English and Turkish, six panel screenshots in six themes, and
  `docs/diagram.md` with every flow diagram.
- A cost test: only a SessionStart hook may write context; PreToolUse and Stop may not.
- The preview app has a separate Yayımla step: Kaydet writes the record to this machine only, Yayımla commits and pushes it to the private repository. Both dialogs show the old print on the left and the new one on the right, above the list of differences.
- Curve cards mark curves that overshoot their target and come back (Hedefi Aşar, Geri Döner).
- The preview app remembers which setting groups are open and the window position, size and maximized state.
- The preview app moves with the chosen motion settings: a sliding marker follows the selected page in the left menu, pages enter from the direction of travel, and the Okunurluk section links scroll along the interface curve over the slow duration.

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
- Preview: Kaydet also writes the full record to the private shelf as a standalone token file,
  `teknesyum-ui/benim.tokens.json`, with notes in `benim.notlar.json` beside it (Benim Token
  Dosyam); Yayımla pushes both files together with the settings record.
- `setup.js --template benim` reads that file and is the default the moment it exists,
  falling back to `neon` otherwise. The config records a `duzen` field (a 16-hex hash of the
  file) and `notlar`; a changed hash makes `setup.js` re-copy the generated theme.
- `scan.js` measures colour and duration rules against the project's own
  `teknesyum-ui/theme.tokens.json` and `theme.css` when both exist, and no longer walks its
  own `teknesyum-ui/` output directory as a source of files to check. A whole-project run
  that ends at zero open findings writes `denetim: {tarih, duzen}` into the project's
  `teknesyum-ui.json`.
- SessionStart hook `baslangic.js`: silent in a clean project; on the first UI file with no
  config it leaves a short note; with UI files and no setup, no audit, or a stale `duzen` it
  tells the agent to set up, scan, fix to zero open findings and report two lines before
  continuing the user's request; otherwise it scans in the background and only speaks up if
  open findings remain.
- PreToolUse hook `once.js`: denies writing a UI file (`.css`, `.tsx`, `.jsx`, `.vue`,
  `.svelte`, `.xaml`, `.axaml`) in a project with no `teknesyum-ui.json` at all, until setup
  has run.
- `raf.js` reads the private shelf's `teknesyum-ui/kurallar/` first, then falls back to
  `tercihler/`; a name present in both is read from `kurallar/`.

### Changed
- `kaydet.js` writes the new version into every package file even when one had drifted.
- README and README.tr rewritten for the current plugin: numbers, cost table, hooks, private
  shelf, screenshots.
- Geri Al in the preview returns to the value in the selected token file (Benim Token Dosyam included), not to the standard.

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

[Unreleased]: https://github.com/Teknesyum/Teknesyum-UI/compare/v0.12.0...HEAD
[0.3.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.3.0
[0.2.0]: https://github.com/Teknesyum/Teknesyum-UI/releases/tag/v0.2.0
