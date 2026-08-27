# Coverage — `forms` module

`ui/scripts/rules/forms.js`. 20 rules: 14 error, 6 warn. Fixtures:
`ui/scripts/rules/__fixtures__/forms/<rule>/{bad,good}/`.

## Applied

| SCAN row | Rule id | Kind | Severity | Note |
|---|---|---|---|---|
| No placeholder attribute | `no-placeholder` | line | error | `placeholder`, `PlaceholderText`, `Watermark`. CSS `::placeholder` is out of scope by extension. |
| Error field has `aria-invalid` and `aria-describedby` | `error-field-aria-pair` | file | error | Per element tag; either attribute alone is a finding. |
| `role="alert"` only on persistent danger toast | `alert-role-scope` | line | error | Passes when the same element names `danger` or `error`. |
| Error border is the full `danger` hex | `error-border-alpha` | line | error | Alpha forms derived from `ctx.theme` / `ctx.tokens` danger: `#AARRGGBB`, `#RRGGBBAA`, `rgba()`, `danger/50`. Silent when the token is missing. |
| Toast stack capped at 3 | `toast-stack-cap` | file | error | Cap read from token `toast-max`; accepts `nth-child(n + max+1)`, `slice`, or a named cap constant. Silent while the token does not exist. |
| No `MessageBox.Show` | `no-messagebox` | line | error | |
| Panels use `MinHeight`, never fixed `Height` | `panel-fixed-height` | file | error | Narrowed: skips `ControlTemplate` bodies, `Canvas`, and tags that fix both `Width` and `Height` — those are graphics, not layout panels. |
| `UseLayoutRounding` / `SnapsToDevicePixels` not `False` | `layout-rounding-off` | line | error | Has `fix`. |
| Template outline is the template root | `template-outline-root` | file | error | Narrowed: a sibling counts as an outline only when it is full-bleed — no alignment, no fixed size. Slider tracks and decorative parts do not trip it. |
| `ItemsControl` containers get their own template | `itemscontrol-template` | file | error | `TabControl`, `ToolBar`, `Menu` styles that set a border but no `Template`. |
| No UI string literals in code | `no-ui-string-literal` | line | warn | Deliberately narrow: JSX text nodes and XAML `Content`/`Text`/`Header` only, three words or more, letters present, no `{` or `$`. Severity lowered from the SCAN table to `warn` by contract — this rule produces the most false positives. |
| `locale/tr.json` and `en.json` share a key set | `locale-key-parity` | project | error | Flattened key diff, both directions. |
| Placeholders are named `{count}` | `locale-named-placeholder` | project | error | |
| No string concatenation of sentence fragments | `no-sentence-concat` | line | warn | Fires only when one side is a `t(...)` call. |
| Turkish casing | `turkish-casing` | line | error | `toUpperCase()` / `toLowerCase()` with no arguments; `ToUpper()` / `ToLower()` in C# without a culture. `fix` for JS only. |
| UI paragraphs at most four lines | `locale-paragraph-shape` | project | warn | Multi-line locale values only. |
| No prebuilt theme library | `no-theme-library` | file | error | MUI, Material UI, MahApps, HandyControl, WPF UI. |
| `gsap` absent from application code | `no-gsap` | file | error | Paths containing `promo`, `landing` or `site` are exempt. |
| Every borrowed component in `docs/licenses.md` | `borrowed-licence-recorded` | project | warn | Borrowed means a path under `vendor` / `third-party` / `borrowed`. |
| Unmeasured numbers carry the label | `unmeasured-label` | project | warn | `.md` files reaching `ctx.files`; lines naming a default with a number. |

## Skipped

| SCAN row | Why |
|---|---|
| No UPPERCASE UI labels (line 150) | Not in this contract's rule list. It is a locale-value casing check and belongs with whichever module owns typography casing; nothing implements it yet. |

## Silent by design

- `error-border-alpha` and `toast-stack-cap` return nothing when their token is absent
  (`danger`, `toast-max`). `toast-max` is still marked missing in `docs/EXTRACT.md`, so the
  toast cap does not fire until the token lands.
- `unmeasured-label` and `borrowed-licence-recorded` depend on what `scan.js` puts in
  `ctx.files`; if `.md` and vendored files are not scanned, both stay quiet.
- No rule throws: every token, `ctx.read` and `JSON.parse` path is guarded.
