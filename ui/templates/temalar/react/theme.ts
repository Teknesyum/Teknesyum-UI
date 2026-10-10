// teknesyum-ui template temalar/react/theme.ts
import themes from './themes.json';

export type Theme = {
  id: string;
  ad: string;
  'renk-1': string;
  'renk-2': string;
  'renk-3': string;
  'renk-2-text': string;
  'renk-3-text': string;
  surface: string;
  black: string;
  'glass-base': string;
  text: string;
  disabled: string;
  success: string;
  warning: string;
  danger?: string;
};

export const THEMES = themes as Theme[];
const BASE = THEMES[0] as Theme;
export const DEFAULT_THEME = BASE.id;
export const THEME_KEY = 'tk.theme';
export const THEMED_CLASS = 'tk-themed';
export const MIN_RATIO = 4.5;

const DARK = 'rgb(0, 0, 0)';
const LIGHT = 'rgb(255, 255, 255)';
const TINTS = [10, 20, 30, 50, 60];
const STEPS = 24;

export type Rgb = [number, number, number];

export function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(c: Rgb): number {
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}

function css(c: Rgb): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function on(c: Rgb): string {
  const l = luminance(c);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? DARK : LIGHT;
}

function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mix(a: Rgb, b: Rgb, share: number): Rgb {
  const f = (i: 0 | 1 | 2): number => Math.round(a[i] * share + b[i] * (1 - share));
  return [f(0), f(1), f(2)];
}

export function ratio(a: Rgb, b: Rgb): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function readable(from: Rgb, th: Theme): Rgb {
  const text = rgb(th.text);
  const grounds = [rgb(th.black), rgb(th.surface)];
  let c = from;
  for (let step = 0; step < STEPS; step++) {
    if (grounds.every((g) => ratio(c, g) >= MIN_RATIO)) break;
    c = mix(c, text, 0.85);
  }
  return c;
}

export const TEXT_TOKENS = ['--tk-text-muted', '--tk-text-label', '--tk-renk-2-text', '--tk-renk-3-text', '--tk-danger-text'];

export function themeTokens(th: Theme): Record<string, string> {
  const danger = th.danger ?? th['renk-2'];
  const dangerText = readable(rgb(th.danger ?? th['renk-2-text']), th);
  const muted = readable(mix(rgb(th.text), rgb(th.black), 0.65), th);
  const out: Record<string, string> = {
    '--tk-renk-1': th['renk-1'],
    '--tk-renk-2': th['renk-2'],
    '--tk-renk-3': th['renk-3'],
    '--tk-renk-2-text': css(readable(rgb(th['renk-2-text']), th)),
    '--tk-renk-3-text': css(readable(rgb(th['renk-3-text']), th)),
    '--tk-success': th.success,
    '--tk-surface': th.surface,
    '--tk-bg': th.black,
    '--tk-bg-from': th.black,
    '--tk-bg-to': th.black,
    '--tk-panel': th.surface,
    '--tk-scrim': alpha(th.black, 0.6),
    '--tk-shadow-panel': `0 0 40px ${alpha(th.black, 0.8)}`,
    '--tk-glass': alpha(th['glass-base'], 0.9),
    '--tk-danger': danger,
    '--tk-danger-text': css(dangerText),
    '--tk-warning': th.warning,
    '--tk-warning-border': alpha(th.warning, 0.5),
    '--tk-text': th.text,
    '--tk-text-label': css(readable(rgb(th['renk-1']), th)),
    '--tk-text-muted': css(muted),
    '--tk-disabled': th.disabled,
    '--tk-on-renk-1': on(rgb(th['renk-1'])),
    '--tk-on-renk-2': on(rgb(th['renk-2'])),
    '--tk-on-renk-3': on(rgb(th['renk-3'])),
    '--tk-on-success': on(rgb(th.success)),
    '--tk-on-danger': on(rgb(danger)),
    '--tk-on-danger-text': on(dangerText),
    '--tk-on-panel': th.text,
    '--tk-on-glass': th.text,
    '--tk-border': alpha(th['renk-1'], 0.55),
    '--tk-border-strong': alpha(th['renk-1'], 0.7),
    '--tk-border-decorative': alpha(th['renk-1'], 0.2),
    '--tk-window-edge': alpha(th['renk-1'], 0.7),
    '--tk-thumb': th['renk-3-text'],
    '--tk-thumb-hover': th['renk-2-text'],
    '--tk-track': alpha(th.text, 0.12),
  };
  for (const n of [1, 2, 3] as const)
    for (const s of TINTS) {
      out[`--tk-renk-${n}-${s}`] = alpha(th[`renk-${n}`], s / 100);
      out[`--tk-on-renk-${n}-${s}`] = th.text;
    }
  return out;
}

export function isLight(th: Theme): boolean {
  return luminance(rgb(th.black)) > 0.5;
}

export function findTheme(id: string | null | undefined): Theme {
  return THEMES.find((x) => x.id === id) ?? BASE;
}

export function applyTheme(id: string | null | undefined, key: string = THEME_KEY): Theme {
  const th = findTheme(id);
  const root = document.documentElement;
  const tokens = themeTokens(th);
  if (th.id === DEFAULT_THEME) {
    for (const name of Object.keys(tokens)) root.style.removeProperty(name);
    root.style.removeProperty('color-scheme');
    root.classList.remove(THEMED_CLASS);
  } else {
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    root.style.setProperty('color-scheme', isLight(th) ? 'light' : 'dark');
    root.classList.add(THEMED_CLASS);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', th.black);
  try {
    localStorage.setItem(key, th.id);
  } catch {
    return th;
  }
  return th;
}

export function storedTheme(key: string = THEME_KEY): string {
  try {
    return findTheme(localStorage.getItem(key)).id;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyStoredTheme(key: string = THEME_KEY): Theme {
  return applyTheme(storedTheme(key), key);
}
