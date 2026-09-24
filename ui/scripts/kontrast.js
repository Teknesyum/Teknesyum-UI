'use strict';

const THRESHOLD = 7;

const NAMED = (
  'aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,azure:f0ffff,beige:f5f5dc,' +
  'bisque:ffe4c4,black:000000,blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,' +
  'burlywood:deb887,cadetblue:5f9ea0,chartreuse:7fff00,chocolate:d2691e,coral:ff7f50,' +
  'cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,cyan:00ffff,darkblue:00008b,darkcyan:008b8b,' +
  'darkgoldenrod:b8860b,darkgray:a9a9a9,darkgreen:006400,darkgrey:a9a9a9,darkkhaki:bdb76b,' +
  'darkmagenta:8b008b,darkolivegreen:556b2f,darkorange:ff8c00,darkorchid:9932cc,darkred:8b0000,' +
  'darksalmon:e9967a,darkseagreen:8fbc8f,darkslateblue:483d8b,darkslategray:2f4f4f,' +
  'darkslategrey:2f4f4f,darkturquoise:00ced1,darkviolet:9400d3,deeppink:ff1493,deepskyblue:00bfff,' +
  'dimgray:696969,dimgrey:696969,dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,' +
  'forestgreen:228b22,fuchsia:ff00ff,gainsboro:dcdcdc,ghostwhite:f8f8ff,gold:ffd700,' +
  'goldenrod:daa520,gray:808080,green:008000,greenyellow:adff2f,grey:808080,honeydew:f0fff0,' +
  'hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,khaki:f0e68c,lavender:e6e6fa,' +
  'lavenderblush:fff0f5,lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,lightcoral:f08080,' +
  'lightcyan:e0ffff,lightgoldenrodyellow:fafad2,lightgray:d3d3d3,lightgreen:90ee90,lightgrey:d3d3d3,' +
  'lightpink:ffb6c1,lightsalmon:ffa07a,lightseagreen:20b2aa,lightskyblue:87cefa,' +
  'lightslategray:778899,lightslategrey:778899,lightsteelblue:b0c4de,lightyellow:ffffe0,lime:00ff00,' +
  'limegreen:32cd32,linen:faf0e6,magenta:ff00ff,maroon:800000,mediumaquamarine:66cdaa,' +
  'mediumblue:0000cd,mediumorchid:ba55d3,mediumpurple:9370db,mediumseagreen:3cb371,' +
  'mediumslateblue:7b68ee,mediumspringgreen:00fa9a,mediumturquoise:48d1cc,mediumvioletred:c71585,' +
  'midnightblue:191970,mintcream:f5fffa,mistyrose:ffe4e1,moccasin:ffe4b5,navajowhite:ffdead,' +
  'navy:000080,oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,orangered:ff4500,' +
  'orchid:da70d6,palegoldenrod:eee8aa,palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,' +
  'papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f,pink:ffc0cb,plum:dda0dd,powderblue:b0e0e6,' +
  'purple:800080,rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,royalblue:4169e1,' +
  'saddlebrown:8b4513,salmon:fa8072,sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,sienna:a0522d,' +
  'silver:c0c0c0,skyblue:87ceeb,slateblue:6a5acd,slategray:708090,slategrey:708090,snow:fffafa,' +
  'springgreen:00ff7f,steelblue:4682b4,tan:d2b48c,teal:008080,thistle:d8bfd8,tomato:ff6347,' +
  'turquoise:40e0d0,violet:ee82ee,wheat:f5deb3,white:ffffff,whitesmoke:f5f5f5,yellow:ffff00,' +
  'yellowgreen:9acd32'
)
  .split(',')
  .reduce((out, pair) => {
    const [k, v] = pair.split(':');
    out[k] = v;
    return out;
  }, {});

function channel(s) {
  return parseInt(s, 16);
}

function fromHex(value, argb) {
  let v = String(value).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]+$/.test(v)) return null;
  if (v.length === 3 || v.length === 4) v = v.split('').map((c) => c + c).join('');
  if (v.length === 6) return { r: channel(v.slice(0, 2)), g: channel(v.slice(2, 4)), b: channel(v.slice(4, 6)), a: 1 };
  if (v.length !== 8) return null;
  if (argb)
    return { r: channel(v.slice(2, 4)), g: channel(v.slice(4, 6)), b: channel(v.slice(6, 8)), a: channel(v.slice(0, 2)) / 255 };
  return { r: channel(v.slice(0, 2)), g: channel(v.slice(2, 4)), b: channel(v.slice(4, 6)), a: channel(v.slice(6, 8)) / 255 };
}

function part(s, scale) {
  const t = String(s).trim();
  if (t.endsWith('%')) return (parseFloat(t) / 100) * scale;
  return parseFloat(t);
}

function fromFunction(value) {
  const m = /^rgba?\(\s*([^)]*)\)$/i.exec(String(value).trim());
  if (!m) return null;
  const body = m[1].replace(/\s*\/\s*/, ' / ');
  let items;
  let alpha = '1';
  if (body.includes(',')) {
    items = body.split(',').map((s) => s.trim());
    if (items.length === 4) alpha = items.pop();
  } else {
    const [rgb, a] = body.split('/');
    items = rgb.trim().split(/\s+/);
    if (a !== undefined) alpha = a.trim();
  }
  if (items.length !== 3) return null;
  const [r, g, b] = items.map((s) => part(s, 255));
  const a = part(alpha, 1);
  if ([r, g, b, a].some((n) => !Number.isFinite(n))) return null;
  return { r, g, b, a: Math.max(0, Math.min(1, a)) };
}

function fromHsl(value) {
  const m = /^hsla?\(\s*([^)]*)\)$/i.exec(String(value).trim());
  if (!m) return null;
  const body = m[1].replace(/\s*\/\s*/, ' / ');
  let items;
  let alpha = '1';
  if (body.includes(',')) {
    items = body.split(',').map((s) => s.trim());
    if (items.length === 4) alpha = items.pop();
  } else {
    const [hsl, a] = body.split('/');
    items = hsl.trim().split(/\s+/);
    if (a !== undefined) alpha = a.trim();
  }
  if (items.length !== 3) return null;
  const hue = (((parseFloat(items[0]) % 360) + 360) % 360) / 360;
  const s = parseFloat(items[1]) / 100;
  const l = parseFloat(items[2]) / 100;
  const a = part(alpha, 1);
  if ([hue, s, l, a].some((n) => !Number.isFinite(n))) return null;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const k = (t) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: k(hue + 1 / 3) * 255, g: k(hue) * 255, b: k(hue - 1 / 3) * 255, a: Math.max(0, Math.min(1, a)) };
}

function splitTop(body) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(') depth++;
    else if (body[i] === ')') depth--;
    else if (body[i] === ',' && depth === 0) {
      out.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(body.slice(start).trim());
  return out;
}

function fromMix(value) {
  const m = /^color-mix\(\s*([\s\S]*)\)$/i.exec(String(value).trim());
  if (!m) return null;
  const items = splitTop(m[1]);
  if (items.length !== 3 || !/^in\s+srgb$/i.test(items[0])) return null;
  const side = (s) => {
    const p = /\s+(\d+(?:\.\d+)?)%$/.exec(s);
    return { c: parse(p ? s.slice(0, p.index) : s), p: p ? Number(p[1]) / 100 : null };
  };
  const a = side(items[1]);
  const b = side(items[2]);
  if (!a.c || !b.c) return null;
  let pa = a.p === null ? (b.p === null ? 0.5 : 1 - b.p) : a.p;
  let pb = b.p === null ? 1 - pa : b.p;
  const sum = pa + pb;
  if (sum <= 0) return null;
  pa /= sum;
  pb /= sum;
  const alpha = a.c.a * pa + b.c.a * pb;
  if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (x, y) => (x * a.c.a * pa + y * b.c.a * pb) / alpha;
  return { r: mix(a.c.r, b.c.r), g: mix(a.c.g, b.c.g), b: mix(a.c.b, b.c.b), a: Math.min(1, alpha * Math.min(1, sum)) };
}

function parse(value, argb) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v[0] === '#') return fromHex(v, argb);
  if (/^color-mix\(/i.test(v)) return fromMix(v);
  if (/^rgba?\(/i.test(v)) return fromFunction(v);
  if (/^hsla?\(/i.test(v)) return fromHsl(v);
  const low = v.toLowerCase();
  if (low === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (NAMED[low]) return fromHex(NAMED[low]);
  return null;
}

function withAlpha(c, a) {
  return c ? { r: c.r, g: c.g, b: c.b, a: c.a * a } : null;
}

function over(top, bottom) {
  if (!top) return bottom;
  if (!bottom || top.a >= 1) return { r: top.r, g: top.g, b: top.b, a: top.a >= 1 ? 1 : top.a };
  const a = top.a + bottom.a * (1 - top.a);
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (x, y) => (x * top.a + y * bottom.a * (1 - top.a)) / a;
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
}

function linear(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(c) {
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
}

function ratio(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function pair(fill, text, ground) {
  const bg = over(fill, ground);
  const fg = over(text, bg);
  return { bg, fg, ratio: ratio(fg, bg) };
}

function hex(c) {
  if (!c) return '';
  const k = (n) => Math.round(n).toString(16).padStart(2, '0');
  return '#' + k(c.r) + k(c.g) + k(c.b);
}

function fmt(r) {
  const one = r.toFixed(1);
  return one === THRESHOLD.toFixed(1) && r < THRESHOLD ? r.toFixed(2) : one;
}

module.exports = { THRESHOLD, NAMED, parse, withAlpha, over, luminance, ratio, pair, hex, fmt };
