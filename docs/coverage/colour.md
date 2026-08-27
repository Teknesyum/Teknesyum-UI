# Coverage — `colour` module

`ui/scripts/rules/colour.js`. 23 rules: 21 file rules, 2 project rules.
Every value comes from `ctx.theme` / `ctx.tokens`; a missing token silences the rule.

Token definition files are exempt by basename: `theme.css`, `theme.tokens.json`,
`Theme.xaml`, `Theme.axaml`, `Palette.cs`.

## Implemented

| SCAN row | Rule id | Severity | Exts | Reads |
|---|---|---|---|---|
| No raw hex / rgb in components | `raw-colour` | error | all | — |
| No arbitrary Tailwind palette | `tailwind-palette` | error | web | — |
| No mid greys | `mid-grey` | error | all | palette |
| Mono value colour is `pink-text` | `mono-value-colour` | error | all | `pink`, `pink-text` |
| Ghost button text is `purple-text` | `ghost-button-text` | error | all | `purple`, `purple-text` |
| Filled button text is black | `filled-button-text` | error | all | `black` |
| Default border `/50`, `/30` decorative only | `border-alpha` | warn | css/vue/svelte | `border`, `border-decorative` alpha |
| `warning` never a fill | `warning-fill` | error | all | `warning` |
| No `info` token or variant | `info-token` | error | all | — |
| No white backgrounds | `white-background` | error | all | — |
| Background is the 11-stop gradient | `background-gradient` | error | all | `bg-gradient.durak` |
| WPF gradients carry `ScRgbLinearInterpolation` | `wpf-gradient-interpolation` | error | `.xaml` | — |
| Unused token declared but never referenced | `unused-token` | warn | project | — |
| Type sizes come from the five-step scale | `type-scale` | error | all | `fs-1`…`fs-5` |
| No font-size below 14 | `min-font-size` | error | all | smallest `fs-*` |
| Weight 700 forbidden outside hero | `hero-weight` | error | all | — |
| `line-height` declared on text roles | `line-height` | warn | css/vue/svelte | — |
| WPF `LineStackingStrategy` where `LineHeight` set | `wpf-line-stacking` | error | `.xaml` | — |
| Tabular numerals declared | `tabular-numerals` | warn | project | — |
| Data numbers use the mono class | `mono-data-numbers` | warn | tsx/jsx | — |
| No UPPERCASE UI labels | `uppercase-label` | error | web | — |
| Only tokenized radii | `tokenized-radius` | error | all | `r`, `r-*` |
| No Tailwind default radius/tracking/size utilities | `tailwind-utility` | error | web | — |

## Narrowed on purpose

- **`raw-colour`** exempts `#000` / `#000000`. The standard itself prescribes black for
  filled button text and the focus ring inner layer, and no `--tk-black` exists in
  `theme.css`; flagging it would fight the rule above it. Black as a *background* is still
  caught by `background-gradient`.
- **`mid-grey`** does not carry the three literal greys from SKILL §2. It derives the class:
  off-palette, achromatic (channel spread ≤ 24), not pure black or white. `--tk-disabled`
  is in the palette, so it passes.
- **`border-alpha`** is `warn`, not the table's `error`. "Decorative selector" is a name
  heuristic (`divider|separator|rule|decor|::before|::after|hr|scrollbar|watermark`); a
  correct decorative selector under another name would be a false positive.
- **`hero-weight`** boundary 700 is the rule's own constant — the `fw-*` tokens are listed
  as missing in EXTRACT DATA. Hero is recognised by `hero` in the selector / `x:Key` /
  the JSX line.
- **`mono-data-numbers`** fires only on `.toFixed(` / `.toLocaleString(` in JSX without
  `tk-mono` / `font-mono` on the same line. Detecting "value cells" in general produces
  false positives; `warn`.
- **`uppercase-label`** covers the mechanical cause: `text-transform: uppercase` and the
  Tailwind `uppercase` utility. The locale-value case check named in the SCAN source
  belongs with the `locale/*.json` rules, which this module does not own.
- **`wpf-gradient-interpolation`** is `.xaml` only. Avalonia has no
  `ColorInterpolationMode`; `Theme.axaml` says so in its own comment.
- **`unused-token`** only reports custom properties declared *in project files*. Reporting
  unreferenced tokens from the shipped `theme.css` would warn on most of the palette in
  every project.
- **`background-gradient`** skips CSS system colour keywords (`Canvas`, `ButtonFace`, …)
  so the mandated `forced-colors` surrender does not trip it.

## Not implemented here — owned by another module

`No glow on text` · `Hero glow is the token` · `No glow on repeated items` ·
`WPF DropShadowEffect in item templates` · `backdrop-filter per scroll path` ·
everything under motion, states, focus, forms, a11y, locale and dependencies.

## Known gaps

- `--tk-r-window` (12px) is listed as missing in EXTRACT DATA and is absent from
  `theme.css`. Until it is generated, `tokenized-radius` reports every window-shell
  `CornerRadius="12"`. The rule is correct; the token is not there yet.
- `line-height` and `border-alpha` read CSS blocks only; `.tsx` inline styles and Tailwind
  arbitrary values are out of reach for both.
