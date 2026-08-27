# Teknesyum UI

A neon interface standard for Claude Code: one palette, one type scale, one signature,
across web, React, Electron, WPF and Avalonia.

Split out of Teknesyum Base so that [Teknesyum Core](../Teknesyum-Core) stays a work relay
and nothing more. Core has no opinion about how anything looks; this project has all of it.

**Off until you ask for it.** The standard applies only where a `teknesyum-ui.json` exists.
Installing the plugin changes nothing on its own.

---

## Status

Carried over from Base, not yet reworked. What is here:

```
ui/skills/teknesyum-ui/   the standard: SKILL.md, 8 references, 18 assets
ui/roles/ui-builder.md    the role an agent reads to build UI
ui/scripts/uicheckup*.js  read-only conformance scan and its apply step
docs/                     the two Base commands, kept as reference
```

## Before it ships

1. **Language.** `SKILL.md` is Turkish. Everything that reaches git is English here too.
2. **Size.** 60 KB of SKILL plus 8 references is a large load for one skill. It needs the
   same treatment Core got: what the model already knows comes out, what is arbitrary —
   token values, spacing scale, component anatomy — stays, as tables and one worked
   example.
3. **Cost.** The rules in [Core's cost model](../Teknesyum-Core/docs/COST-MODEL.md) apply
   unchanged: nothing may write into context on an ordinary turn.
4. **Surface.** Base drove this with `/uisetup` and `/uicheckup`. Core dropped commands;
   decide whether this project keeps them or follows the same path.

## Tests

None yet.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

<div align="center">

<a href="https://github.com/sponsors/Teknesyum"><img src="assets/badge-sponsor.svg" alt="Support Teknesyum" height="38"></a>
&nbsp;
<a href="LICENSE"><img src="assets/badge-license.svg" alt="License AGPL-3.0" height="38"></a>

</div>
