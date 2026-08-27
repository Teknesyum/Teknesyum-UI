# Rule coverage

Every rule extracted from the Base standard, and where it went. Nothing was dropped
silently: a rule that is not implemented says so here, with the reason.

| File | Module | Rules |
|---|---|---|
| [colour.md](colour.md) | `colour` | palette, typography, measurement |
| [states.md](states.md) | `states` | state matrix, focus, motion, accessibility |
| [forms.md](forms.md) | `forms` | forms, layout, locale, dependencies |
| [tokens.md](tokens.md) | — | which extracted values became tokens |
| [exceptions.md](exceptions.md) | — | rules that are correct but must not run in one pattern |

The extraction itself is [../EXTRACT.md](../EXTRACT.md): every rule of the old standard
sorted into data, scanner, skill, or dropped.
