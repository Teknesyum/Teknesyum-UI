'use strict';

const ANAHTARLAR = [
  ['sig.brand', 'brand', ''],
  ['sig.brandTitle', 'brand', 'hint-'],
  ['sig.support', 'support', ''],
  ['sig.supportTitle', 'support', 'hint-'],
  ['update.label', 'update', ''],
  ['update.download', 'update', 'download-'],
  ['update.install', 'update', 'install-'],
  ['update.current', 'version', 'current-'],
  ['update.check', 'version', 'check-'],
  ['update.confirmSetting', 'version', 'confirm-'],
  ['update.error', 'version', 'error-'],
  ['sync.synced', 'sync', ''],
  ['sync.offline', 'sync', 'offline-'],
  ['sync.now', 'sync', 'hint-'],
  ['app.title', 'title', ''],
];
const DILLER = ['tr', 'en'];
const AGIRLIK = { 'fw-body': 'WeightBody', 'fw-semi': 'WeightSemi', 'fw-hero': 'WeightHero' };

const buyuk = (s) => s.replace(/(^|-)([a-z0-9])/g, (m, a, b) => b.toUpperCase());

function girdiler(T) {
  return Object.entries(T.label || {}).filter(([ad, e]) => ad !== '_' && e && typeof e === 'object');
}

function locale(T, dil) {
  const out = {};
  for (const [anahtar, ad, on] of ANAHTARLAR) {
    const e = T.label && T.label[ad];
    const v = e && e[on + dil];
    if (typeof v === 'string') out[anahtar] = v;
  }
  return out;
}

function css(T) {
  const satir = [];
  for (const [ad, e] of girdiler(T)) {
    if (e.ref) satir.push('  --tk-label-' + ad + '-color: var(--tk-' + e.ref + ');');
    if (e.fs) satir.push('  --tk-label-' + ad + '-fs: var(--tk-' + e.fs + ');');
    if (e.weight) satir.push('  --tk-label-' + ad + '-fw: var(--tk-' + e.weight + ');');
    if (e['accent-ref']) satir.push('  --tk-label-' + ad + '-accent: var(--tk-' + e['accent-ref'] + ');');
  }
  return satir.join('\n');
}

function xaml(T, renk, girinti) {
  const g = girinti || '    ';
  const satir = [];
  for (const [ad, e] of girdiler(T)) {
    const k = 'Label' + buyuk(ad);
    if (e.ref) satir.push(g + '<SolidColorBrush x:Key="' + k + 'Brush" Color="' + renk(e.ref) + '"/>');
    if (e['accent-ref']) satir.push(g + '<SolidColorBrush x:Key="' + k + 'AccentBrush" Color="' + renk(e['accent-ref']) + '"/>');
    if (e.fs) satir.push(g + '<sys:Double x:Key="' + k + 'Size">' + T.size[e.fs].value + '</sys:Double>');
    if (e.weight) satir.push(g + '<FontWeight x:Key="' + k + 'Weight">' + (T.size[e.weight].xaml || AGIRLIK[e.weight]) + '</FontWeight>');
  }
  return satir.join('\n');
}

module.exports = { ANAHTARLAR, DILLER, locale, css, xaml };
