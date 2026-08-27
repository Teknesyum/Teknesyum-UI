# Scanner rule API

`scan.js` loads every `ui/scripts/rules/*.js`. A module exports:

```js
module.exports = {
  id: 'colour',
  lineRules: [{
    id: 'raw-hex',
    severity: 'error',            // 'error' | 'warn'
    exts: ['.css', '.tsx'],       // omit for all
    test(line, ctx),              // -> message string, or null
    fix(line, ctx),               // optional -> replacement line, or null
  }],
  fileRules: [{
    id: 'five-states',
    severity: 'error',
    exts: ['.css'],
    check(file, text, ctx),       // -> [{ line, message, fix? }]
  }],
  projectRules: [{
    id: 'locale-key-parity',
    severity: 'error',
    check(ctx),                   // -> [{ file, line, message }]
  }],
};
```

`ctx`:

| Field | Value |
|---|---|
| `root` | absolute project root |
| `config` | merged `teknesyum-ui.json`, English keys |
| `tokens` | parsed `theme.tokens.json` |
| `theme` | parsed `theme.css` custom properties, name → value |
| `files` | `[{ path, rel, ext, text }]` for every scanned file |
| `modules` | `.ts` / `.js` / `.mjs` / `.cjs` files, `text` lazily read — for dependency and import checks |
| `read(rel)` | reads any project file, null when absent |
| `ext` | current file extension, inside `lineRules` |

## Scanned files

`ctx.files` carries every file with one of these extensions:

| Group | Extensions |
|---|---|
| Style | `.css` |
| Markup | `.tsx` `.jsx` `.vue` `.svelte` |
| XAML | `.xaml` `.axaml` |
| Code | `.cs` `.ts` `.js` `.mjs` `.cjs` |
| Prose | `.md` |

`.ts` `.js` `.mjs` `.cjs` also appear in `ctx.modules`, where `text` is read lazily.

A rule without `exts` sees all of them. Declare `exts` unless the rule really is
extension-agnostic — a CSS or XAML rule left open now runs against `.md` and `.cs` too.

Generated artifacts never reach `ctx.files`: `Palette.cs` and `theme.tokens.json` are
skipped by name. `theme.css`, `Theme.xaml` and `Theme.axaml` are scanned but exempt inside
the rules that would flag their token declarations.

A finding is `{ file, line, rule, severity, message, fix }`. `rule` is
`<module id>/<rule id>`. Line numbers are 1-based.

Rules never throw. A rule that cannot evaluate returns nothing.

Colour, size and duration comparisons read `ctx.tokens` / `ctx.theme`. Never hardcode a
value in a rule; if the token is missing, the rule returns nothing.
