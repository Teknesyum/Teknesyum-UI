# Scanner exceptions

A rule that is right and an artifact that is right can still meet. When they do, the rule
gets a narrow exemption defined by PATTERN — never by file name. Every exemption on this
page is pinned by a `good` fixture, so removing it breaks the suite.

## `core/text-glow` — the hero glow token

**Pattern:** `filter: drop-shadow(var(--*glow-hero))` as the whole value.

Text never glows; the hero heading is the single exception and the tokens say so —
`glow.rationale` in `theme.tokens.json` reads "text is never given a glow, the sole
exception being hero (SKILL §2)". The exemption is the TOKEN, not the selector: any other
`drop-shadow` on a text element still reports, and a hero that writes its own blur and
alpha instead of `--tk-glow-hero` reports too. That is the point — the exception is
allowed to exist exactly once, at one intensity, in one place.

`states/hero-glow-forced-colors` still applies: the hero glow must be surrendered under
`forced-colors`.

Fixture: `__fixtures__/core/text-glow/good/type.css`.

## `colour/tokenized-radius` — the full round in XAML

**Pattern:** a `CornerRadius` whose value is exactly half a `Width` or `Height` written on
the same element.

`radius.r.rationale` names the exception itself: "The single radius. The exception is the
circle: badge, slider thumb, status dot." CSS can write that exception as `50%` and the
rule already skips it. XAML has no percentage form — a 16x16 thumb must write
`CornerRadius="8"` — so the same shape arrived as a bare number and read as an off-scale
radius.

The exemption reconstructs the intent from the geometry rather than trusting the number:
half of a stated side is a circle or a pill, any other number is still a scale violation.
An element that does not state its own `Width`/`Height` gets no exemption.

Fixture: `__fixtures__/colour/tokenized-radius.good.xaml`. The live cases are the slider
thumb (16 / 8) and the track (4 / 2) in `assets/States.xaml`.
