'use strict';

const path = require('path');

const STYLE = ['.css', '.vue', '.svelte'];
const MARKUP = ['.tsx', '.jsx', '.vue', '.svelte', '.html'];
const XAML = ['.xaml', '.axaml'];
const WEB = ['.css', '.tsx', '.jsx', '.vue', '.svelte', '.html'];

const TOKEN_FILE_NAME = /^(theme|tema)\.(css|tokens\.json)$/i;
const ALLOWED_STATE_PROPERTY = new Set([
  'color',
  'background-color',
  'border-color',
  'box-shadow',
  'cursor',
  'transform',
  'transition',
]);
const REPEATED_ITEM =
  /(^|[\s,>+~])(li|tr|td)([\s.:[,]|$)|[-_.](row|cell|item|list-item|listitem)(?![\w-])|:nth-child|::part\(item/i;
const LOOP_SCOPE = /(progress|loading|skeleton|spinner|shimmer|background|backdrop|zemin|glow)/i;
const ROOT_SELECTOR = /^(body|html|:root|\*)$/;
const COLOUR_SAMPLE = /(colou?r-sample|colou?r-preview|swatch|palette-sample)/i;
const SR_ONLY = /(sr-only|visually-hidden|screen-reader|screenreader)/i;
const KEYFRAME_BANNED = new Set([
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'margin-top',
  'margin-left',
  'margin-right',
  'margin-bottom',
  'padding',
  'box-shadow',
  'filter',
  'backdrop-filter',
  'background',
  'background-color',
  'background-position',
  'color',
  'border-color',
  'border-width',
  'font-size',
  'line-height',
  'gap',
  'flex',
  'flex-basis',
]);
const EASING_KEYWORD = /(^|[\s,])(ease-in-out|ease-in|ease-out|ease|linear|step-start|step-end)([\s,]|$)/;
const NATIVE_CONTROL = /^(button|input|select|textarea|fieldset|option|a)$/i;
const XAML_CONTROL = /^(Button|ToggleButton|RepeatButton|CheckBox|RadioButton|ComboBox|TextBox|Slider|MenuItem|TabItem|HyperlinkButton)$/;

function relOf(file) {
  if (!file) return '';
  if (typeof file === 'string') return file;
  return file.rel || file.path || '';
}

function baseName(file) {
  return path.basename(relOf(file));
}

function extOf(file) {
  return path.extname(relOf(file)).toLowerCase();
}

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i += 1) if (text[i] === '\n') n += 1;
  return n;
}

function oneLine(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripMarkupComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

function styleSections(file, text) {
  const ext = extOf(file);
  if (ext === '.css') return [{ text, offset: 0 }];
  if (ext !== '.vue' && ext !== '.svelte') return [];
  const out = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf(m[1]);
    out.push({ text: m[1], offset: (text.slice(0, start).match(/\n/g) || []).length });
  }
  return out;
}

function cssRules(text, offset) {
  const out = [];
  const stack = [];
  let line = 1;
  let start = 0;
  let startLine = 1;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{') {
      const raw = text.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
      const blank = (/^\s*/.exec(raw)[0].match(/\n/g) || []).length;
      stack.push({
        selector: raw.trim(),
        line: offset + startLine + blank,
        bodyStart: i + 1,
        parents: stack.map((r) => r.selector),
      });
      start = i + 1;
      startLine = line;
    } else if (c === '}') {
      const rule = stack.pop();
      if (rule) {
        rule.body = text.slice(rule.bodyStart, i);
        out.push(rule);
      }
      start = i + 1;
      startLine = line;
    } else if (c === '\n') {
      line += 1;
    }
  }
  return out;
}

function allRules(file, text) {
  const out = [];
  for (const section of styleSections(file, text))
    for (const r of cssRules(section.text, section.offset)) out.push(r);
  return out;
}

function flatRules(file, text) {
  return allRules(file, text).filter((r) => !r.body.includes('{') && !r.selector.startsWith('@'));
}

function decls(body) {
  const out = [];
  const flat = stripComments(String(body).replace(/\{[\s\S]*?\}/g, ''));
  for (const part of flat.split(';')) {
    const m = /^\s*([-\w]+)\s*:\s*([\s\S]*)$/.exec(part);
    if (m) out.push({ prop: m[1].toLowerCase(), value: oneLine(m[2]).toLowerCase() });
  }
  return out;
}

function declValue(rule, prop) {
  for (const d of decls(rule.body)) if (d.prop === prop) return d.value;
  return null;
}

function inContext(rule, pattern) {
  return (rule.parents || []).some((p) => pattern.test(p));
}

function selectors(rule) {
  return rule.selector
    .split(',')
    .map((s) => oneLine(s))
    .filter(Boolean);
}

function withoutNot(sel) {
  let out = sel;
  for (let i = 0; i < 6; i += 1) {
    const next = out.replace(/:(?:not|is|where|has)\([^()]*\)/g, '');
    if (next === out) break;
    out = next;
  }
  return out;
}

function stateOf(sel) {
  const bare = withoutNot(sel);
  if (/:hover\b/.test(bare)) return 'hover';
  if (/:focus-visible\b/.test(bare)) return 'focus';
  if (/:active\b/.test(bare)) return 'pressed';
  if (/(:disabled\b|\[disabled\]|\[aria-disabled)/.test(bare)) return 'disabled';
  return null;
}

function statesOf(sel) {
  const bare = withoutNot(sel);
  const out = new Set();
  if (/:hover\b/.test(bare)) out.add('hover');
  if (/:focus-visible\b/.test(bare)) out.add('focus');
  if (/:active\b/.test(bare)) out.add('pressed');
  if (/(:disabled\b|\[disabled\]|\[aria-disabled)/.test(bare)) out.add('disabled');
  return out;
}

function baseOf(sel) {
  return oneLine(
    withoutNot(sel)
      .replace(/:hover\b|:focus-visible\b|:focus-within\b|:active\b|:disabled\b/g, '')
      .replace(/\[disabled\]|\[aria-disabled[^\]]*\]/g, '')
  );
}

function lastCompound(sel) {
  const parts = withoutNot(sel).split(/[\s>+~]+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

function hasGlobalFocusRing(ctx) {
  if (!ctx || !ctx.files) return false;
  for (const f of ctx.files) {
    if (!STYLE.includes(f.ext)) continue;
    for (const r of flatRules(f.rel || f.path || '', f.text)) {
      for (const sel of selectors(r)) {
        const bare = withoutNot(sel);
        if (!/:focus-visible\b/.test(bare)) continue;
        if (/^\*?:focus-visible$/.test(bare)) return true;
      }
    }
  }
  return false;
}

function tags(text, name) {
  const out = [];
  const re = new RegExp('<' + name + '\\b([^>]*)>', 'g');
  for (const m of text.matchAll(re)) {
    const selfClosing = /\/\s*$/.test(m[1]);
    let inner = '';
    if (!selfClosing) {
      const close = text.indexOf('</' + name, m.index + m[0].length);
      inner = close === -1 ? '' : text.slice(m.index + m[0].length, close);
    }
    out.push({ attrs: m[1], inner, selfClosing, index: m.index, open: m[0] });
  }
  return out;
}

function visibleText(inner) {
  return inner
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
}

module.exports = {
  id: 'states',

  lineRules: [
    {
      id: 'bare-focus',
      severity: 'error',
      exts: WEB,
      test(line, ctx) {
        const text = stripComments(line).replace(/\/\/.*$/, '');
        if (SR_ONLY.test(text)) return null;
        if (/:focus\s*:\s*not\s*\(\s*:focus-visible/.test(text.replace(/\s+/g, ''))) return null;
        if (/:focus:not\(:focus-visible\)/.test(text.replace(/\s+/g, ''))) return null;
        if (/:focus(?!-visible|-within)\b/.test(text))
          return 'bare :focus — the ring is drawn on :focus-visible only';
        if (ctx && ctx.ext === '.css') return null;
        if (/(?<![-\w])focus:(?!focus-visible)/.test(text))
          return 'focus: utility — use focus-visible:';
        return null;
      },
    },
    {
      id: 'disabled-opacity',
      severity: 'error',
      exts: [...MARKUP, '.css'],
      test(line) {
        return /\bdisabled:opacity-/.test(line)
          ? 'disabled:opacity-* — a disabled control changes colour, never opacity'
          : null;
      },
    },
    {
      id: 'empty-accessible-name',
      severity: 'error',
      exts: [...MARKUP, ...XAML, '.cs'],
      test(line) {
        if (/aria-label\s*=\s*(?:""|''|\{\s*(?:""|'')\s*\})/.test(line))
          return 'aria-label="" — an empty name is as broken as no name';
        if (/AutomationProperties\.Name\s*=\s*""/.test(line))
          return 'AutomationProperties.Name="" — an empty name is as broken as no name';
        return null;
      },
    },
    {
      id: 'progress-live-region',
      severity: 'error',
      exts: [...MARKUP, ...XAML],
      test(line) {
        if (!/aria-live|LiveSetting/.test(line)) return null;
        if (/progressbar|aria-valuenow|RangeValue/.test(line))
          return 'progress announced through a live region — use role="progressbar" with aria-valuenow';
        return null;
      },
    },
    {
      id: 'assertive-scope',
      severity: 'warn',
      exts: [...MARKUP, ...XAML],
      test(line) {
        if (!/aria-live\s*=\s*["'{\s]*assertive|LiveSetting\s*=\s*"Assertive"/.test(line))
          return null;
        if (/error|danger|alert|invalid|fail|hata/i.test(line)) return null;
        return 'assertive live region — assertive is for errors and data loss only';
      },
    },
    {
      id: 'storyboard-target',
      severity: 'error',
      exts: [...XAML, '.cs'],
      test(line) {
        const m = /Storyboard\.TargetProperty\s*=\s*"([^"]+)"/.exec(line);
        if (!m) return null;
        const target = m[1];
        if (/RenderTransform|Opacity/.test(target)) return null;
        if (/LayoutTransform|Effect/.test(target)) return null;
        return (
          target + ' — a storyboard drives RenderTransform and Opacity only'
        );
      },
    },
  ],

  fileRules: [
    {
      id: 'raw-easing',
      severity: 'error',
      exts: WEB,
      check(file, text) {
        if (TOKEN_FILE_NAME.test(baseName(file))) return [];
        if (/[\\/]assets[\\/]/.test(relOf(file))) return [];
        const out = [];
        text.split(/\r?\n/).forEach((line, i) => {
          const bare = stripComments(line);
          if (/cubic-bezier\s*\(/.test(bare) && !/--tk-e-/.test(bare))
            out.push({ line: i + 1, message: 'literal cubic-bezier — read var(--tk-e-*)' });
          else if (/\bsteps\s*\(/.test(bare) && /transition|animation/.test(bare))
            out.push({ line: i + 1, message: 'literal steps() easing — read var(--tk-e-*)' });
          else if (
            (bare.match(/(?<![-\w])ease-\[([^\]]*)\]/g) || []).some((u) => !/--tk-e-/.test(u))
          )
            out.push({ line: i + 1, message: 'arbitrary ease-[…] utility — read var(--tk-e-*)' });
          else if (/(?<![-\w])ease-(in-out|in|out|linear)(?![\w-])/.test(bare) && !/--tk-e-/.test(bare))
            out.push({ line: i + 1, message: 'default easing utility — read var(--tk-e-*)' });
          else {
            const m = /\b(transition|animation)(-timing-function)?\s*:\s*([^;{}]*)/i.exec(bare);
            if (m && !/--tk-e-/.test(m[3]) && EASING_KEYWORD.test(' ' + m[3].toLowerCase() + ' '))
              out.push({ line: i + 1, message: 'literal easing keyword — read var(--tk-e-*)' });
          }
        });
        return out;
      },
    },
    {
      id: 'five-states',
      severity: 'warn',
      exts: STYLE,
      check(file, text, ctx) {
        const seen = new Map();
        for (const r of flatRules(file, text)) {
          if (inContext(r, /forced-colors|prefers-reduced-motion|print/)) continue;
          for (const sel of selectors(r)) {
            const base = baseOf(sel);
            if (!base) continue;
            if (!seen.has(base)) seen.set(base, { states: new Set(), line: r.line, rest: false });
            const entry = seen.get(base);
            const found = statesOf(sel);
            if (!found.size) entry.rest = true;
            for (const s of found) {
              entry.states.add(s);
              if (entry.line > r.line) entry.line = r.line;
            }
          }
        }
        const out = [];
        const globalRing = hasGlobalFocusRing(ctx);
        for (const [base, entry] of seen) {
          const declared = entry.states.size + (entry.rest ? 1 : 0);
          if (declared < 3) continue;
          const missing = [];
          if (!entry.rest) missing.push('rest');
          for (const s of ['hover', 'focus', 'pressed', 'disabled']) {
            if (entry.states.has(s)) continue;
            if (s === 'focus' && globalRing) continue;
            missing.push(s);
          }
          if (missing.length)
            out.push({
              line: entry.line,
              message: base + ' — states not defined: ' + missing.join(', '),
            });
        }
        return out;
      },
    },
    {
      id: 'state-layer-properties',
      severity: 'error',
      exts: ['.css'],
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          if (!/\[data-tk[\]=]/.test(r.selector)) continue;
          if (!selectors(r).some((s) => stateOf(s))) continue;
          for (const d of decls(r.body)) {
            if (d.prop.startsWith('transition-')) continue;
            if (!ALLOWED_STATE_PROPERTY.has(d.prop)) {
              out.push({
                line: r.line,
                message: d.prop + ' — the state layer writes only the seven allowed properties',
              });
              continue;
            }
            if (d.prop === 'box-shadow' && d.value !== 'none')
              out.push({
                line: r.line,
                message: 'box-shadow — the state layer may only cancel it with none',
              });
          }
        }
        return out;
      },
    },
    {
      id: 'state-layer-binding',
      severity: 'error',
      exts: ['.css'],
      check(file, text, ctx) {
        const rules = flatRules(file, text);
        const defined = new Set();
        const pool = ctx && ctx.files ? ctx.files.filter((f) => STYLE.includes(f.ext)) : [];
        const scan = pool.length ? pool : [{ rel: relOf(file), text }];
        for (const f of scan)
          for (const r of flatRules(f.rel || f.path || '', f.text))
            for (const sel of selectors(r)) {
              if (stateOf(sel)) continue;
              for (const c of withoutNot(sel).match(/\.tk-[-\w]+/g) || []) defined.add(c);
            }
        const out = [];
        for (const r of rules) {
          for (const sel of selectors(r)) {
            if (!stateOf(sel)) continue;
            for (const c of withoutNot(sel).match(/\.tk-[-\w]+/g) || []) {
              if (defined.has(c)) continue;
              out.push({
                line: r.line,
                message:
                  c + ' — state layer bound to an undefined class; bind to a data-tk attribute',
              });
            }
          }
        }
        return out;
      },
    },
    {
      id: 'hover-without-focus',
      severity: 'error',
      exts: [...STYLE, ...MARKUP],
      check(file, text, ctx) {
        if (hasGlobalFocusRing(ctx)) return [];
        const out = [];
        const rules = flatRules(file, text);
        const focused = new Set();
        for (const r of rules)
          for (const sel of selectors(r))
            if (statesOf(sel).has('focus')) focused.add(baseOf(sel));
        for (const r of rules) {
          if (inContext(r, /forced-colors/)) continue;
          const signal = decls(r.body).some((d) =>
            /^(color|background|background-color|border-color|box-shadow|outline|transform|filter)$/.test(
              d.prop
            )
          );
          if (!signal) continue;
          for (const sel of selectors(r)) {
            const found = statesOf(sel);
            if (!found.has('hover') || found.has('focus') || found.has('disabled')) continue;
            if (focused.has(baseOf(sel))) continue;
            out.push({
              line: r.line,
              message: oneLine(sel) + ' — hover signal with no :focus-visible twin',
            });
          }
        }
        if (MARKUP.includes(extOf(file))) {
          text.split(/\r?\n/).forEach((line, i) => {
            if (!/(?<![-\w])hover:/.test(line)) return;
            if (/focus-visible:/.test(line)) return;
            out.push({ line: i + 1, message: 'hover: utility with no focus-visible: twin' });
          });
        }
        return out;
      },
    },
    {
      id: 'pressed-without-carrier',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          if (!selectors(r).some((s) => statesOf(s).has('pressed'))) continue;
          const list = decls(r.body);
          if (!list.some((d) => d.prop === 'transform')) continue;
          const carrier = list.some((d) =>
            /^(color|background|background-color|border-color|border|outline|box-shadow)$/.test(
              d.prop
            )
          );
          if (!carrier)
            out.push({
              line: r.line,
              message:
                oneLine(r.selector) +
                ' — pressed carried by transform alone; reduced motion removes it',
            });
        }
        return out;
      },
    },
    {
      id: 'state-opacity',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          if (inContext(r, /forced-colors|prefers-reduced-motion/)) continue;
          if (!selectors(r).some((s) => stateOf(s))) continue;
          for (const d of decls(r.body))
            if (d.prop === 'opacity')
              out.push({
                line: r.line,
                message: 'opacity changes between states — carry the difference in colour',
              });
        }
        return out;
      },
    },
    {
      id: 'disabled-affordance',
      severity: 'error',
      exts: [...STYLE, ...MARKUP, ...XAML],
      check(file, text) {
        const out = [];
        const ext = extOf(file);
        if (STYLE.includes(ext)) {
          const rules = flatRules(file, text);
          const covered = new Set();
          for (const r of rules) {
            const value = declValue(r, 'cursor');
            if (value !== 'not-allowed') continue;
            for (const sel of selectors(r)) covered.add(baseOf(sel));
          }
          for (const r of rules) {
            if (inContext(r, /forced-colors|prefers-reduced-motion/)) continue;
            for (const sel of selectors(r)) {
              if (!statesOf(sel).has('disabled')) continue;
              if (!stateOf(lastCompound(sel))) continue;
              if (covered.has(baseOf(sel))) continue;
              out.push({
                line: r.line,
                message: oneLine(sel) + ' — disabled state without cursor: not-allowed',
              });
            }
          }
        }
        if (MARKUP.includes(ext)) {
          for (const m of text.matchAll(/<([a-z][-\w]*)\b([^>]*)>/g)) {
            if (!NATIVE_CONTROL.test(m[1])) continue;
            const attrs = m[2];
            if (!/(^|\s)disabled(\s|=|\/|$)/.test(attrs)) continue;
            if (/\bdisabled\s*=\s*\{?\s*(false|\{false\})/.test(attrs)) continue;
            if (/\btitle\s*=/.test(attrs)) continue;
            out.push({
              line: lineAt(text, m.index),
              message: '<' + m[1] + '> disabled without a title explaining why',
            });
          }
        }
        if (XAML.includes(ext)) {
          for (const m of text.matchAll(/<([A-Z][\w.]*)\b([^>]*)>/g)) {
            if (!XAML_CONTROL.test(m[1])) continue;
            if (!/IsEnabled\s*=\s*"False"/.test(m[2])) continue;
            if (/ToolTip\s*=/.test(m[2])) continue;
            out.push({
              line: lineAt(text, m.index),
              message: '<' + m[1] + '> IsEnabled="False" without a ToolTip explaining why',
            });
          }
        }
        return out;
      },
    },
    {
      id: 'focus-ring-layers',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          if (inContext(r, /forced-colors/)) continue;
          if (!selectors(r).some((s) => statesOf(s).has('focus'))) continue;
          const outline = declValue(r, 'outline');
          const shadow = declValue(r, 'box-shadow');
          if (!outline || outline === 'none') continue;
          if (!shadow || shadow === 'none')
            out.push({
              line: r.line,
              message:
                oneLine(r.selector) + ' — focus ring is two layers: outline plus inner box-shadow',
            });
        }
        return out;
      },
    },
    {
      id: 'animated-property',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of allRules(file, text)) {
          if (!/^@(-\w+-)?keyframes\b/.test(r.selector)) continue;
          const seen = new Set();
          for (const d of decls(r.body.replace(/^[^{]*\{/, '').replace(/\}[^}]*$/, ''))) seen.add(d.prop);
          for (const m of r.body.matchAll(/\{([^{}]*)\}/g))
            for (const d of decls(m[1])) seen.add(d.prop);
          const banned = [...seen].filter((p) => KEYFRAME_BANNED.has(p));
          if (banned.length)
            out.push({
              line: r.line,
              message:
                oneLine(r.selector) + ' animates ' + banned.join(', ') + ' — opacity and transform only',
            });
        }
        return out;
      },
    },
    {
      id: 'infinite-loop-scope',
      severity: 'error',
      exts: [...STYLE, ...MARKUP],
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          const list = decls(r.body);
          const loop = list.some(
            (d) =>
              (d.prop === 'animation-iteration-count' && /infinite/.test(d.value)) ||
              (d.prop === 'animation' && /(^|\s)infinite(\s|$)/.test(d.value))
          );
          if (!loop) continue;
          const ok = selectors(r).every(
            (s) => ROOT_SELECTOR.test(oneLine(s)) || LOOP_SCOPE.test(s)
          );
          if (!ok)
            out.push({
              line: r.line,
              message:
                oneLine(r.selector) +
                ' — an infinite loop belongs to progress or the app background only',
            });
        }
        if (MARKUP.includes(extOf(file))) {
          text.split(/\r?\n/).forEach((line, i) => {
            const m = /(?<![-\w])animate-(spin|ping|pulse|bounce)(?![\w-])/.exec(line);
            if (!m) return;
            if (/motion-safe:animate-|motion-safe:/.test(line)) return;
            if (LOOP_SCOPE.test(line)) return;
            out.push({
              line: i + 1,
              message:
                m[0] + ' — an infinite loop runs under motion-safe: and only for progress',
            });
          });
        }
        return out;
      },
    },
    {
      id: 'glow-on-repeated-item',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          const shadow = declValue(r, 'box-shadow');
          const filter = declValue(r, 'filter');
          const glow = (shadow && shadow !== 'none') || (filter && /drop-shadow\s*\(/.test(filter));
          if (!glow) continue;
          for (const sel of selectors(r)) {
            if (!REPEATED_ITEM.test(sel)) continue;
            out.push({
              line: r.line,
              message: oneLine(sel) + ' — glow the container, never a repeated item',
            });
          }
        }
        return out;
      },
    },
    {
      id: 'wpf-shadow-in-item-template',
      severity: 'error',
      exts: XAML,
      check(file, text) {
        const out = [];
        const clean = stripMarkupComments(text);
        for (const m of clean.matchAll(/<DataTemplate\b[\s\S]*?<\/DataTemplate>/g))
          if (/DropShadowEffect/.test(m[0]))
            out.push({
              line: lineAt(clean, m.index),
              message: 'DropShadowEffect inside a DataTemplate — every item repaints on scroll',
            });
        return out;
      },
    },
    {
      id: 'avalonia-transform-object',
      severity: 'error',
      exts: ['.axaml'],
      check(file, text) {
        const out = [];
        const clean = stripMarkupComments(text);
        for (const m of clean.matchAll(/<Setter\b[^>]*(?<!\/)>[\s\S]*?<\/Setter>/g))
          if (/<(Scale|Rotate|Translate|Skew|Matrix)Transform\b|<TransformGroup\b/.test(m[0]))
            out.push({
              line: lineAt(clean, m.index),
              message: 'RenderTransform set as an object inside a Setter — write it as a string',
            });
        return out;
      },
    },
    {
      id: 'backdrop-filter-count',
      severity: 'warn',
      exts: STYLE,
      check(file, text) {
        const out = [];
        let seen = 0;
        for (const r of flatRules(file, text)) {
          const value = declValue(r, 'backdrop-filter');
          if (!value || value === 'none') continue;
          seen += 1;
          if (seen > 1)
            out.push({
              line: r.line,
              message: oneLine(r.selector) + ' — second backdrop-filter on one scroll path',
            });
        }
        return out;
      },
    },
    {
      id: 'unnamed-interactive',
      severity: 'error',
      exts: [...MARKUP, ...XAML],
      check(file, text) {
        const out = [];
        const ext = extOf(file);
        if (MARKUP.includes(ext)) {
          for (const name of ['button', 'a']) {
            for (const t of tags(text, name)) {
              if (/aria-label(?:ledby)?\s*=/.test(t.attrs)) continue;
              if (SR_ONLY.test(t.inner)) continue;
              if (/[A-Za-zÀ-ɏ]/.test(visibleText(t.inner))) continue;
              if (/\{/.test(t.inner)) continue;
              if (!t.selfClosing && !/<|\{/.test(t.inner) && !t.inner.trim()) continue;
              out.push({
                line: lineAt(text, t.index),
                message: '<' + name + '> with no accessible name — add aria-label',
              });
            }
          }
        }
        if (XAML.includes(ext)) {
          for (const m of text.matchAll(/<(Button|HyperlinkButton|RepeatButton)\b([^>]*)>/g)) {
            const attrs = m[2];
            if (/AutomationProperties\.Name\s*=/.test(attrs)) continue;
            if (/(Focusable|IsTabStop)\s*=\s*"False"/.test(attrs)) continue;
            if (/\bContent\s*=\s*"[^"]*[A-Za-zÀ-ɏ{]/.test(attrs)) continue;
            if (!/\/\s*$/.test(attrs)) {
              const close = text.indexOf('</' + m[1], m.index);
              const inner = close === -1 ? '' : text.slice(m.index + m[0].length, close);
              if (/[A-Za-zÀ-ɏ]/.test(visibleText(inner))) continue;
              if (/(Text|Content)\s*=|\{loc:/.test(inner)) continue;
            }
            out.push({
              line: lineAt(text, m.index),
              message:
                '<' + m[1] + '> with no accessible name — add AutomationProperties.Name',
            });
          }
        }
        return out;
      },
    },
    {
      id: 'icon-not-hidden',
      severity: 'error',
      exts: MARKUP,
      check(file, text) {
        const out = [];
        for (const name of ['button', 'a']) {
          for (const t of tags(text, name)) {
            const named =
              /aria-label(?:ledby)?\s*=/.test(t.attrs) ||
              /[A-Za-zÀ-ɏ]/.test(visibleText(t.inner));
            if (!named) continue;
            for (const svg of t.inner.matchAll(/<svg\b([^>]*)>/g)) {
              const attrs = svg[1];
              const missing = [];
              if (!/aria-hidden\s*=/.test(attrs)) missing.push('aria-hidden');
              if (!/focusable\s*=/.test(attrs)) missing.push('focusable="false"');
              if (missing.length)
                out.push({
                  line: lineAt(text, t.index + t.open.length + svg.index),
                  message: 'icon inside a named ' + name + ' misses ' + missing.join(' and '),
                });
            }
          }
        }
        return out;
      },
    },
    {
      id: 'sr-only-display-none',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          if (!selectors(r).some((s) => SR_ONLY.test(s))) continue;
          for (const d of decls(r.body)) {
            if (d.prop === 'display' && d.value === 'none')
              out.push({
                line: r.line,
                message: 'sr-only with display: none — the reader loses it too; clip it instead',
              });
            if (d.prop === 'visibility' && d.value === 'hidden')
              out.push({
                line: r.line,
                message: 'sr-only with visibility: hidden — the reader loses it too; clip it instead',
              });
          }
        }
        return out;
      },
    },
    {
      id: 'forced-color-adjust-scope',
      severity: 'error',
      exts: STYLE,
      check(file, text) {
        const out = [];
        for (const r of flatRules(file, text)) {
          const value = declValue(r, 'forced-color-adjust');
          if (!value || value === 'auto') continue;
          for (const sel of selectors(r)) {
            if (COLOUR_SAMPLE.test(sel)) continue;
            out.push({
              line: r.line,
              message:
                oneLine(sel) + ' — forced-color-adjust: none is for colour samples only',
            });
          }
        }
        return out;
      },
    },
  ],

  projectRules: [
    {
      id: 'wpf-animation-guard',
      severity: 'warn',
      check(ctx) {
        if (!ctx || !ctx.files) return [];
        const xaml = ctx.files.filter((f) => f.ext === '.xaml');
        if (!xaml.length) return [];
        const looping = xaml.filter((f) => /RepeatBehavior\s*=\s*"Forever"/.test(f.text));
        if (!looping.length) return [];
        const pool = [...ctx.files, ...(ctx.modules || [])];
        if (pool.some((f) => f.text && /ClientAreaAnimation/.test(f.text))) return [];
        return looping.map((f) => ({
          file: f.rel || f.path || '',
          line: lineAt(f.text, f.text.search(/RepeatBehavior\s*=\s*"Forever"/)),
          message:
            'looping storyboard — no SystemParameters.ClientAreaAnimation in the scanned files',
        }));
      },
    },
    {
      id: 'hero-glow-forced-colors',
      severity: 'error',
      check(ctx) {
        if (!ctx || !ctx.files) return [];
        const style = ctx.files.filter((f) => STYLE.includes(f.ext));
        if (!style.length) return [];
        let hero = null;
        for (const f of style) {
          for (const r of flatRules(f.rel || f.path || '', f.text)) {
            if (inContext(r, /forced-colors/)) continue;
            const filter = declValue(r, 'filter');
            if (!filter || !/drop-shadow\s*\(/.test(filter)) continue;
            if (!selectors(r).some((s) => /hero/i.test(s))) continue;
            hero = { file: f.rel || f.path || '', line: r.line };
            break;
          }
          if (hero) break;
        }
        if (!hero) return [];
        for (const f of style) {
          for (const r of allRules(f.rel || f.path || '', f.text)) {
            if (!/forced-colors\s*:\s*active/.test(r.selector)) continue;
            if (/filter\s*:\s*none/.test(stripComments(r.body))) return [];
          }
        }
        return [
          {
            file: hero.file,
            line: hero.line,
            message:
              'hero glow uses filter: drop-shadow — forced-colors does not erase it; write filter: none',
          },
        ];
      },
    },
  ],
};
