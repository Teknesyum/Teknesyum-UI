'use strict';

const K = typeof window !== 'undefined' && window.Kontrast ? window.Kontrast : require('./kontrast');

const CAPA = [
  [1, 0],
  [3, 30],
  [4.5, 50],
  [7, 70],
  [12, 90],
  [18, 100],
];

const BUYUK = 7 / 4.5;

const NOTLAR = [
  [90, 'Mükemmel'],
  [70, 'İyi'],
  [50, 'Zayıf'],
  [0, 'Kötü'],
];

const PANELLER = [
  ['metin', 'Genel Metin', [
    ['Gövde yazısı', 'text', null, 10],
    ['Etiket ve alt başlık', 'text-label', null, 7],
    ['Bölüm başlığı', 'blue', null, 5, true],
    ['Kahraman başlık', 'blue', null, 2, true],
    ['Kod ve mono yazı', 'pink-text', null, 4],
    ['Uyarı yazısı', 'warning', null, 2],
    ['Tehlike yazısı', 'danger-text', null, 2],
  ]],
  ['dugme', 'Düğmeler', [
    ['Birincil düğme', 'on:blue', 'blue', 8],
    ['Hayalet düğme', 'text', null, 7],
    ['Hayalet düğme üstünde', 'on:purple-10', 'purple-10', 3],
    ['Tehlike düğmesi', 'on:danger-text', 'danger-text', 2],
    ['Simge düğmesi üstünde', 'pink-text', 'pink-10', 2],
    ['Pasif düğme', 'disabled', null, 1],
  ]],
  ['form', 'Form Alanları', [
    ['Giriş kutusu yazısı', 'text', 'surface', 8],
    ['Yer tutucu', 'text', 'surface', 4],
    ['Seçili yazı', 'text', 'border-decorative', 1],
    ['Hata iletisi', 'danger-text', null, 3],
    ['Pasif giriş', 'disabled', null, 1],
  ]],
  ['ust', 'Üst Çubuk', [
    ['Uygulama adı', 'text', 'surface', 6],
    ['Ad vurgusu', 'pink-text', 'surface', 3],
    ['Sekme', 'blue', 'surface', 8],
    ['Sekme üstünde', 'pink-text', 'surface', 2],
    ['Çip', 'blue', 'surface', 3],
    ['Destek çipi', 'purple-text', 'surface', 2],
    ['Pencere düğmesi üstünde', 'on:purple-30', 'purple-30', 1],
    ['Kapat düğmesi üstünde', 'on:danger-text', 'danger-text', 1],
    ['Pasif sekme', 'disabled', 'surface', 1],
  ]],
  ['rozet', 'Rozetler', [
    ['Senkron rozeti', 'text', null, 4],
    ['Eşitleniyor', 'text-label', null, 3],
    ['Eşitlendi', 'success', null, 3],
    ['Çevrimdışı', 'warning', null, 2],
    ['Yerel', 'disabled', null, 1],
    ['Güncelleme indir', 'warning', null, 2],
    ['Güncelleme kur', 'success', null, 2],
  ]],
  ['kurulum', 'Kurulum Paneli', [
    ['Adım cümlesi', 'text', 'surface', 5],
    ['Başlık vurgusu', 'pink-text', 'surface', 2],
    ['Alt yazı', 'disabled', 'surface', 3],
    ['Yüzde', 'blue', 'surface', 3],
    ['Günlük satırları', 'disabled', 'surface', 5],
    ['Son günlük satırı', 'blue', 'surface', 3],
    ['Bitti adımı', 'success', 'surface', 2],
    ['Hata adımı', 'danger-text', 'surface', 2],
  ]],
  ['ilerleme', 'İlerleme', [
    ['Adım yazısı', 'text', null, 4],
    ['Yüzde', 'blue', null, 3],
  ]],
  ['bildirim', 'Bildirimler', [
    ['Bildirim yazısı', 'text', 'panel', 5],
    ['Başarı başlığı', 'success', 'panel', 2],
    ['Uyarı başlığı', 'warning', 'panel', 2],
    ['Tehlike başlığı', 'danger-text', 'panel', 2],
    ['Kapat üstünde', 'blue', 'panel', 1],
  ]],
];

function coz(T, renk, ad) {
  if (renk && renk[ad]) return K.parse(renk[ad]);
  const e = (T.brand && T.brand[ad]) || (T.role && T.role[ad]);
  if (e && e.value) return K.parse(e.value);
  if (e && e.ref) {
    const c = coz(T, renk, e.ref);
    return e.alpha == null ? c : K.withAlpha(c, e.alpha);
  }
  const d = T.derived && T.derived[ad];
  if (d && d.ref) return K.withAlpha(coz(T, renk, d.ref), d.alpha == null ? 1 : d.alpha);
  const m = /^(.*)-(\d+)$/.exec(ad);
  if (m) {
    const olcek = [T.derived['tone-scale'], T.derived['text-scale']].find((s) => s && s.bases.includes(m[1]) && s.steps.includes(Number(m[2])));
    if (olcek) return K.withAlpha(coz(T, renk, m[1]), Number(m[2]) / 100);
  }
  throw new Error('Renk çözülemedi: ' + ad);
}

function zemin(T, renk) {
  return coz(T, renk, 'surface');
}

function olc(T, renk, dolgu, yazi) {
  return K.pair(dolgu, yazi, zemin(T, renk)).ratio;
}

function onSec(T, renk, ad) {
  const dolgu = coz(T, renk, ad);
  const tanim = T.on && T.on[ad];
  if (tanim && tanim.on) {
    const c = coz(T, renk, tanim.on);
    if (olc(T, renk, dolgu, c) >= K.THRESHOLD) return { ad: tanim.on, renk: c };
  }
  return ['black', 'text']
    .map((a) => ({ ad: a, renk: coz(T, renk, a) }))
    .reduce((x, y) => (olc(T, renk, dolgu, y.renk) > olc(T, renk, dolgu, x.renk) ? y : x));
}

function puan(oran) {
  if (!(oran > 1)) return 0;
  for (let i = 1; i < CAPA.length; i++) {
    const [o1, p1] = CAPA[i - 1];
    const [o2, p2] = CAPA[i];
    if (oran <= o2) return p1 + ((p2 - p1) * Math.log(oran / o1)) / Math.log(o2 / o1);
  }
  return 100;
}

function not(p) {
  return NOTLAR.find(([alt]) => p >= alt)[1];
}

function ortalama(ogeler) {
  const w = ogeler.reduce((t, o) => t + o.agirlik, 0);
  return w ? ogeler.reduce((t, o) => t + o.puan * o.agirlik, 0) / w : 0;
}

function skorla(T, renk) {
  const paneller = PANELLER.map(([id, ad, liste]) => {
    const ogeler = liste.map(([oAd, yazi, dolguAd, agirlik, buyuk]) => {
      const dolgu = dolguAd ? coz(T, renk, dolguAd) : null;
      const on = /^on:/.test(yazi) ? onSec(T, renk, yazi.slice(3)) : null;
      const yaziRenk = on ? on.renk : coz(T, renk, yazi);
      const oran = olc(T, renk, dolgu, yaziRenk);
      const p = puan(buyuk ? oran * BUYUK : oran);
      const cift = K.pair(dolgu, yaziRenk, zemin(T, renk));
      return { ad: oAd, yazi: on ? on.ad : yazi, dolgu: dolguAd || 'surface', agirlik, buyuk: !!buyuk, oran, puan: p, on: K.hex(cift.fg), arka: K.hex(cift.bg) };
    });
    return { id, ad, ogeler, agirlik: ogeler.reduce((t, o) => t + o.agirlik, 0), puan: ortalama(ogeler) };
  });
  const hepsi = paneller.flatMap((p) => p.ogeler);
  const genel = ortalama(hepsi);
  return { genel, not: not(genel), paneller, en_dusuk: hepsi.reduce((a, b) => (b.puan < a.puan ? b : a)) };
}

function yuvarla(p) {
  return Math.round(p);
}

function metin(S) {
  const satir = [];
  satir.push('Okunurluk Skoru: ' + yuvarla(S.genel) + ' / 100 (' + S.not + ')');
  for (const p of S.paneller) {
    satir.push('');
    satir.push(p.ad + ': ' + yuvarla(p.puan));
    for (const o of p.ogeler) satir.push('  ' + String(yuvarla(o.puan)).padStart(3) + '  ×' + String(o.agirlik).padEnd(3) + o.ad);
  }
  return satir.join('\n') + '\n';
}

module.exports = { CAPA, BUYUK, NOTLAR, PANELLER, coz, onSec, puan, not, skorla, metin };

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const dosya = process.argv[2] || path.join(__dirname, '..', 'templates', 'neon.tokens.json');
  process.stdout.write(metin(skorla(JSON.parse(fs.readFileSync(dosya, 'utf8')), {})));
}
