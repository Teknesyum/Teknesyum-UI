# Teknesyum UI

An interface standard for Claude Code, shipped as data plus a scanner rather than as a
document the model has to read.

Split out of Teknesyum Base so that [Teknesyum Core](../Teknesyum-Core) stays a work relay
and nothing more. Core has no opinion about how anything looks; this project has all of it.

**Off until you ask for it.** The standard applies only where a `teknesyum-ui.json` exists.
Installing the plugin changes nothing on its own.

---

## The idea

Most of what a "standard" document contains is either something the model already does, or
a number. Neither belongs in its context window.

| Kind of rule | Where it lives | What it costs |
|---|---|---|
| A value — colour, radius, duration, scale step | generated token files in your project | nothing; read one when you need one |
| A mechanically checkable rule | `scan.js` | nothing; it runs, it does not get read |
| Runs against the model's default, or a scan cannot see it | `SKILL.md`, 124 lines | paid once, when UI work starts |

Base spent about 27,000 tokens on `SKILL.md` and 55,000 more on eight reference files
every time an interface came up. This ships 86 scanner rules, one 124-line skill and one
platform reference.

## Install

```bash
/plugin marketplace add Teknesyum/Teknesyum-Core
```

One marketplace carries both plugins. Then `/plugin install teknesyum-ui@teknesyum`.

Then, in the project you want it in:

```bash
node <plugin>/scripts/setup.js
```

Run in your own terminal it asks its own questions and costs nothing. Run inside Claude
Code it prints what it needs, the model asks once, and calls `--apply` with the answers.

It writes `<project>/.claude/teknesyum-ui.json` and generates the theme into
`<project>/teknesyum-ui/` for the targets you pick: `css`, `react`, `wpf`, `avalonia`,
`winforms`.

Neon is the ready answer, not the only one — `--template custom` takes three brand colours
and a surface, and derives the rest on the same formulas.

## Check your work

```bash
node <plugin>/scripts/scan.js <project-root>
```

`0` clean, `1` findings, `2` not configured or off. `--json` for machine output, `--fix`
for the repairs that are safe to automate, `--list-rules` for what it enforces.

A Stop hook runs the same scan when interface files changed and blocks on a violation. It
exits before doing any work when no config exists or `off: true` is set, and it stands down
after two blocks on the same file, so a real disagreement stops the gate rather than the work.

## Tests

```bash
npm test
```

91 assertions, no dependencies. Seven of them are cost assertions: they fail if a hook
starts writing to `additionalContext` or `systemMessage`, if `SKILL.md` grows past 150
lines, or if a slash command reappears.

## Layout

```
ui/skills/teknesyum-ui/   SKILL.md, references/platform.md, assets/
ui/scripts/setup.js       install and generate
ui/scripts/generate.js    tokens -> theme.css, Theme.xaml, Theme.axaml, Palette.cs
ui/scripts/scan.js        the scanner
ui/scripts/rules/*.js     the rules, one module per domain
ui/hooks/guard.js         the Stop hook
ui/roles/ui-builder.md    the role an agent reads to build UI
docs/DECISIONS.md         why it is shaped this way
docs/RULE-API.md          how to write a rule
docs/EXTRACT.md           every rule of the old standard, and where it went
docs/coverage/            what the scanner enforces, and what it does not
```

## Turning it off

```bash
node <plugin>/scripts/setup.js --off
```

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

<div align="center">

<a href="https://github.com/sponsors/Teknesyum"><img src="assets/badge-sponsor.svg" alt="Support Teknesyum" height="38"></a>
&nbsp;
<a href="LICENSE"><img src="assets/badge-license.svg" alt="License AGPL-3.0" height="38"></a>

</div>
