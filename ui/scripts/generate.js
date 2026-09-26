'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./kontrast');
const assetsDir = path.resolve(__dirname, '..', 'skills', 'teknesyum-ui', 'assets');
const tokensPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(assetsDir, 'theme.tokens.json');
const outDir = process.argv[3] ? path.resolve(process.argv[3]) : assetsDir;
const T = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

function find(name) {
  for (const group of ['brand', 'role', 'derived']) {
    if (T[group] && T[group][name]) return T[group][name];
  }
  throw new Error('unknown token: ' + name);
}

function resolve(name, trail) {
  trail = trail || [];
  if (trail.includes(name)) throw new Error('ref cycle: ' + trail.concat(name).join(' -> '));
  const t = find(name);
  if (t.value !== undefined) {
    const x6 = t.value.slice(1);
    return {
      r: parseInt(x6.slice(0, 2), 16),
      g: parseInt(x6.slice(2, 4), 16),
      b: parseInt(x6.slice(4, 6), 16),
      a: t.alpha !== undefined ? t.alpha : 1
    };
  }
  const base = resolve(t.ref, trail.concat(name));
  return { r: base.r, g: base.g, b: base.b, a: t.alpha !== undefined ? t.alpha : base.a };
}

const hk = n => n.toString(16).padStart(2, '0');
const HK = n => hk(n).toUpperCase();

function h(name) { const c = resolve(name); return '#' + hk(c.r) + hk(c.g) + hk(c.b); }
const WHITE = { r: 255, g: 255, b: 255, a: 1 };
function oran(fill, text, alpha) {
  const f = typeof fill === 'string' ? resolve(fill) : fill;
  const t = typeof text === 'string' ? resolve(text) : text;
  const g = resolve('surface');
  return K.pair({ r: f.r, g: f.g, b: f.b, a: alpha !== undefined ? alpha : f.a }, t, { r: g.r, g: g.g, b: g.b, a: 1 }).ratio.toFixed(2);
}
function rgba(name, alpha) {
  const c = resolve(name);
  const a = alpha !== undefined ? alpha : c.a;
  return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + a + ')';
}
function x(name) { const c = resolve(name); return '#FF' + HK(c.r) + HK(c.g) + HK(c.b); }
function xa(name, alpha) {
  const c = resolve(name);
  const a = alpha !== undefined ? alpha : c.a;
  return '#' + HK(Math.round(a * 255)) + HK(c.r) + HK(c.g) + HK(c.b);
}
function csx(name) { const c = resolve(name); return '#' + HK(c.r) + HK(c.g) + HK(c.b); }
function argb(name, alpha) {
  const c = resolve(name);
  const a = alpha !== undefined ? alpha : c.a;
  return '0x' + HK(Math.round(a * 255)) + ', 0x' + HK(c.r) + ', 0x' + HK(c.g) + ', 0x' + HK(c.b);
}
function ansi(name) { const c = resolve(name); return '\x1b[38;2;' + c.r + ';' + c.g + ';' + c.b + 'm'; }

function gradientStops() {
  const g = T.derived['bg-gradient'];
  const a = resolve(g.from), b = resolve(g.to);
  const out = [];
  for (let i = 0; i < g.stops; i++) {
    const t = i / (g.stops - 1);
    out.push({
      t,
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    });
  }
  return out;
}
function gradientCss() {
  const d = gradientStops();
  return d.map((s, i) =>
    '    #' + hk(s.r) + hk(s.g) + hk(s.b) + ' ' + Math.round(s.t * 100) + '%' + (i < d.length - 1 ? ',' : '')
  ).join('\n');
}
function gradientXaml(indent) {
  return gradientStops().map(s =>
    indent + '<GradientStop Offset="' + s.t.toFixed(1) + '" Color="#FF' + HK(s.r) + HK(s.g) + HK(s.b) + '"/>'
  ).join('\n');
}

function scaleXaml(indent) {
  const tone = T.derived['tone-scale'];
  const text = T.derived['text-scale'];
  const row = (base, step) => {
    const key = '"' + pascal(base + '-' + step) + '"';
    return indent + '<SolidColorBrush x:Key=' + key.padEnd(15) + 'Color="' + xa(base, step / 100) + '"/>';
  };
  const groups = tone.bases.map(base => tone.steps.map(step => row(base, step)).join('\n'));
  groups.push(text.bases.map(base => text.steps.map(step => row(base, step)).join('\n')).join('\n'));
  return groups.join('\n\n');
}

function onPairs() {
  const table = T.on || {};
  return Object.keys(table)
    .filter(k => k !== '_')
    .map(name => ({ name, on: table[name].on === undefined ? null : table[name].on, rationale: String(table[name].rationale || '') }));
}
function fillColour(name) {
  const tone = T.derived && T.derived['tone-scale'];
  const m = /^(.+)-(\d+)$/.exec(name);
  if (m && tone && tone.bases.includes(m[1]) && tone.steps.includes(Number(m[2]))) {
    const c = resolve(m[1]);
    return { r: c.r, g: c.g, b: c.b, a: Number(m[2]) / 100 };
  }
  return resolve(name);
}
function onGate() {
  const g = resolve('surface');
  const ground = { r: g.r, g: g.g, b: g.b, a: 1 };
  const bad = [];
  for (const p of onPairs()) {
    if (p.on === null) continue;
    let fill, text;
    try {
      fill = fillColour(p.name);
      text = resolve(p.on);
    } catch (e) {
      bad.push(p.name + ' on ' + p.on + ' — ' + e.message);
      continue;
    }
    const r = K.pair(fill, text, ground).ratio;
    if (r < K.THRESHOLD) {
      bad.push(p.on + ' on ' + p.name + ' — ' + r.toFixed(2) + ':1, below ' + K.THRESHOLD + ':1');
      continue;
    }
    const said = /(\d+(?:\.(\d+))?):1/.exec(p.rationale);
    if (said && said[1] !== r.toFixed(said[2] ? said[2].length : 0))
      bad.push(p.on + ' on ' + p.name + ' — rationale says ' + said[1] + ':1, measured ' + r.toFixed(2) + ':1');
  }
  return bad;
}
function pascal(name) {
  return name.split('-').reduce((out, s) => out + (/^\d/.test(s) && /\d$/.test(out) ? 'x' : '') + s.charAt(0).toUpperCase() + s.slice(1), '');
}
function onCss() {
  const rows = onPairs().filter(p => p.on !== null);
  if (!rows.length) return '';
  return '\n  /* On pairs: the text colour each fill takes, measured by generate.js at 7:1\n' +
    '     after compositing a translucent fill over surface. A fill with no on pair\n' +
    '     carries no text. */\n' +
    rows.map(p => '  --tk-on-' + p.name + ': ' + h(p.on) + ';').join('\n') + '\n';
}
function onXaml(indent) {
  const rows = onPairs().filter(p => p.on !== null);
  if (!rows.length) return '';
  return '\n' + indent + '<!-- On pairs: the text brush each fill takes, measured by generate.js at 7:1\n' +
    indent + '     after compositing a translucent fill over Surface. A fill with no On brush\n' +
    indent + '     carries no text. -->\n' +
    rows.map(p => indent + '<SolidColorBrush x:Key=' + ('"On' + pascal(p.name) + '"').padEnd(16) + 'Color="' + x(p.on) + '"/>').join('\n') + '\n';
}

function glowCss(base) {
  const g = T.derived.glow;
  return '0 0 ' + g.blur + 'px ' + rgba(base, g.alpha);
}
function glowCssHero() {
  const g = T.derived['glow-hero'];
  return '0 0 ' + g.blur + 'px ' + rgba(g.ref, g.alpha);
}
function gx(name) { const g = T.derived[name]; return xa(g.ref, g.alpha); }

function fontCss(name) {
  const f = T.font[name];
  const chain = f['css-quote'] ? f.chain.map(s => "'" + s + "'") : f.chain;
  return chain.join(', ') + ', ' + f['css-fallback'];
}
function fontCssBody(name) {
  const f = T.font[name];
  return f.chain.map(s => "'" + s + "'").join(', ') + ', ' + f['css-body-fallback'];
}
function fontXaml(name) { return T.font[name].chain.join(', '); }
function csFamily(name) { return T.font[name].chain.map(s => '"' + s + '"').join(', '); }

function durationCss(name) {
  const ms = T.duration[name].ms;
  return ms >= 1000 && ms % 1000 === 0 ? (ms / 1000) + 's' : ms + 'ms';
}
function durationXaml(name) { return '0:0:' + (T.duration[name].ms / 1000); }
function bezier(name) { return 'cubic-bezier(' + T.easing[name].bezier.join(', ') + ')'; }
function splineAx(name) {
  const b = T.easing[name].bezier;
  return 'X1="' + b[0] + '" Y1="' + b[1] + '" X2="' + b[2] + '" Y2="' + b[3] + '"';
}

function measure(p, trail) {
  trail = trail || [];
  if (trail.includes(p)) throw new Error('ref cycle: ' + trail.concat(p).join(' -> '));
  const group = p.split('.')[0];
  const key = p.split('.').slice(1).join('.');
  const t = T[group] && T[group][key];
  if (!t) throw new Error('unknown measure: ' + p);
  return t.value !== undefined ? t : measure(t.ref, trail.concat(p));
}
function mvar(p) {
  const group = p.split('.')[0];
  const key = p.split('.').slice(1).join('.');
  return '--tk-' + (group === 'space' && /^\d+$/.test(key) ? 'sp-' + key : key);
}
function mcss(p) {
  const group = p.split('.')[0];
  const t = T[group][p.split('.').slice(1).join('.')];
  if (t.ref !== undefined) return 'var(' + mvar(t.ref) + ')';
  const v = t.value + (t.unit || '');
  if (t['vw-max'] !== undefined) return 'min(' + v + ', ' + t['vw-max'] + 'vw)';
  if (t['gutter-ref'] !== undefined) {
    return 'min(' + v + ', calc(100vw - var(' + mvar(t['gutter-ref']) + ') * 2))';
  }
  return v;
}
function m(p) { return String(measure(p).value); }
function mtime(p, tag, key) {
  return '<' + tag + ' x:Key="' + key + '">0:0:' + (measure(p).value / 1000) + '</' + tag + '>';
}
function fw(name) { return T.size[name].xaml; }
function boxShadowCss(name) {
  const g = T.derived[name];
  return '0 0 ' + g.blur + 'px ' + rgba(g.ref, g.alpha);
}

function metricXaml(indent, timeTag) {
  const d = (key, p) => indent + '<sys:Double x:Key="' + key + '">' + m(p) + '</sys:Double>';
  const t = (key, p) => indent + mtime(p, timeTag, key);
  return [
    indent + '<!-- Numeric tokens: the same values as the CSS tk-* custom properties, in DIP.',
    indent + '     Tracking is em, line height a multiplier, ratios unitless. -->',
    d('FontSize1', 'size.fs-1'),
    d('FontSize2', 'size.fs-2'),
    d('FontSize3', 'size.fs-3'),
    d('FontSize4', 'size.fs-4'),
    d('FontSize5', 'size.fs-5'),
    d('LineHeightBody', 'size.lh-body'),
    d('LineHeightHeading', 'size.lh-heading'),
    d('LineHeightMono', 'size.lh-mono'),
    d('MeasureCh', 'size.measure'),
    d('TrackingLabel', 'size.tr-label'),
    d('TrackingH3', 'size.tr-h3'),
    d('TrackingH2', 'size.tr-h2'),
    d('TrackingHero', 'size.tr-hero'),
    indent + '<FontWeight x:Key="WeightBody">' + fw('fw-body') + '</FontWeight>',
    indent + '<FontWeight x:Key="WeightSemi">' + fw('fw-semi') + '</FontWeight>',
    indent + '<FontWeight x:Key="WeightHero">' + fw('fw-hero') + '</FontWeight>',
    '',
    d('Space1', 'space.1'),
    d('Space2', 'space.2'),
    d('Space3', 'space.3'),
    d('Space4', 'space.4'),
    d('Space5', 'space.5'),
    indent + '<Thickness x:Key="PanelPadding">' + m('space.panel-padding') + '</Thickness>',
    indent + '<Thickness x:Key="InputPadding">' + m('space.input-padding-x') + ',0</Thickness>',
    d('SectionGap', 'space.section-gap'),
    d('RowGap', 'space.row-gap'),
    d('FieldGap', 'space.field-gap'),
    d('FieldStack', 'space.field-stack'),
    d('ToastInset', 'space.toast-inset'),
    d('ToastGap', 'space.toast-gap'),
    '',
    indent + '<CornerRadius x:Key="Radius">' + m('shape.r') + '</CornerRadius>',
    indent + '<CornerRadius x:Key="WindowRadius">' + m('shape.r-window') + '</CornerRadius>',
    indent + '<Thickness x:Key="BorderWidth">' + m('shape.border-w') + '</Thickness>',
    d('FocusWidth', 'shape.focus-w'),
    d('FocusOffset', 'shape.focus-offset'),
    '',
    d('TargetMin', 'metric.target-min'),
    d('ScrollbarWidth', 'metric.scrollbar-w'),
    d('TitleBarHeightMin', 'metric.titlebar-h-min'),
    d('TitleBarHeightMax', 'metric.titlebar-h-max'),
    d('SidebarWidth', 'metric.sidebar-w'),
    d('SidebarCollapsedWidth', 'metric.sidebar-collapsed-w'),
    d('InputHeight', 'metric.input-h'),
    d('ModalWidth', 'metric.modal-w'),
    d('ModalMaxRatio', 'metric.modal-max-ratio'),
    d('ToastWidth', 'metric.toast-w'),
    d('ToastMax', 'metric.toast-max'),
    t('ToastLife', 'metric.toast-life'),
    d('IconSize1', 'metric.icon-1'),
    d('IconSize2', 'metric.icon-2'),
    d('IconSize3', 'metric.icon-3'),
    d('IconSize4', 'metric.icon-4'),
    '',
    d('ScaleHover', 'motion.scale-hover'),
    d('ScalePress', 'motion.scale-press'),
    d('ScaleIconHover', 'motion.scale-icon-hover'),
    d('EntryOffset', 'motion.entry-offset'),
    d('OverlayOffset', 'motion.overlay-offset'),
    d('StaggerMax', 'motion.stagger-max'),
    d('GlowMargin', 'motion.glow-margin'),
    d('BgSweepMax', 'motion.bg-sweep-max'),
    t('Stagger', 'motion.stagger'),
    t('LoadingLoopMin', 'motion.loading-loop-min'),
    t('FrameBudget', 'motion.frame-budget'),
    t('BgRotateMin', 'motion.bg-rotate-min')
  ].join('\n');
}


function emitCss() {
  return `/* Teknesyum Neon — single source. Do not override these values in a project. */

@theme {
  --color-neon-renk-1: ${h('renk-1')};
  --color-neon-renk-2: ${h('renk-2')};
  --color-neon-renk-3: ${h('renk-3')};
  --color-neon-success: ${h('success')};
  --color-renk-2-text: ${h('renk-2-text')};
  --color-renk-3-text: ${h('renk-3-text')};
  --color-surface: ${h('surface')};
  --color-dark-glass: ${rgba('glass')};

  /* Semantic role layer — Tailwind side. This and the \`--tk-*\` layer are TWO
     SEPARATE layers; updating one and leaving the other strands a helper class
     like \`bg-danger\` on an old hex. Walk both together; the audit measures their
     equality.
     A role's Tailwind name carries the role name, not the brand name:
     \`text-danger\`, \`border-warning\`. \`--color-neon-success\` was not renamed
     because \`references/components.md\` binds to that name; the role name lives
     in \`--tk-success\`. */
  --color-danger: ${h('danger')};
  --color-danger-text: ${h('danger-text')};
  --color-warning: ${h('warning')};

  /* The chain's only source is SKILL §3; the order here matches the order there.
     Atkinson Hyperlegible Next is the default and is embedded in the project, not
     assumed present on the system. Without embedding the chain falls back to
     Segoe UI — that is not an acceptance, it is a gap; embedding is part of
     delivery. */
  --font-sans: ${fontCss('sans')};
  --font-mono: ${fontCss('mono')};
}

:root {
  --tk-renk-1: ${h('renk-1')};
  --tk-renk-2: ${h('renk-2')};
  --tk-renk-3: ${h('renk-3')};
  --tk-success: ${h('success')};
  --tk-surface: ${h('surface')};
  --tk-bg-rotate: ${durationCss('bg-rotate')};
  --tk-bg-from: ${h('black')};
  --tk-bg-to: ${h('surface')};
  --tk-bg: linear-gradient(
    var(--tk-bg-angle, 160deg),
${gradientCss()}
  );
  --tk-glass: ${rgba('glass')};

  --tk-renk-2-text: ${h('renk-2-text')};
  --tk-renk-3-text: ${h('renk-3-text')};

  /* --- semantic role layer (SKILL §2) ---
     THE ROLE WINS. Every component that reports state — error text, form
     validation, warning box, status dot, danger button — writes this layer.
     Brand and decoration (glow, scrollbar, hero, heading) keep writing the brand
     token. A role token follows the VALUE of a brand token, not a copy of it:
     the hex is never hand-written, it is bound with \`var()\`. The one exception
     is \`--tk-warning\` — it has no counterpart in the brand triad and carries its
     own hex.
     \`--tk-success\` is defined above and is already a role token; no second name
     was given, because a single value with two names eventually diverges.
     \`--tk-info\` IS DELIBERATELY ABSENT: there is no info box today and an unused
     token is debt. If one opens it binds to renk-1 (\`var(--tk-renk-1)\`) and an info
     fill is never used on the same screen as a primary button — both would be
     renk-1 fills and the user could not tell which one is clickable. */
  --tk-danger: var(--tk-renk-2);
  /* The TEXT role of danger. The fill renk-2 falls below §2's 7:1 threshold as
     text; error text therefore writes this token rather than the fill token.
     The renk-2/renk-3 fill-vs-text split continues in the
     role layer. */
  --tk-danger-text: var(--tk-renk-2-text);

  /* \`warning ${h('warning')}\` — WARNING SURFACE ONLY: text, border, icon.
     No fill, no button. The constraint is the same pattern as \`success\`, not a
     new one. The ban was measured: white text on an amber fill is ${oran('warning', WHITE)}:1 — it
     collapses. Black text would give ${oran('warning', 'black')}:1, but a pattern that permits a fill
     reopens the text-colour argument every time; a warning surface is built from
     text, border and icon.
     WHAT REPLACES IT: warning text \`--tk-warning\` (${oran('surface', 'warning')}:1), border
     \`--tk-warning-border\` (${oran('surface', resolve('warning-border'))}:1 on \`${h('surface')}\` — clears 1.4.11's 3:1 threshold;
     renk-2 /50 at ${oran('surface', { ...resolve('renk-2'), a: 0.5 })} and renk-3 /50 at ${oran('surface', { ...resolve('renk-3'), a: 0.5 })} did NOT carry this rung, amber does),
     icon the same colour. If an action is needed the button is primary (renk-1) or
     \`danger\` (renk-2) — the warning colour never enters a button.
     COLOUR ALONE CARRIES NO MEANING, amber included from the start: amber does
     not separate from \`success\` under protanopia, ΔE2000 15.2
     A warning row carries an icon or text in
     addition to colour — no exceptions.
     CAVEAT: the \`warning\` hex is subject to the \`U9\` ΔE measurement. If it comes
     out badly, these two lines are what change; the role name and the constraint
     do not. */
  --tk-warning: ${h('warning')};
  --tk-warning-border: ${rgba('warning-border')};

  --tk-text: ${h('text')};
  --tk-text-label: ${h('text-label')};
  /* A disabled control is exempt from 7:1 (SKILL §2) and that exemption has a
     price: a colour-blind user cannot see the grey. So \`--tk-disabled\` is never
     used alone — every disabled control carries a marker in addition to the grey:
     \`title\`/\`ToolTip\` text is mandatory, plus \`cursor: not-allowed\` and, where
     possible, an icon. A merely dimmed control is an incomplete delivery. */
  --tk-disabled: ${h('disabled')};
${onCss()}
  --tk-border: ${rgba('border')};
  --tk-border-strong: ${rgba('border-strong')};
  --tk-border-decorative: ${rgba('border-decorative')};

  /* There is one radius: 6px. The conflict was closed on 2026-08-23 in favour of
     \`layout.md\` — a rounded rectangle takes the smaller corner (SKILL §5). The
     old 16/12/8/6 scale was removed; the four names below remain for backward
     compatibility and all point at the same single value. The one exception is
     the circle (\`?\` badge, slider thumb, status dot) — there, \`border-radius: 50%\`. */
  --tk-r: ${mcss('shape.r')};
  --tk-r-box: var(--tk-r);
  --tk-r-btn: var(--tk-r);
  --tk-r-cell: var(--tk-r);
  --tk-r-chip: var(--tk-r);

  /* Type scale — 1.25 major third, five steps. Do not add an intermediate size;
     if one is needed, the scale itself is up for discussion, not a single use
     site. */
  --tk-fs-1: ${mcss('size.fs-1')};
  --tk-fs-2: ${mcss('size.fs-2')};
  --tk-fs-3: ${mcss('size.fs-3')};
  --tk-fs-4: ${mcss('size.fs-4')};
  --tk-fs-5: ${mcss('size.fs-5')};

  --tk-lh-body: ${mcss('size.lh-body')};
  --tk-lh-heading: ${mcss('size.lh-heading')};
  --tk-lh-mono: ${mcss('size.lh-mono')};
  --tk-measure: ${mcss('size.measure')};

  --tk-tr-label: ${mcss('size.tr-label')};
  --tk-tr-h3: ${mcss('size.tr-h3')};
  --tk-tr-h2: ${mcss('size.tr-h2')};
  --tk-tr-hero: ${mcss('size.tr-hero')};

  /* 700 is forbidden outside hero (SKILL §3); hierarchy is carried by size. */
  --tk-fw-body: ${mcss('size.fw-body')};
  --tk-fw-semi: ${mcss('size.fw-semi')};
  --tk-fw-hero: ${mcss('size.fw-hero')};

  /* Spacing ladder. Everything below it is a reference, not a second
     measurement: a panel's padding IS step 5, it is not "24 by coincidence". */
  --tk-sp-1: ${mcss('space.1')};
  --tk-sp-2: ${mcss('space.2')};
  --tk-sp-3: ${mcss('space.3')};
  --tk-sp-4: ${mcss('space.4')};
  --tk-sp-5: ${mcss('space.5')};
  --tk-panel-padding: ${mcss('space.panel-padding')};
  --tk-section-gap: ${mcss('space.section-gap')};
  --tk-row-gap: ${mcss('space.row-gap')};
  --tk-field-gap: ${mcss('space.field-gap')};
  --tk-field-stack: ${mcss('space.field-stack')};
  --tk-input-padding-x: ${mcss('space.input-padding-x')};
  --tk-toast-inset: ${mcss('space.toast-inset')};
  --tk-toast-gap: ${mcss('space.toast-gap')};

  --tk-r-window: ${mcss('shape.r-window')};
  --tk-border-w: ${mcss('shape.border-w')};
  /* The focus ring is two layers and never animates (SKILL §5.3). */
  --tk-focus-w: ${mcss('shape.focus-w')};
  --tk-focus-offset: ${mcss('shape.focus-offset')};

  --tk-target-min: ${mcss('metric.target-min')};
  --tk-scrollbar-w: ${mcss('metric.scrollbar-w')};
  /* The title bar height is a range in the source, not one number; both ends
     are tokens so a project can pick inside them and stay checkable. */
  --tk-titlebar-h-min: ${mcss('metric.titlebar-h-min')};
  --tk-titlebar-h-max: ${mcss('metric.titlebar-h-max')};
  --tk-sidebar-w: ${mcss('metric.sidebar-w')};
  --tk-sidebar-collapsed-w: ${mcss('metric.sidebar-collapsed-w')};
  --tk-input-h: ${mcss('metric.input-h')};
  --tk-modal-w: ${mcss('metric.modal-w')};
  --tk-modal-max-ratio: ${mcss('metric.modal-max-ratio')};
  --tk-toast-w: ${mcss('metric.toast-w')};
  --tk-toast-max: ${mcss('metric.toast-max')};
  /* Danger toasts never auto-dismiss; this life belongs to the others. */
  --tk-toast-life: ${mcss('metric.toast-life')};
  --tk-icon-1: ${mcss('metric.icon-1')};
  --tk-icon-2: ${mcss('metric.icon-2')};
  --tk-icon-3: ${mcss('metric.icon-3')};
  --tk-icon-4: ${mcss('metric.icon-4')};

  --tk-scale-hover: ${mcss('motion.scale-hover')};
  --tk-scale-press: ${mcss('motion.scale-press')};
  --tk-scale-icon-hover: ${mcss('motion.scale-icon-hover')};
  --tk-entry-offset: ${mcss('motion.entry-offset')};
  --tk-overlay-offset: ${mcss('motion.overlay-offset')};
  --tk-stagger: ${mcss('motion.stagger')};
  --tk-stagger-max: ${mcss('motion.stagger-max')};
  /* An outward glow needs this much clear space; otherwise use a /50 border. */
  --tk-glow-margin: ${mcss('motion.glow-margin')};
  --tk-loading-loop-min: ${mcss('motion.loading-loop-min')};
  --tk-frame-budget: ${mcss('motion.frame-budget')};
  --tk-bg-rotate-min: ${mcss('motion.bg-rotate-min')};
  --tk-bg-sweep-max: ${mcss('motion.bg-sweep-max')};

  --tk-t-instant: ${durationCss('instant')};
  --tk-t-fast: ${durationCss('fast')};
  --tk-t-base: ${durationCss('base')};
  --tk-t-slow: ${durationCss('slow')};
  --tk-e-out: ${bezier('out')};
  --tk-e-in: ${bezier('in')};
  --tk-e-spring: ${bezier('spring')};
  --tk-e-in-out: ${bezier('in-out')};
  --tk-e-fast-slow-fast: ${bezier('fast-slow-fast')};
  --tk-e-emphasized: ${bezier('emphasized')};
  --tk-e-sharp: ${bezier('sharp')};
  --tk-e-linear: ${bezier('linear')};

  --tk-glow-renk-1: ${glowCss('renk-1')};
  --tk-glow-renk-2: ${glowCss('renk-2')};
  --tk-glow-renk-3: ${glowCss('renk-3')};
  /* The hero glow is one token and gives the same intensity on both platforms:
     blur 8, opacity 0.8. Its XAML counterpart is \`HeroGlow\` (Theme.xaml). */
  --tk-glow-hero: ${glowCssHero()};
  /* A shadow is not a glow: it separates the panel from the background gradient
     and takes no brand colour. */
  --tk-shadow-panel: ${boxShadowCss('shadow-panel')};
  --tk-scrim: ${rgba('scrim')};
}

@property --tk-bg-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 160deg;
}

@keyframes tk-bg-rotate {
  from { --tk-bg-angle: 150deg; }
  to   { --tk-bg-angle: 170deg; }
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-sans, ${fontCssBody('sans')});
  font-size: var(--tk-fs-2);
  line-height: var(--tk-lh-body);
  /* Numbers inside a sentence stay sans but align; data numbers go to \`.tk-mono\` (§3). */
  font-variant-numeric: tabular-nums;
  color: var(--tk-text);
  background: var(--tk-bg);
  background-attachment: fixed;
  animation: tk-bg-rotate var(--tk-bg-rotate) linear infinite alternate;
}

/* --- typography --- */
.tk-h2 {
  font-size: var(--tk-fs-4); font-weight: 600;
  line-height: var(--tk-lh-heading); letter-spacing: var(--tk-tr-h2);
  color: var(--tk-renk-1);
}
.tk-h3 {
  font-size: var(--tk-fs-3); font-weight: 600;
  line-height: var(--tk-lh-heading); letter-spacing: var(--tk-tr-h3);
  color: var(--tk-text-label);
}
.tk-label {
  font-size: var(--tk-fs-1); font-weight: 600;
  line-height: var(--tk-lh-heading); letter-spacing: var(--tk-tr-label);
  color: var(--tk-text-label);
}
.tk-mono {
  font-family: var(--font-mono, monospace);
  font-size: var(--tk-fs-2); font-weight: 600;
  line-height: var(--tk-lh-mono);
  color: var(--tk-renk-2-text);
}
.tk-hero {
  font-family: var(--font-mono, monospace);
  font-size: var(--tk-fs-5); font-weight: var(--tk-fw-hero);
  line-height: var(--tk-lh-heading); letter-spacing: var(--tk-tr-hero);
  color: var(--tk-renk-1); filter: drop-shadow(var(--tk-glow-hero));
}
.tk-hint {
  font-size: var(--tk-fs-1); line-height: var(--tk-lh-body); color: var(--tk-text);
}
/* Readable line length. A long block of text is wrapped in this class (§3.2). */
.tk-prose { max-width: var(--tk-measure); line-height: var(--tk-lh-body); }
/* The second signal separating h3 from a label — when size is not enough (§3). */
.tk-h3-rule { border-bottom: 1px solid var(--tk-border-decorative); padding-bottom: 8px; }

/* --- surfaces --- */
.tk-panel {
  background: ${rgba('panel')};
  backdrop-filter: blur(16px);
  border: 1px solid var(--tk-border);
  border-radius: var(--tk-r);
  padding: 24px;
  box-shadow: 0 0 40px ${rgba('black', 0.8)};
}
.tk-divider { border: 0; border-top: 1px solid var(--tk-border-decorative); margin: 24px 0; }

/* --- focus: two layers, no transition, keyboard modality only --- */
:focus-visible {
  outline: 2px solid var(--tk-renk-1);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px ${h('black')};
  transition: none;
}
:focus:not(:focus-visible) { outline: none; }
[data-tk-scroll-target] { scroll-margin-top: 40px; scroll-margin-bottom: 24px; }

/* --- buttons --- */
.tk-btn {
  font-weight: 600; letter-spacing: var(--tk-tr-h2);
  font-size: var(--tk-fs-2); line-height: var(--tk-lh-heading);
  padding: 14px 20px; border-radius: var(--tk-r);
  border: 1px solid transparent; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 12px;
  transition: transform var(--tk-t-instant) var(--tk-e-out),
              background-color var(--tk-t-instant) var(--tk-e-out),
              border-color var(--tk-t-instant) var(--tk-e-out);
}
.tk-btn:hover { transform: scale(1.02); }
/* The pressed state takes a SECOND carrier: under reduced motion \`theme.css\` stops the
   transition, so \`scale\` snaps without travel and 0.98 barely reads. The border carries it.
   Reduced motion never writes \`transform: none\`: positioning transforms
   (a modal centred with translate(-50%, -50%)) must stay where they are. */
.tk-btn:active {
  transform: scale(0.98);
  border-color: var(--tk-border-strong);
  transition-duration: var(--tk-t-instant);
}
.tk-btn-primary   { background: var(--tk-renk-1);   color: var(--tk-on-renk-1); box-shadow: var(--tk-glow-renk-1); }
/* Hover is carried by scale alone: ${T.on['renk-1'].on} on renk-1 /80 measured ${oran('renk-1', T.on['renk-1'].on, 0.8)}:1, below 7:1. */
/* The class name was already in role language; its contents moved to the role
   token too. The glow stays on the brand token — a glow is decoration, it does
   not report state. The fill is the danger TEXT cut: black on the fill renk-2 is
   ${oran('renk-2', 'black')}:1, below 7:1, so renk-2 carries no text (tokens: on.danger); ${T.on['danger-text'].on} on
   danger-text is ${oran('danger-text', T.on['danger-text'].on)}:1. Hover is carried by scale alone. */
.tk-btn-danger    { background: var(--tk-danger-text); color: var(--tk-on-danger-text); box-shadow: var(--tk-glow-renk-2); }
/* A tint and its own hue never meet on one surface (ui-duzeni): the ghost keeps its
   colour in the border and writes body text. Hover adds the renk-3 /10 fill under its
   on pair. */
.tk-btn-ghost {
  background: transparent;
  border-color: var(--tk-renk-3-text);
  color: var(--tk-text);
}
.tk-btn-ghost:hover { background: ${rgba('renk-3', 0.1)}; color: var(--tk-on-renk-3-10); }
/* The disabled state does not end at dimming: \`title\` text is mandatory (§2). */
.tk-btn:disabled {
  color: var(--tk-disabled);
  background: transparent;
  border-color: var(--tk-disabled);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

/* --- scrollbar --- */
::-webkit-scrollbar { width: var(--tk-scrollbar-w); height: var(--tk-scrollbar-w); }
::-webkit-scrollbar-track { background: ${rgba('black', 0.3)}; border-radius: 4px; }
::-webkit-scrollbar-thumb {
  background: var(--tk-renk-3-text); border-radius: 4px;
  /* No glow on the scrollbar: a halo on a thin moving bar smears and reads as noise
     (user feedback, 2026-09-26). Only the fill colour transitions. */
  transition: background-color var(--tk-t-instant) var(--tk-e-out);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--tk-renk-2-text);
}

/* --- title bar and signature (§4) --- */
.tk-titlebar { -webkit-app-region: drag; }
.tk-titlebar a,
.tk-titlebar button,
.tk-no-drag { -webkit-app-region: no-drag; }

/* --- status dot: colour alone carries no meaning (WCAG 1.4.1, §2) --- */
.tk-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.tk-dot-on  { background: var(--tk-success); border: 0; }
/* It reports state, not brand — so it writes a role token. The shape difference
   (filled circle / ring) is the second carrier beside colour; strip the colour
   and the information still stands. */
.tk-dot-off { background: transparent; border: 2px solid var(--tk-danger); }

/* --- warning surface (§2) ---
   Used as a modifier on \`.tk-panel\`: <div class="tk-panel tk-warn">.
   NO FILL — the panel background stays \`surface\`; what changes is the border and
   text colour. The box must carry an icon or the word "Warning" in addition to
   colour; amber does not separate from success under protanopia (measurement above). */
.tk-warn { border-color: var(--tk-warning-border); color: var(--tk-warning); }
/* Warning text can also stand alone, without a box. No glow: text is never given
   a glow (§2), the sole exception being hero. */
.tk-warn-text { color: var(--tk-warning); }
/* Error text writes the text renk-2, not the fill renk-2 — the 7:1 threshold. */
.tk-danger-text { color: var(--tk-danger-text); }

/* --- motion: reduced-motion preference (detail: references/motion.md) --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-property: opacity !important;
    transition-duration: var(--tk-t-instant) !important;
  }
}
`;
}

function emitXaml() {
  return `<!-- Teknesyum Neon — WPF. Add inside App.xaml > Application.Resources > MergedDictionaries. -->
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                    xmlns:sys="clr-namespace:System;assembly=mscorlib">

  <Color x:Key="Renk1Color">${x('renk-1')}</Color>
  <Color x:Key="Renk2Color">${x('renk-2')}</Color>
  <Color x:Key="Renk3Color">${x('renk-3')}</Color>
  <Color x:Key="Renk2TextColor">${x('renk-2-text')}</Color>
  <Color x:Key="Renk3TextColor">${x('renk-3-text')}</Color>

  <SolidColorBrush x:Key="Renk1"     Color="${x('renk-1')}"/>
  <SolidColorBrush x:Key="Renk2"     Color="${x('renk-2')}"/>
  <SolidColorBrush x:Key="Renk3"     Color="${x('renk-3')}"/>
  <SolidColorBrush x:Key="Success"     Color="${x('success')}"/>
  <SolidColorBrush x:Key="Surface"     Color="${xa('panel')}"/>
  <SolidColorBrush x:Key="AppBg"       Color="${x('black')}"/>

  <!-- Window background: not a flat colour, an 11-stop soft gradient (SKILL §2). -->
  <LinearGradientBrush x:Key="AppBgGradient" x:Shared="False"
                       StartPoint="0,0" EndPoint="0.6,1"
                       ColorInterpolationMode="ScRgbLinearInterpolation">
${gradientXaml('    ')}
  </LinearGradientBrush>

  <!-- MOTION GUARD. WPF has no prefers-reduced-motion; the Windows counterpart is
       SystemParameters.ClientAreaAnimation and reading it is NOT optional. The consumer
       starts this storyboard only when that property is true, and stops it when
       SystemParameters.StaticPropertyChanged reports it turned false.
       ANIMATION TARGET. A storyboard drives RenderTransform and Opacity only. The
       earlier version animated Background.EndPoint: retargeting the brush leaves the
       composition thread and repaints the whole window on every frame for 48 seconds.
       The drift is now a RotateTransform on the background LAYER — a dedicated element
       behind the content, named "bgLayer", oversized so the rotated corners stay off
       screen. The sweep is motion.bg-sweep-max, the same ${m('motion.bg-sweep-max')}
       degrees the CSS keyframe walks. -->
  <Storyboard x:Key="AppBgRotate" RepeatBehavior="Forever" AutoReverse="True">
    <DoubleAnimation Storyboard.TargetName="bgLayer"
                     Storyboard.TargetProperty="RenderTransform.(RotateTransform.Angle)"
                     From="0" To="${m('motion.bg-sweep-max')}"
                     Duration="${durationXaml('bg-rotate')}"/>
  </Storyboard>

  <SolidColorBrush x:Key="Renk2Text" Color="${x('renk-2-text')}"/>
  <SolidColorBrush x:Key="Renk3Text" Color="${x('renk-3-text')}"/>

  <!-- SEMANTIC ROLE LAYER (SKILL §2).
       THE ROLE WINS: every control that reports state (error text, form
       validation, warning box, status dot, danger button) writes these brushes.
       Brand and decoration (glow, scrollbar, hero, heading) keep writing the
       brand brush. XAML has no aliases; each role is a SEPARATE brush object
       carrying the same hex as the brand brush. The hex table is the single
       source of truth and is never edited by hand; equality is measured in the
       audit.
       The \`Success\` brush was renamed from \`NeonSuccess\` on 2026-08-23: success
       is not a brand colour, it is a role. The same rename applies in
       Theme.axaml (U7's file).
       \`Info\` IS DELIBERATELY ABSENT: there is no info box today, and an unused
       token is debt. If one opens it binds to renk-1, and an info fill is never
       used on the same screen as a primary button. -->
  <SolidColorBrush x:Key="Danger"     Color="${x('danger')}"/>
  <!-- The TEXT role of danger. The fill renk-2 falls below the 7:1 threshold as
       text; error text writes this brush. -->
  <SolidColorBrush x:Key="DangerText" Color="${x('danger-text')}"/>

  <!-- warning ${h('warning').toUpperCase()} — WARNING SURFACE ONLY: text, border, icon.
       NO FILL, NO BUTTON. The constraint is the same pattern as success.
       The ban was measured: white text on an amber fill is ${oran('warning', WHITE)}:1, it collapses.
       WHAT REPLACES IT: warning text \`Warning\` (${oran('surface', 'warning')}:1), border
       \`Warning50\` (${oran('surface', resolve('warning-border'))}:1 on ${h('surface')}, clears the 3:1 threshold), icon same colour.
       If an action is needed the button is primary (renk-1) or \`Danger\` (renk-2).
       COLOUR ALONE CARRIES NO MEANING, amber included from the start: amber does
       not separate from success under protanopia, dE2000 15.2
       A warning row carries an icon or text in
       addition to colour.
       CAVEAT: this hex is subject to the U9 dE measurement. -->
  <SolidColorBrush x:Key="Warning"    Color="${x('warning')}"/>
  <SolidColorBrush x:Key="Warning50"  Color="${xa('warning-border')}"/>

  <SolidColorBrush x:Key="TextBody"  Color="${x('text')}"/>
  <SolidColorBrush x:Key="TextLabel" Color="${x('text-label')}"/>
  <!-- A disabled control is exempt from 7:1 (SKILL §2) and there is a price: a
       colour-blind user cannot see the grey. This brush is never used alone —
       every disabled control carries a marker in addition to the grey: ToolTip
       text is MANDATORY, plus Cursor="No" and, where possible, an icon. A merely
       dimmed control is an incomplete delivery. The "muted text" brush was
       deleted on 2026-08-23: it carried exactly the same value as white, and a
       single value with two names eventually diverges. For secondary text the
       answer is not grey, it is deleting the text (SKILL §2, "no mid greys"). -->
  <SolidColorBrush x:Key="Disabled"  Color="${x('disabled')}"/>
${onXaml('  ')}
${scaleXaml('  ')}

  <SolidColorBrush x:Key="BorderDefault"    Color="${xa('border')}"/>
  <SolidColorBrush x:Key="BorderStrong"     Color="${xa('border-strong')}"/>
  <SolidColorBrush x:Key="BorderDecorative" Color="${xa('border-decorative')}"/>

  <!-- The chain's only source is SKILL §3; the order matches. Atkinson
       Hyperlegible Next is the default and is EMBEDDED in the project: setup.js
       copies it into the app's Assets/Fonts and rewrites this line. -->
  <FontFamily x:Key="FontSans">${fontXaml('sans')}</FontFamily>
  <FontFamily x:Key="FontMono">${fontXaml('mono')}</FontFamily>

  <Duration x:Key="TInstant">${durationXaml('instant')}</Duration>
  <Duration x:Key="TFast">${durationXaml('fast')}</Duration>
  <Duration x:Key="TBase">${durationXaml('base')}</Duration>
  <Duration x:Key="TSlow">${durationXaml('slow')}</Duration>
  <!-- Hero glow: same intensity as the CSS token \`tk-glow-hero\` — blur 8, opacity 0.8. -->
  <DropShadowEffect x:Key="HeroGlow" x:Shared="False" Color="${x('renk-1')}"
                    BlurRadius="${T.derived['glow-hero'].blur}" ShadowDepth="0" Opacity="${T.derived['glow-hero'].alpha}"/>

  <CubicEase x:Key="EOut" EasingMode="EaseOut"/>
  <CubicEase x:Key="EIn" EasingMode="EaseIn"/>

${metricXaml('  ', 'Duration')}

  <Style x:Key="{x:Static SystemParameters.FocusVisualStyleKey}">
    <Setter Property="Control.Template">
      <Setter.Value>
        <ControlTemplate>
          <Grid Margin="-5" SnapsToDevicePixels="True" UseLayoutRounding="True">
            <!-- The radii derive from the 6 DIP base: the inner layer sits 1 DIP
                 outside the element (6+1=7), the outer 3 DIP outside (6+3=9).
                 Not hand-picked numbers. -->
            <Rectangle Margin="4" RadiusX="7" RadiusY="7"
                       Stroke="${x('black')}" StrokeThickness="2"/>
            <Rectangle Margin="2" RadiusX="9" RadiusY="9"
                       Stroke="${x('renk-1')}" StrokeThickness="2"/>
          </Grid>
        </ControlTemplate>
      </Setter.Value>
    </Setter>
  </Style>

  <!-- Scale 1.25 major third: 14 / 16 / 20 / 24 / 30 DIP. Line height is set with
       LineHeight + LineStackingStrategy="BlockLineHeight"; without the second,
       WPF grows the line box to the tallest glyph and diverges from CSS.
       Weight: headings and labels SemiBold (600), only hero Black (900).
       TRACKING COMPENSATION: WPF has no letter spacing. CSS applies 0.02em on h2,
       0.05em on h3, 0.15em on labels; that cannot be applied here. The
       compensation is written in SKILL §3 — in WPF what separates a label from
       body text is size, weight and colour, not spacing. Write an attached
       behavior and the compensation lifts, with the CSS values used verbatim. -->

  <Style x:Key="H2" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="24"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="LineHeight" Value="29"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Foreground" Value="{StaticResource Renk1}"/>
  </Style>

  <Style x:Key="H3" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="20"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="LineHeight" Value="24"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Foreground" Value="{StaticResource TextLabel}"/>
  </Style>

  <Style x:Key="Label" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="LineHeight" Value="17"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Foreground" Value="{StaticResource TextLabel}"/>
  </Style>

  <Style x:Key="Body" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="16"/>
    <Setter Property="LineHeight" Value="24"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Typography.NumeralAlignment" Value="Tabular"/>
    <Setter Property="Foreground" Value="{StaticResource TextBody}"/>
  </Style>

  <!-- Help / hint text. CSS counterpart .tk-hint. -->
  <Style x:Key="Hint" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="LineHeight" Value="21"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Typography.NumeralAlignment" Value="Tabular"/>
    <Setter Property="TextWrapping" Value="Wrap"/>
    <Setter Property="Foreground" Value="{StaticResource TextBody}"/>
  </Style>

  <Style x:Key="Hero" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontMono}"/>
    <Setter Property="FontSize" Value="30"/>
    <Setter Property="FontWeight" Value="Black"/>
    <Setter Property="LineHeight" Value="36"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Foreground" Value="{StaticResource Renk1}"/>
    <Setter Property="Effect" Value="{StaticResource HeroGlow}"/>
  </Style>

  <Style x:Key="MonoValue" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FontMono}"/>
    <Setter Property="FontSize" Value="16"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="LineHeight" Value="22"/>
    <Setter Property="LineStackingStrategy" Value="BlockLineHeight"/>
    <Setter Property="Foreground" Value="{StaticResource Renk2Text}"/>
  </Style>

  <Style x:Key="Panel" TargetType="Border">
    <Setter Property="Background" Value="{StaticResource Surface}"/>
    <Setter Property="BorderBrush" Value="{StaticResource BorderDefault}"/>
    <Setter Property="BorderThickness" Value="1"/>
    <Setter Property="CornerRadius" Value="6"/>
    <Setter Property="Padding" Value="24"/>
  </Style>

  <!-- Warning surface. Derives from \`Panel\`; the only change is the border. The
       background stays \`Surface\` because an amber fill is banned. Put an icon or
       the word "Warning" inside the box in addition to colour. -->
  <Style x:Key="WarningPanel" TargetType="Border" BasedOn="{StaticResource Panel}">
    <Setter Property="BorderBrush" Value="{StaticResource Warning50}"/>
  </Style>

  <!-- Warning text. No glow: text is never given a glow (SKILL §2), the sole
       exception being hero. -->
  <Style x:Key="WarningBody" TargetType="TextBlock" BasedOn="{StaticResource Body}">
    <Setter Property="Foreground" Value="{StaticResource Warning}"/>
  </Style>

  <!-- Error text writes the text renk-2, not the fill renk-2 — the 7:1 threshold. -->
  <Style x:Key="DangerBody" TargetType="TextBlock" BasedOn="{StaticResource Body}">
    <Setter Property="Foreground" Value="{StaticResource DangerText}"/>
  </Style>

  <Style x:Key="TkWindow" TargetType="Window">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="{StaticResource FontSize2}"/>
  </Style>

  <Style x:Key="PrimaryButton" TargetType="Button">
    <Setter Property="Background" Value="{StaticResource Renk1}"/>
    <Setter Property="Foreground" Value="Black"/>
    <Setter Property="FontWeight" Value="SemiBold"/>
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="{StaticResource FontSize2}"/>
    <Setter Property="Padding" Value="20,14"/>
    <Setter Property="BorderThickness" Value="0"/>
    <Setter Property="Cursor" Value="Hand"/>
    <Setter Property="Template">
      <Setter.Value>
        <ControlTemplate TargetType="Button">
          <Border x:Name="bd" Background="{TemplateBinding Background}" CornerRadius="6"
                  Padding="{TemplateBinding Padding}" RenderTransformOrigin="0.5,0.5">
            <Border.RenderTransform>
              <ScaleTransform ScaleX="1" ScaleY="1"/>
            </Border.RenderTransform>
            <Border.Effect>
              <DropShadowEffect Color="{StaticResource Renk1Color}" BlurRadius="${T.derived['glow-button'].blur}" ShadowDepth="0" Opacity="${T.derived['glow-button'].alpha}"/>
            </Border.Effect>
            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
          </Border>
          <ControlTemplate.Triggers>
            <Trigger Property="IsMouseOver" Value="True">
              <Trigger.EnterActions>
                <BeginStoryboard>
                  <Storyboard>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1.02" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleX)"/>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1.02" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleY)"/>
                  </Storyboard>
                </BeginStoryboard>
              </Trigger.EnterActions>
              <Trigger.ExitActions>
                <BeginStoryboard>
                  <Storyboard>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleX)"/>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleY)"/>
                  </Storyboard>
                </BeginStoryboard>
              </Trigger.ExitActions>
            </Trigger>
            <Trigger Property="IsPressed" Value="True">
              <Trigger.EnterActions>
                <BeginStoryboard>
                  <Storyboard>
                    <DoubleAnimation Storyboard.TargetName="bd" To="0.98" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleX)"/>
                    <DoubleAnimation Storyboard.TargetName="bd" To="0.98" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleY)"/>
                  </Storyboard>
                </BeginStoryboard>
              </Trigger.EnterActions>
              <Trigger.ExitActions>
                <BeginStoryboard>
                  <Storyboard>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleX)"/>
                    <DoubleAnimation Storyboard.TargetName="bd" To="1" Duration="{StaticResource TInstant}"
                                     Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleY)"/>
                  </Storyboard>
                </BeginStoryboard>
              </Trigger.ExitActions>
            </Trigger>
            <Trigger Property="IsEnabled" Value="False">
              <Setter TargetName="bd" Property="Background" Value="Transparent"/>
              <Setter TargetName="bd" Property="BorderBrush" Value="{StaticResource Disabled}"/>
              <Setter TargetName="bd" Property="BorderThickness" Value="1"/>
              <Setter TargetName="bd" Property="Effect" Value="{x:Null}"/>
              <Setter Property="Foreground" Value="{StaticResource Disabled}"/>
              <Setter Property="Cursor" Value="No"/>
            </Trigger>
          </ControlTemplate.Triggers>
        </ControlTemplate>
      </Setter.Value>
    </Setter>
  </Style>

  <Style x:Key="DangerButton" TargetType="Button" BasedOn="{StaticResource PrimaryButton}">
    <Setter Property="Background" Value="{StaticResource DangerText}"/>
    <Setter Property="Foreground" Value="{StaticResource OnDangerText}"/>
  </Style>

</ResourceDictionary>
`;
}

function emitAxaml() {
  return `<!-- Teknesyum Neon, Avalonia 11. The root element is Styles, not ResourceDictionary:
     resources live in Styles.Resources, global rules are Style Selectors below.
     Binding:
       <Application.Styles>
         <FluentTheme/>
         <StyleInclude Source="avares://App/Assets/Theme.axaml"/>
       </Application.Styles>
     Usage: Theme="{StaticResource H2}" (instead of WPF's Style="{StaticResource H2}").
     Detail and rule rationale: references/avalonia.md -->
<Styles xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:sys="clr-namespace:System;assembly=netstandard">

  <Styles.Resources>

    <Color x:Key="Renk1Color">${x('renk-1')}</Color>
    <Color x:Key="Renk2Color">${x('renk-2')}</Color>
    <Color x:Key="Renk3Color">${x('renk-3')}</Color>
    <Color x:Key="Renk2TextColor">${x('renk-2-text')}</Color>
    <Color x:Key="Renk3TextColor">${x('renk-3-text')}</Color>

    <SolidColorBrush x:Key="Renk1"     Color="${x('renk-1')}"/>
    <SolidColorBrush x:Key="Renk2"     Color="${x('renk-2')}"/>
    <SolidColorBrush x:Key="Renk3"     Color="${x('renk-3')}"/>
    <SolidColorBrush x:Key="Success"     Color="${x('success')}"/>
    <SolidColorBrush x:Key="Surface"     Color="${xa('panel')}"/>
    <SolidColorBrush x:Key="AppBg"       Color="${x('black')}"/>

    <!-- Window background: not a flat colour, an 11-stop soft gradient (SKILL §2).
         Two differences, both deliberate:
         1) Avalonia has no x:Shared. The resource is shared as a single instance;
            the background animation below moves the layer's RenderTransform rather
            than the brush, so sharing causes no trouble.
         2) Avalonia has no ColorInterpolationMode, sRGB interpolation is forced.
            Not identical to WPF's ScRgbLinearInterpolation; the 11 stops exist to
            close banding anyway, and no visible difference was measured
            (assumed, not measured). -->
    <LinearGradientBrush x:Key="AppBgGradient"
                         StartPoint="0%,0%" EndPoint="60%,100%">
${gradientXaml('      ')}
    </LinearGradientBrush>

    <!-- There is NO resource counterpart to WPF's AppBgRotate storyboard, and that
         is deliberate. In Avalonia an Animation is not a resource, it lives inside
         Style.Animations, and no animator exists that interpolates a brush
         sub-property (Background.EndPoint). The counterpart is the
         "Window.anim Panel.appbg" rule below. -->

    <SolidColorBrush x:Key="Renk2Text" Color="${x('renk-2-text')}"/>
    <SolidColorBrush x:Key="Renk3Text" Color="${x('renk-3-text')}"/>

    <!-- SEMANTIC ROLE LAYER (SKILL §2). Identical to Theme.xaml; the rationale is
         written there and is not repeated here. The hex comes from the single
         source of truth and is never edited by hand. The Success brush was renamed
         from NeonSuccess on 2026-08-23 and this file carries the new name. -->
    <SolidColorBrush x:Key="Danger"     Color="${x('danger')}"/>
    <SolidColorBrush x:Key="DangerText" Color="${x('danger-text')}"/>
    <SolidColorBrush x:Key="Warning"    Color="${x('warning')}"/>
    <SolidColorBrush x:Key="Warning50"  Color="${xa('warning-border')}"/>

    <SolidColorBrush x:Key="TextBody"  Color="${x('text')}"/>
    <SolidColorBrush x:Key="TextLabel" Color="${x('text-label')}"/>
    <!-- A disabled control is exempt from 7:1 (SKILL §2) and there is a price: a
         colour-blind user cannot see the grey. This brush is never used alone;
         every disabled control carries a marker in addition to the grey:
         ToolTip.Tip text is MANDATORY, plus Cursor="No" and, where possible, an
         icon. A merely dimmed control is an incomplete delivery. For secondary
         text the answer is not grey, it is deleting the text. -->
    <SolidColorBrush x:Key="Disabled"  Color="${x('disabled')}"/>
${onXaml('    ')}
${scaleXaml('    ')}

    <SolidColorBrush x:Key="BorderDefault"    Color="${xa('border')}"/>
    <SolidColorBrush x:Key="BorderStrong"     Color="${xa('border-strong')}"/>
    <SolidColorBrush x:Key="BorderDecorative" Color="${xa('border-decorative')}"/>

    <!-- The chain's only source is SKILL §3; the order matches. Atkinson
         Hyperlegible Next is the default and is EMBEDDED in the project, not
         assumed present on the system. setup.js copies the font into the app's
         Assets/Fonts and rewrites this line to an avares URI. -->
    <FontFamily x:Key="FontSans">${fontXaml('sans')}</FontFamily>
    <FontFamily x:Key="FontMono">${fontXaml('mono')}</FontFamily>

    <!-- Avalonia has no Duration resource type; Transition.Duration and
         Animation.Duration take a TimeSpan. The names are kept verbatim, the type
         changed. -->
    <sys:TimeSpan x:Key="TInstant">${durationXaml('instant')}</sys:TimeSpan>
    <sys:TimeSpan x:Key="TFast">${durationXaml('fast')}</sys:TimeSpan>
    <sys:TimeSpan x:Key="TBase">${durationXaml('base')}</sys:TimeSpan>
    <sys:TimeSpan x:Key="TSlow">${durationXaml('slow')}</sys:TimeSpan>

    <!-- Hero glow: same intensity as the CSS token tk-glow-hero, blur 8, opacity
         0.8. The council had put this name on the banned-string list; the reason
         was catching WPF leftovers. In Avalonia 11 DropShadowEffect is a real API
         and the only way to glow text. The deviation is recorded in the contract's
         Output section. The WPF-specific ShadowDepth property is ABSENT here and
         the test looks for it. -->
    <DropShadowEffect x:Key="HeroGlow" Color="${x('renk-1')}"
                      BlurRadius="${T.derived['glow-hero'].blur}" OffsetX="0" OffsetY="0" Opacity="${T.derived['glow-hero'].alpha}"/>

    <!-- SKILL §5.4 tokens: e-out cubic-bezier(0.2,0,0,1), e-in (0.4,0,1,1).
         SplineEasing carries the CSS curve verbatim. If your version has no
         SplineEasing the counterparts are <CubicEaseOut/> and <CubicEaseIn/>, and
         the curve stays approximate. -->
    <SplineEasing x:Key="EOut" ${splineAx('out')}/>
    <SplineEasing x:Key="EIn"  ${splineAx('in')}/>

${metricXaml('    ', 'sys:TimeSpan')}

    <!-- Scale 1.25 major third: 14 / 16 / 20 / 24 / 30 DIP.
         Avalonia has no LineStackingStrategy and does not need one: LineHeight
         already behaves like a box height here, closer to CSS than WPF.
         Weight: headings and labels SemiBold (600), only hero Black (900).
         TRACKING COMPENSATION: Avalonia DOES have letter spacing
         (TextBlock.LetterSpacing, in DIP, not em). CSS applies 0.02em on h2,
         0.05em on h3, 0.15em on labels. NOT WRITTEN HERE: the em-to-DIP conversion
         varies per size (0.15em on a 14px label = 2.1 DIP) and setting it unmeasured
         would split the three platforms. The WPF compensation (size, weight,
         colour) applies here too; whoever wants LetterSpacing should update
         SKILL §3 first, then walk all three templates together. -->

    <ControlTheme x:Key="H2" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="24"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="LineHeight" Value="29"/>
      <Setter Property="Foreground" Value="{StaticResource Renk1}"/>
    </ControlTheme>

    <ControlTheme x:Key="H3" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="20"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="LineHeight" Value="24"/>
      <Setter Property="Foreground" Value="{StaticResource TextLabel}"/>
    </ControlTheme>

    <ControlTheme x:Key="Label" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="14"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="LineHeight" Value="17"/>
      <Setter Property="Foreground" Value="{StaticResource TextLabel}"/>
    </ControlTheme>

    <!-- Tabular figures: the counterpart of WPF's Typography.NumeralAlignment="Tabular"
         is FontFeatures="+tnum" (Avalonia 11.1+). THE VERSION WAS NOT CONFIRMED, so
         the line is left OFF: if the feature is missing the XAML never loads at all
         and the whole theme falls. The chosen substitute is mono: every number that
         must align is written with the MonoValue theme (SKILL §3, "every number is
         mono"). Once you have verified the target version, enable this line inside
         Body and Hint:
           <Setter Property="FontFeatures" Value="+tnum"/> -->

    <ControlTheme x:Key="Body" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="16"/>
      <Setter Property="LineHeight" Value="24"/>
      <Setter Property="Foreground" Value="{StaticResource TextBody}"/>
    </ControlTheme>

    <!-- Help / hint text. CSS counterpart .tk-hint. -->
    <ControlTheme x:Key="Hint" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="14"/>
      <Setter Property="LineHeight" Value="21"/>
      <Setter Property="TextWrapping" Value="Wrap"/>
      <Setter Property="Foreground" Value="{StaticResource TextBody}"/>
    </ControlTheme>

    <ControlTheme x:Key="Hero" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontMono}"/>
      <Setter Property="FontSize" Value="30"/>
      <Setter Property="FontWeight" Value="Black"/>
      <Setter Property="LineHeight" Value="36"/>
      <Setter Property="Foreground" Value="{StaticResource Renk1}"/>
      <!-- This is the only role where text is given a glow (SKILL §2). -->
      <Setter Property="Effect" Value="{StaticResource HeroGlow}"/>
    </ControlTheme>

    <ControlTheme x:Key="MonoValue" TargetType="TextBlock">
      <Setter Property="FontFamily" Value="{StaticResource FontMono}"/>
      <Setter Property="FontSize" Value="16"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="LineHeight" Value="22"/>
      <Setter Property="Foreground" Value="{StaticResource Renk2Text}"/>
    </ControlTheme>

    <ControlTheme x:Key="Panel" TargetType="Border">
      <Setter Property="Background" Value="{StaticResource Surface}"/>
      <Setter Property="BorderBrush" Value="{StaticResource BorderDefault}"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="CornerRadius" Value="6"/>
      <Setter Property="Padding" Value="24"/>
    </ControlTheme>

    <!-- Warning surface. Derives from Panel; the only change is the border. The
         background stays Surface because an amber fill is banned. Put an icon or
         the word "Warning" inside the box in addition to colour. Avalonia supports
         BasedOn on ControlTheme too. -->
    <ControlTheme x:Key="WarningPanel" TargetType="Border"
                  BasedOn="{StaticResource Panel}">
      <Setter Property="BorderBrush" Value="{StaticResource Warning50}"/>
    </ControlTheme>

    <!-- Warning text. No glow: text is never given a glow (SKILL §2), the sole
         exception being hero. -->
    <ControlTheme x:Key="WarningBody" TargetType="TextBlock"
                  BasedOn="{StaticResource Body}">
      <Setter Property="Foreground" Value="{StaticResource Warning}"/>
    </ControlTheme>

    <!-- Error text writes the text renk-2, not the fill renk-2 — the 7:1 threshold. -->
    <ControlTheme x:Key="DangerBody" TargetType="TextBlock"
                  BasedOn="{StaticResource Body}">
      <Setter Property="Foreground" Value="{StaticResource DangerText}"/>
    </ControlTheme>

    <!-- THE AVALONIA COUNTERPART OF LESSON U1.
         In WPF, giving a ScaleTransform as a Style Setter value caused two bugs:
         the object is shared across all instances, and once frozen it cannot be
         written. Avalonia has no Freezable and no freezing, so that trap is gone;
         but its relative remains — a transform object given as a Setter value is
         still shared. The avoidance is natural: this file gives NO object to
         RenderTransform ANYWHERE. The value is always text ("scale(0.98)", "none")
         and is resolved per element as TransformOperations. The same rule applies
         to you: do not write
         <Setter Property="RenderTransform"><ScaleTransform .../></Setter>. -->
    <ControlTheme x:Key="PrimaryButton" TargetType="Button">
      <Setter Property="Background" Value="{StaticResource Renk1}"/>
      <Setter Property="Foreground" Value="Black"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
      <Setter Property="FontSize" Value="{StaticResource FontSize2}"/>
      <Setter Property="Padding" Value="20,14"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="HorizontalContentAlignment" Value="Center"/>
      <Setter Property="VerticalContentAlignment" Value="Center"/>
      <Setter Property="Template">
        <ControlTemplate TargetType="Button">
          <!-- The glow is given to the box (SKILL §2). The WPF counterpart is
               DropShadowEffect BlurRadius=20 Opacity=0.35; in BoxShadow opacity is
               not a separate property but the colour alpha: 0.35 * 255 = 89 = 0x59.
               The conversion was calculated, not measured. -->
          <Border Name="bd"
                  Background="{TemplateBinding Background}"
                  BorderBrush="{TemplateBinding BorderBrush}"
                  BorderThickness="{TemplateBinding BorderThickness}"
                  Padding="{TemplateBinding Padding}"
                  CornerRadius="6"
                  RenderTransformOrigin="50%,50%"
                  BoxShadow="0 0 ${T.derived['glow-button'].blur} 0 ${gx('glow-button')}">
            <!-- Do NOT write keyframe animations for hover and press. Avalonia does
                 not rewind a keyframe when leaving a pseudo-class; the button stays
                 stuck on the last frame. The right tool is Transitions, which run
                 in both directions. -->
            <Border.Transitions>
              <Transitions>
                <DoubleTransition Property="Opacity"
                                  Duration="{StaticResource TInstant}"
                                  Easing="{StaticResource EOut}"/>
                <TransformOperationsTransition Property="RenderTransform"
                                               Duration="{StaticResource TInstant}"
                                               Easing="{StaticResource EOut}"/>
              </Transitions>
            </Border.Transitions>
            <ContentPresenter Name="PART_ContentPresenter"
                              Content="{TemplateBinding Content}"
                              ContentTemplate="{TemplateBinding ContentTemplate}"
                              HorizontalContentAlignment="Center"
                              VerticalContentAlignment="Center"/>
          </Border>
        </ControlTemplate>
      </Setter>

      <!-- Because Transitions are bidirectional, WPF's EIn/EOut split collapses to
           a single Easing. Separate curves for entry and exit are not possible; an
           accepted simplification, noted in the contract's Output section. -->
      <Style Selector="^:pointerover /template/ Border#bd">
        <Setter Property="RenderTransform" Value="scale(1.02)"/>
      </Style>

      <Style Selector="^:pressed /template/ Border#bd">
        <Setter Property="RenderTransform" Value="scale(0.98)"/>
      </Style>

      <Style Selector="^:disabled /template/ Border#bd">
        <Setter Property="Background" Value="Transparent"/>
        <Setter Property="BorderBrush" Value="{StaticResource Disabled}"/>
        <Setter Property="BorderThickness" Value="1"/>
        <Setter Property="BoxShadow" Value="none"/>
      </Style>
      <Style Selector="^:disabled">
        <Setter Property="Foreground" Value="{StaticResource Disabled}"/>
        <Setter Property="Cursor" Value="No"/>
      </Style>
    </ControlTheme>

    <ControlTheme x:Key="DangerButton" TargetType="Button" BasedOn="{StaticResource PrimaryButton}">
      <Setter Property="Background" Value="{StaticResource DangerText}"/>
      <Setter Property="Foreground" Value="{StaticResource OnDangerText}"/>
    </ControlTheme>

  </Styles.Resources>

  <Style Selector=":is(Window)">
    <Setter Property="FontFamily" Value="{StaticResource FontSans}"/>
    <Setter Property="FontSize" Value="{StaticResource FontSize2}"/>
  </Style>

  <!-- FOCUS RING, application wide.
       In WPF this was done with a style keyed on
       {x:Static SystemParameters.FocusVisualStyleKey}; Avalonia has no such key,
       its counterpart is the FocusAdorner property on Control. Avalonia already
       draws the ring only in keyboard modality, so the CSS :focus-visible
       behaviour comes for free.
       The radii derive from the 6 DIP base: the inner layer sits 1 DIP outside the
       element (6+1=7), the outer 3 DIP outside (6+3=9). Not hand-picked numbers. -->
  <Style Selector="Control">
    <Setter Property="FocusAdorner">
      <FocusAdornerTemplate>
        <Panel Margin="-5" UseLayoutRounding="True">
          <Rectangle Margin="4" RadiusX="7" RadiusY="7"
                     Stroke="${x('black')}" StrokeThickness="2"/>
          <Rectangle Margin="2" RadiusX="9" RadiusY="9"
                     Stroke="${x('renk-1')}" StrokeThickness="2"/>
        </Panel>
      </FocusAdornerTemplate>
    </Setter>
  </Style>

  <!-- APPLICATION BACKGROUND.
       Not the window's own Background, but an EMPTY Panel filling the window:
       <Panel Classes="appbg"/> sits behind the content as a sibling.
       Do not put children inside the Panel; the rotating layer rotates its
       children too. -->
  <Style Selector="Panel.appbg">
    <Setter Property="Background" Value="{StaticResource AppBgGradient}"/>
    <Setter Property="RenderTransformOrigin" Value="50%,50%"/>
    <Setter Property="IsHitTestVisible" Value="False"/>
  </Style>

  <!-- BACKGROUND ROTATION, the one named exception to the infinite-loop ban
       (SKILL §5.4). In WPF the EndPoint shifted from 0.5,1 to 0.7,1 with a static
       value of 0.6,1. Avalonia cannot interpolate a gradient brush sub-property
       (the brush animator only carries flat colour), so the same look is produced
       by rotating the layer very slowly.
       Angle maths, deviation from vertical: atan(0.5)=26.57, atan(0.6)=30.96,
       atan(0.7)=34.99 degrees. Against the static 0.6 the ends are -4.39 and +4.03
       degrees; total travel 8.42 degrees, under the 20-degree ceiling of motion.md
       M10.
       So the rotating rectangle leaves no corner gap the scale is 1.12; for 8.42
       degrees in a 16:9 window the smallest required scale was calculated at 1.09,
       and 1.12 leaves margin. All of these numbers were calculated, not measured on
       screen (assumed, not measured). -->
  <Style Selector="Window.anim Panel.appbg">
    <Style.Animations>
      <Animation Duration="${durationXaml('bg-rotate')}" IterationCount="Infinite"
                 PlaybackDirection="Alternate" Easing="SineEaseInOut">
        <KeyFrame Cue="0%">
          <Setter Property="RenderTransform" Value="scale(1.12) rotate(-4.39deg)"/>
        </KeyFrame>
        <KeyFrame Cue="100%">
          <Setter Property="RenderTransform" Value="scale(1.12) rotate(4.03deg)"/>
        </KeyFrame>
      </Animation>
    </Style.Animations>
  </Style>

  <!-- REDUCED MOTION, applied in the template.
       A rule written in a file that the template does not apply is this standard's
       sneakiest class of bug (motion.md M4); that is exactly what happened on the
       WPF side. Avalonia has no ready API, so the mechanism is:

         On window open, read the reduced-motion preference.
         If the preference is OFF, add the "anim" class to the Window; if ON, DO NOT.

       The class lives in one place, on the window itself; the rules below look at
       it. The reading code is in references/avalonia.md, ready to copy.
       Without the "anim" class two things fall at once:
         1) "Window.anim Panel.appbg" does not match and the background loop never
            starts.
         2) The rule below cancels the press scale.
       The opacity transition remains; the interface is not lifeless, but it does
       not make you dizzy (M4). -->
  <Style Selector="Window:not(.anim) Button:pressed /template/ Border#bd">
    <Setter Property="RenderTransform" Value="none"/>
  </Style>

  <!-- The same cancellation for signature chips (Signature.axaml, Classes="sigchip").
       The rule lives here because Signature.axaml's own Styles collection sees only
       its own subtree, not the Window above it. -->
  <Style Selector="Window:not(.anim) Button.sigchip:pointerover /template/ Border#bd">
    <Setter Property="RenderTransform" Value="none"/>
  </Style>

</Styles>
`;
}

function emitPalette() {
  return `using System.Drawing;
using System.Drawing.Text;
using System.Linq;

namespace Teknesyum.Theme;

/// Teknesyum Neon — WinForms/console palette. Do not change these values.
public static class Palette
{
    public static readonly Color Renk1      = ColorTranslator.FromHtml("${csx('renk-1')}");
    public static readonly Color Renk2      = ColorTranslator.FromHtml("${csx('renk-2')}");
    public static readonly Color Renk3      = ColorTranslator.FromHtml("${csx('renk-3')}");
    public static readonly Color Success    = ColorTranslator.FromHtml("${csx('success')}");

    public static readonly Color Renk2Text  = ColorTranslator.FromHtml("${csx('renk-2-text')}");
    public static readonly Color Renk3Text  = ColorTranslator.FromHtml("${csx('renk-3-text')}");

    // --- semantic role layer (SKILL §2) ---
    //
    // THE ROLE WINS. Every control that reports state — error text, form
    // validation, warning box, status dot, danger button — writes these fields.
    // Brand and decoration (glow, scrollbar, hero, heading) keep writing the brand
    // field. In C# an alias is a plain assignment: the role field takes the VALUE
    // of the brand field, its hex is not copied. The one exception is \`Warning\` —
    // it has no counterpart in the brand triad and carries its own hex. Equality
    // is measured in the audit.
    //
    // \`Success\` is defined above and is already a role field; no second name was
    // given. \`Info\` IS DELIBERATELY ABSENT: there is no info box today, and an
    // unused token is debt. If one opens it binds to renk-1, and an info fill is
    // never used on the same screen as a primary button.
    public static readonly Color Danger     = Renk2;

    /// The TEXT role of danger. The fill renk-2 falls below §2's 7:1 threshold as text;
    /// error text writes this rather than the fill field.
    public static readonly Color DangerText = Renk2Text;

    /// \`warning #FBBF24\` — WARNING SURFACE ONLY: text, border, icon.
    /// NO FILL, NO BUTTON. The constraint is the same pattern as \`Success\`, not a
    /// new one.
    ///
    /// The ban was measured: white text on an amber fill is 1.50:1 — it collapses.
    /// WHAT REPLACES IT: warning text \`Warning\` (11.30:1), border
    /// \`Warning50\` (3.60:1 on \`#101115\`, clears 1.4.11's 3:1 threshold — renk-2 /50
    /// at 1.94 and renk-3 /50 at 1.92 did not carry this rung, amber does), icon
    /// the same colour. If an action is needed the button is primary (renk-1) or
    /// \`Danger\` (renk-2); the warning colour never enters a button.
    ///
    /// COLOUR ALONE CARRIES NO MEANING, amber included from the start: amber does
    /// not separate from \`Success\` under protanopia, ΔE2000 15.2
    /// A warning row carries an icon or text in
    /// addition to colour.
    ///
    /// CAVEAT: this hex is subject to the \`U9\` ΔE measurement.
    public static readonly Color Warning    = ColorTranslator.FromHtml("${csx('warning')}");
    public static readonly Color Warning50  = Color.FromArgb(${argb('warning-border')});

    public static readonly Color Surface    = ColorTranslator.FromHtml("${csx('surface')}");
    public static readonly Color AppBg      = ColorTranslator.FromHtml("${csx('black')}");
    public static readonly Color AppBgFrom  = ColorTranslator.FromHtml("${csx('black')}");
    public static readonly Color AppBgTo    = ColorTranslator.FromHtml("${csx('surface')}");

    public static readonly Color BorderDefault    = Color.FromArgb(${argb('border')});
    public static readonly Color BorderStrong     = Color.FromArgb(${argb('border-strong')});
    public static readonly Color BorderDecorative = Color.FromArgb(${argb('border-decorative')});

    public static readonly Color FocusRing      = ColorTranslator.FromHtml("${csx('renk-1')}");
    public static readonly Color FocusRingInner = ColorTranslator.FromHtml("${csx('black')}");

    public static readonly Color TextBody   = ColorTranslator.FromHtml("${csx('text')}");
    public static readonly Color TextLabel  = ColorTranslator.FromHtml("${csx('text-label')}");

    /// A disabled control is exempt from 7:1 (SKILL §2) and there is a price: a
    /// colour-blind user cannot see the grey. This colour is never used alone —
    /// every disabled control carries a marker in addition to the grey: \`ToolTip\`
    /// text is MANDATORY, plus \`Cursor = Cursors.No\` and, where possible, an icon.
    /// A merely dimmed control is an incomplete delivery.
    ///
    /// The "muted text" role was deleted outright on 2026-08-23: it carried exactly
    /// the same value as \`TextBody\`, and a single value with two names eventually
    /// diverges. For secondary text the answer is not to give grey, it is to delete
    /// the text (SKILL §2, "no mid greys").
    public static readonly Color Disabled   = ColorTranslator.FromHtml("${csx('disabled')}");

    /// There is one radius: 6 DIP (SKILL §5, \`layout.md\` §5.1). Card, panel, button
    /// and cell take the same value. The one exception is the circle: \`?\` badge,
    /// slider thumb, status dot.
    public const int Radius = ${m('shape.r')};

    /// Numeric tokens: the same values as the CSS \`--tk-*\` layer, in DIP.
    /// Tracking is em, line height a multiplier, ratios unitless, times in ms.
    public const int    WindowRadius = ${m('shape.r-window')};
    public const int    BorderWidth  = ${m('shape.border-w')};
    public const int    FocusWidth   = ${m('shape.focus-w')};
    public const int    FocusOffset  = ${m('shape.focus-offset')};

    public const int    FontSize1 = ${m('size.fs-1')};
    public const int    FontSize2 = ${m('size.fs-2')};
    public const int    FontSize3 = ${m('size.fs-3')};
    public const int    FontSize4 = ${m('size.fs-4')};
    public const int    FontSize5 = ${m('size.fs-5')};
    public const double LineHeightBody    = ${m('size.lh-body')};
    public const double LineHeightHeading = ${m('size.lh-heading')};
    public const double LineHeightMono    = ${m('size.lh-mono')};
    public const int    MeasureCh    = ${m('size.measure')};
    public const double TrackingLabel = ${m('size.tr-label')};
    public const double TrackingH3    = ${m('size.tr-h3')};
    public const double TrackingH2    = ${m('size.tr-h2')};
    public const double TrackingHero  = ${m('size.tr-hero')};
    public const int    WeightBody = ${m('size.fw-body')};
    public const int    WeightSemi = ${m('size.fw-semi')};
    public const int    WeightHero = ${m('size.fw-hero')};

    public const int Space1 = ${m('space.1')};
    public const int Space2 = ${m('space.2')};
    public const int Space3 = ${m('space.3')};
    public const int Space4 = ${m('space.4')};
    public const int Space5 = ${m('space.5')};
    public const int PanelPadding  = ${m('space.panel-padding')};
    public const int SectionGap    = ${m('space.section-gap')};
    public const int RowGap        = ${m('space.row-gap')};
    public const int FieldGap      = ${m('space.field-gap')};
    public const int FieldStack    = ${m('space.field-stack')};
    public const int InputPaddingX = ${m('space.input-padding-x')};
    public const int ToastInset    = ${m('space.toast-inset')};
    public const int ToastGap      = ${m('space.toast-gap')};

    public const int    TargetMin             = ${m('metric.target-min')};
    public const int    ScrollbarWidth        = ${m('metric.scrollbar-w')};
    public const int    TitleBarHeightMin     = ${m('metric.titlebar-h-min')};
    public const int    TitleBarHeightMax     = ${m('metric.titlebar-h-max')};
    public const int    SidebarWidth          = ${m('metric.sidebar-w')};
    public const int    SidebarCollapsedWidth = ${m('metric.sidebar-collapsed-w')};
    public const int    InputHeight           = ${m('metric.input-h')};
    public const int    ModalWidth            = ${m('metric.modal-w')};
    public const double ModalMaxRatio         = ${m('metric.modal-max-ratio')};
    public const int    ToastWidth            = ${m('metric.toast-w')};
    public const int    ToastMax              = ${m('metric.toast-max')};
    public const int    ToastLifeMs           = ${m('metric.toast-life')};
    public const int    IconSize1 = ${m('metric.icon-1')};
    public const int    IconSize2 = ${m('metric.icon-2')};
    public const int    IconSize3 = ${m('metric.icon-3')};
    public const int    IconSize4 = ${m('metric.icon-4')};

    public const double ScaleHover     = ${m('motion.scale-hover')};
    public const double ScalePress     = ${m('motion.scale-press')};
    public const double ScaleIconHover = ${m('motion.scale-icon-hover')};
    public const int    EntryOffset    = ${m('motion.entry-offset')};
    public const int    OverlayOffset  = ${m('motion.overlay-offset')};
    public const int    StaggerMs      = ${m('motion.stagger')};
    public const int    StaggerMax     = ${m('motion.stagger-max')};
    public const int    GlowMargin     = ${m('motion.glow-margin')};
    public const int    LoadingLoopMinMs = ${m('motion.loading-loop-min')};
    public const int    FrameBudgetMs    = ${m('motion.frame-budget')};
    public const int    BgRotateMinMs    = ${m('motion.bg-rotate-min')};
    public const int    BgSweepMaxDeg    = ${m('motion.bg-sweep-max')};

    /// The chain's only source is SKILL §3. A WinForms \`Font\` takes no fallback
    /// chain, so the first installed family is selected. Atkinson Hyperlegible Next
    /// is the default and is embedded in the project (\`PrivateFontCollection\`); if
    /// it is not embedded it falls back to Segoe UI — that is not an acceptance, it
    /// is an incomplete delivery.
    public static string Family(params string[] candidates)
    {
        using var installed = new InstalledFontCollection();
        var names = installed.Families.Select(f => f.Name).ToHashSet();
        return candidates.FirstOrDefault(names.Contains) ?? candidates[^1];
    }

    public static readonly string SansName = Family(${csFamily('sans')});
    public static readonly string MonoName = Family(${csFamily('mono')});

    // Scale 1.25 major third — 14 / 16 / 20 / 24 / 30 DIP. The point equivalent at
    // 96 dpi is DIP × 0.75: 10.5 / 12 / 15 / 18 / 22.5.
    //
    // WEIGHT COMPENSATION: SKILL §3 asks for 600 (SemiBold) on headings and labels;
    // \`FontStyle\` knows only Regular and Bold, there is no intermediate weight.
    // Headings stay Bold here and the difference is built with size (h2 18pt,
    // h3 15pt, label 10.5pt) — with three levels separated by size, weight does not
    // need to carry the hierarchy alone. If a real 600 is wanted, load the variable
    // font's SemiBold cut with \`PrivateFontCollection\` instead of \`GDI+\`; the
    // compensation then lifts.
    //
    // Line height also cannot be set through a WinForms \`Font\`; when \`TextRenderer\`
    // draws, the line spacing is applied by hand with a 1.5 (body) / 1.2 (heading)
    // factor.
    public static readonly Font  H2         = new(SansName, 18f, FontStyle.Bold);
    public static readonly Font  H3         = new(SansName, 15f, FontStyle.Bold);
    public static readonly Font  LabelFont  = new(SansName, 10.5f, FontStyle.Bold);
    public static readonly Font  Body       = new(SansName, 12f);
    public static readonly Font  Hint       = new(SansName, 10.5f);
    public static readonly Font  Mono       = new(MonoName, 12f, FontStyle.Bold);
    public static readonly Font  Hero       = new(MonoName, 22.5f, FontStyle.Bold);

    public const string Author     = "Teknesyum";
    public const string GitHubUrl  = "https://github.com/Teknesyum";
    public const string SponsorUrl = "https://github.com/sponsors/Teknesyum";
    public const bool   SponsorActive = true;
}

/// ANSI console colours (for CLI projects such as Runly).
public static class Ansi
{
    public const string Renk1      = "${ansi('renk-1')}";
    public const string Renk2      = "${ansi('renk-2')}";
    public const string Renk3      = "${ansi('renk-3')}";
    public const string Renk2Text  = "${ansi('renk-2-text')}";
    public const string Renk3Text  = "${ansi('renk-3-text')}";
    public const string Success    = "${ansi('success')}";
    // Role colours enter ANSI too; without them the terminal output drifts from the
    // palette. Danger and DangerText take the value of the brand constant, the hex
    // is not copied.
    public const string Danger     = Renk2;
    public const string DangerText = Renk2Text;
    // Warning: warning text only. A terminal has no fill anyway, so the constraint
    // holds by itself.
    public const string Warning    = "${ansi('warning')}";
    public const string Disabled   = "${ansi('disabled')}";
    public const string Bold       = "\x1b[1m";
    public const string Reset      = "\x1b[0m";
}
`;
}

const gateFailures = onGate();
if (gateFailures.length) {
  process.stderr.write('contrast gate: theme not generated from ' + path.basename(tokensPath) + '\n' + gateFailures.map(s => '  ' + s).join('\n') + '\n');
  process.exit(1);
}

function xmlComments(text) {
  return text.replace(/<!--([\s\S]*?)-->/g, (all, body) =>
    '<!--' + body.replace(/--(?=[a-z*])/gi, '').replace(/-{2,}/g, '-').replace(/-$/, '- ') + '-->');
}

const outputs = [
  ['theme.css', emitCss()],
  ['Theme.xaml', xmlComments(emitXaml())],
  ['Theme.axaml', xmlComments(emitAxaml())],
  ['Palette.cs', emitPalette()]
];
// MEASURED (2026-08-25, CI): pinning the line ending makes only the writing
// platform agree — autocrlf pulls CRLF on Windows, LF on Unix, and every line of
// all four files looks changed. The EOL is taken from the target file's current
// state, or LF when the file does not exist.
for (const [name, content] of outputs) {
  const target = path.join(outDir, name);
  let eol = '\n';
  try {
    if (fs.readFileSync(target, 'utf8').includes('\r\n')) eol = '\r\n';
  } catch {}
  fs.writeFileSync(target, eol === '\n' ? content : content.replace(/\n/g, '\r\n'), 'utf8');
}
console.log('generated: ' + outputs.map(o => o[0]).join(', ') + ' <- ' + path.basename(tokensPath));
