# Interface Patterns

Behaviour patterns proven in shipped applications. Each uses only existing `--tk-*`
tokens; none introduces a colour, size or duration of its own. Source: HemsireNobet 1.6-1.7
(Electron). Scanner coverage is noted per pattern.

## Guidance

### Right Ctrl Help Bubble

While right Ctrl is held, a bubble shows the title and description of the element under the
cursor. On first launch a thin hint band teaches the key and disappears after one use. A
"Now / Next step" line sits beside it.

Scanner: none, behavioural.

### First-Run Green Path

While the guide is open, the next action is framed with a `--tk-success` line. Clicking it
advances to the following action.

Scanner: none. The colour must be the token, so `colour/raw-colour` already covers drift.

### One-Line Help

Help text is a single line; overflow ends in an ellipsis. The full text shows on hover and on
`:focus-visible`, so the element takes `tabIndex`.

Scanner: none.

## Controls

### Two-Press Dangerous Button

The first press turns the label into a confirmation prompt. A second press within 3 s applies
the action; otherwise the label reverts. The pending state is also exposed to assistive
technology through the label.

Scanner: none.

### Long-Press Slots

A slot row (for example Save 1 / 2 / 3):

| Input | Action |
|---|---|
| Click | Load |
| Left button held 1 s | Save |
| Right button held 1 s | Delete |
| Enter / Space | Load |

A `requestAnimationFrame` loop writes a custom property `--dolum` from 0 to 1. An `::after`
layer fills with `transform: scaleX(var(--dolum))`, so only `transform` animates. Save mixes
`--tk-renk-1`, delete mixes `--tk-danger`. A filled slot is marked with `--tk-renk-1` and its
`title` carries the date and time. Early release or `mouseleave` cancels.

Scanner: `states/animated-property` already rejects layout properties for the fill.

### Pin

Right-click pins a table cell. A pinned cell gets an `outline` of `--tk-border-w` in
`--tk-renk-1`. Regenerating the table keeps the pins.

Scanner: none.

## Navigation

### Workflow Separators Between Tabs

A "›" separator between tabs shows the order of the workflow. It carries `aria-hidden="true"`
and `pointer-events: none`.

Scanner: none.

### Problem Counter Badge

When problems exist, the tab turns orange with
`color-mix(in srgb, var(--tk-danger) 50%, var(--tk-warning))` and shows a count badge. With
none, the badge is hidden. The tab's `aria-label` contains the count.

Scanner: none.

## Tables

### Sticky Table Header

In a scrolling table container, `th { position: sticky; top: 0 }`. The table is
`width: auto`, so columns stay tight.

Scanner: none.

### Outline Emphasis On Repeated Items

A repeated item such as a table cell is emphasised with `outline` and a negative
`outline-offset`, never with a `box-shadow` glow.

Scanner: `states/glow-on-repeated-item` (error) rejects `box-shadow` and `drop-shadow` on
repeated items.

## Drag And Drop

### Eligibility Colouring

Dragging starts after a 4 px movement threshold. All target cells are analysed up front and
painted:

| Result | Token | Meaning |
|---|---|---|
| Clean | `--tk-success` | No conflict |
| Soft, one person | `--tk-warning` | One person's request is broken |
| Soft, two people | `color-mix(in srgb, var(--tk-danger) 50%, var(--tk-warning))` | Two people's requests are broken |
| Rule | `--tk-danger` | A rule is broken |

Each cell's `title` states the reason. A rule violation refuses the drop and raises a warning
toast. A soft warning allows the drop and says so in the toast. The source cell is marked with
an `outline`. A drop without movement is an ordinary click (for a `select`, `showPicker`).

Scanner: none, behavioural. Colours are checked by `colour/raw-colour`.
