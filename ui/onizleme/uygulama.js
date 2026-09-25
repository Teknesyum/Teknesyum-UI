'use strict';

(function () {
  const K = window.Kontrast;

  const AD = {
    blue: 'Mavi',
    pink: 'Pembe',
    'pink-text': 'Pembe Yazı Kesimi',
    purple: 'Mor',
    'purple-text': 'Mor Yazı Kesimi',
    surface: 'Yüzey',
    black: 'Siyah',
    'glass-base': 'Cam Tabanı',
    text: 'Metin',
    success: 'Başarı',
    danger: 'Tehlike',
    'danger-text': 'Tehlike Yazısı',
    panel: 'Panel',
    glass: 'Cam',
  };

  const DUZENLENEN = ['blue', 'pink', 'pink-text', 'purple', 'purple-text', 'surface', 'black', 'glass-base'];
  const ACIK = ['blue', 'pink'];
  const TURETILIR = { 'pink-text': 'pink', 'purple-text': 'purple' };

  const ARKALAR = [
    ['duz', 'Düz Yüzey'],
    ['degrade', 'Token Degradesi'],
    ['cam', 'Cam Panel (Hale Üstünde)'],
    ['izgara', 'Izgara Deseni (Token Dışı)'],
    ['hale', 'Neon Hale (Token Dışı)'],
  ];

  const KAYDIRMA_RENK = [
    ['purple', 'Mor'],
    ['blue', 'Mavi'],
    ['pink', 'Pembe'],
    ['purple-text', 'Mor Yazı Kesimi'],
  ];

  let T = null;
  let ilk = null;
  let su = null;
  let kip = 'tek';
  let bekleyen = false;
  const hslBellek = {};

  const $ = (s, kok) => (kok || document).querySelector(s);
  const $$ = (s, kok) => Array.from((kok || document).querySelectorAll(s));
  const P = (h) => K.parse(h);
  const kopya = (o) => JSON.parse(JSON.stringify(o));

  function aileler() {
    const zincir = (f) => {
      const q = (s) => (f['css-quote'] ? "'" + s + "'" : s.includes(' ') ? "'" + s + "'" : s);
      return f.chain.map(q).join(', ') + ', ' + f['css-fallback'];
    };
    return {
      sans: ['Token Sans (' + T.font.sans.chain[0] + ')', zincir(T.font.sans), T.font.sans.chain],
      mono: ['Token Mono (' + T.font.mono.chain[0] + ')', zincir(T.font.mono), T.font.mono.chain],
      segoe: ['Segoe UI', "'Segoe UI', system-ui, sans-serif", ['Segoe UI']],
      sistem: ['Sistem Yazısı', 'system-ui, -apple-system, sans-serif', ['system-ui']],
      inter: ['Inter', "Inter, 'Segoe UI', system-ui, sans-serif", ['Inter', 'Segoe UI']],
      serif: ['Georgia (Serif)', 'Georgia, serif', ['Georgia']],
    };
  }

  function durumKur(t) {
    const renk = {};
    for (const [k, v] of Object.entries(t.brand)) if (v && v.value) renk[k] = v.value.toLocaleLowerCase('tr');
    for (const [k, v] of Object.entries(t.role)) if (v && v.value) renk[k] = v.value.toLocaleLowerCase('tr');
    return {
      renk,
      arka: { tur: 'degrade', durak: t.derived['bg-gradient'].stops, aci: 160, don: false },
      yazi: {
        aile: 'sans',
        carpan: 1,
        govde: t.size['fw-body'].value,
        yari: t.size['fw-semi'].value,
        kahraman: t.size['fw-hero'].value,
      },
      sekil: { r: t.shape.r.value, rPencere: t.shape['r-window'].value },
      kaydir: { kalinlik: t.metric['scrollbar-w'].value, renk: 'purple-text', davranis: 'auto' },
      hareketAz: true,
    };
  }

  function coz(st, ad) {
    if (st.renk[ad]) return st.renk[ad];
    const r = T.role[ad] || T.derived[ad] || T.brand[ad];
    if (r && r.ref) return coz(st, r.ref);
    return null;
  }

  function rgba(hex, a) {
    const c = P(hex);
    return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + Math.round(a * 1000) / 1000 + ')';
  }

  function zemin(st) {
    return P(coz(st, 'surface'));
  }

  function oran(st, dolguHex, alfa, yaziHex) {
    return K.pair(K.withAlpha(P(dolguHex), alfa), P(yaziHex), zemin(st)).ratio;
  }

  function bilesik(st, dolguHex, alfa) {
    return K.hex(K.over(K.withAlpha(P(dolguHex), alfa), zemin(st)));
  }

  function yaziOlarak(st, hex, alfa) {
    const z = zemin(st);
    return K.ratio(K.over(K.withAlpha(P(hex), alfa == null ? 1 : alfa), z), z);
  }

  function enIyi(st, dolguHex, alfa) {
    const aday = [
      ['black', coz(st, 'black')],
      ['text', coz(st, 'text')],
    ].map(([ad, hex]) => ({ ad, hex, oran: oran(st, dolguHex, alfa, hex) }));
    return aday[0].oran >= aday[1].oran ? aday[0] : aday[1];
  }

  function dolgu(st, anahtar) {
    const m = /^(.*)-(\d+)$/.exec(anahtar);
    if (m && T.derived['tone-scale'].bases.includes(m[1])) return { hex: coz(st, m[1]), alfa: Number(m[2]) / 100 };
    const d = T.derived[anahtar];
    if (d && d.ref) return { hex: coz(st, d.ref), alfa: d.alpha == null ? 1 : d.alpha };
    return { hex: coz(st, anahtar), alfa: 1 };
  }

  function onRenk(st, anahtar) {
    const tanim = T.on[anahtar];
    if (tanim && tanim.on) return coz(st, tanim.on);
    const d = dolgu(st, anahtar);
    return d.hex ? enIyi(st, d.hex, d.alfa).hex : coz(st, 'text');
  }

  function hsl(hex) {
    const c = P(hex);
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    let h = 0;
    let s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 1000) / 10 };
  }

  function hslHex(h, s, l) {
    return K.hex(P('hsl(' + h + ', ' + s + '%, ' + l + '%)'));
  }

  function degrade(st, aci) {
    const a = P(coz(st, 'black'));
    const b = P(coz(st, 'surface'));
    const n = Math.max(2, st.arka.durak);
    const duraklar = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const c = { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
      duraklar.push(K.hex(c) + ' ' + Math.round(t * 1000) / 10 + '%');
    }
    return 'linear-gradient(' + aci + ', ' + duraklar.join(', ') + ')';
  }

  function hale(st) {
    return (
      'radial-gradient(circle at 15% 10%, ' + rgba(coz(st, 'blue'), 0.18) + ', transparent 45%), ' +
      'radial-gradient(circle at 85% 30%, ' + rgba(coz(st, 'pink'), 0.14) + ', transparent 45%), ' +
      'radial-gradient(circle at 50% 90%, ' + rgba(coz(st, 'purple'), 0.14) + ', transparent 50%)'
    );
  }

  function arkaPlan(st) {
    const don = st.arka.don && !st.hareketAz && st.arka.tur !== 'duz';
    const aci = don ? 'var(--tk-bg-angle)' : st.arka.aci + 'deg';
    const g = degrade(st, aci);
    const cizgi = rgba(coz(st, 'blue'), 0.08);
    switch (st.arka.tur) {
      case 'duz':
        return { deger: coz(st, 'surface'), don: false };
      case 'cam':
      case 'hale':
        return { deger: hale(st) + ', ' + g, don };
      case 'izgara':
        return {
          deger:
            'linear-gradient(' + cizgi + ' 1px, transparent 1px) 0 0 / 32px 32px, ' +
            'linear-gradient(90deg, ' + cizgi + ' 1px, transparent 1px) 0 0 / 32px 32px, ' + g,
          don,
        };
      default:
        return { deger: g, don };
    }
  }

  function degiskenler(st) {
    const v = {};
    const R = (ad) => coz(st, ad);
    const A = aileler();
    for (const ad of ['blue', 'pink', 'purple', 'pink-text', 'purple-text', 'surface', 'black', 'text', 'disabled', 'success', 'warning'])
      v['--tk-' + ad] = R(ad);
    v['--tk-danger'] = R('danger');
    v['--tk-danger-text'] = R('danger-text');
    v['--tk-text-label'] = R('text-label');
    v['--tk-warning-border'] = rgba(R('warning'), T.role['warning-border'].alpha);
    for (const b of ['blue', 'pink', 'purple'])
      for (const a of [10, 20, 30, 50, 60, 80]) v['--tk-' + b + '-' + a] = rgba(R(b), a / 100);
    for (const b of T.derived['text-scale'].bases)
      for (const a of T.derived['text-scale'].steps) v['--tk-' + b + '-' + a] = rgba(R(b), a / 100);
    v['--tk-panel'] = rgba(R('surface'), T.derived.panel.alpha);
    v['--tk-glass'] = rgba(R('glass-base'), T.derived.glass.alpha);
    for (const k of ['border', 'border-strong', 'border-decorative']) v['--tk-' + k] = rgba(R(T.derived[k].ref), T.derived[k].alpha);
    for (const b of T.derived.glow.bases)
      v['--tk-glow-' + b] = '0 0 ' + T.derived.glow.blur + 'px ' + rgba(R(b), T.derived.glow.alpha);
    const gb = T.derived['glow-button'];
    v['--tk-glow-button'] = '0 0 ' + gb.blur + 'px ' + rgba(R(gb.ref), gb.alpha);
    const gh = T.derived['glow-hero'];
    v['--tk-glow-hero'] = '0 0 ' + gh.blur + 'px ' + rgba(R(gh.ref), gh.alpha);
    const sp = T.derived['shadow-panel'];
    v['--tk-shadow-panel'] = '0 0 ' + sp.blur + 'px ' + rgba(R(sp.ref), sp.alpha);
    for (const k of Object.keys(T.on)) if (k !== '_') v['--tk-on-' + k] = onRenk(st, k);
    v['--tk-font'] = (A[st.yazi.aile] || A.sans)[1];
    v['--tk-font-mono'] = A.mono[1];
    for (let n = 1; n <= 5; n++) v['--tk-fs-' + n] = Math.round(T.size['fs-' + n].value * st.yazi.carpan) + 'px';
    v['--tk-fw-body'] = String(st.yazi.govde);
    v['--tk-fw-semi'] = String(st.yazi.yari);
    v['--tk-fw-hero'] = String(st.yazi.kahraman);
    for (const k of ['lh-body', 'lh-heading', 'lh-mono']) v['--tk-' + k] = String(T.size[k].value);
    for (const k of ['tr-label', 'tr-h3', 'tr-h2', 'tr-hero']) v['--tk-' + k] = T.size[k].value + T.size[k].unit;
    v['--tk-measure'] = T.size.measure.value + T.size.measure.unit;
    for (const k of ['1', '2', '3', '4', '5']) v['--tk-sp-' + k] = T.space[k].value + 'px';
    v['--tk-r'] = st.sekil.r + 'px';
    v['--tk-r-window'] = st.sekil.rPencere + 'px';
    v['--tk-focus-w'] = T.shape['focus-w'].value + 'px';
    v['--tk-focus-offset'] = T.shape['focus-offset'].value + 'px';
    v['--tk-target-min'] = T.metric['target-min'].value + 'px';
    v['--tk-input-h'] = T.metric['input-h'].value + 'px';
    v['--tk-titlebar-h'] = T.metric['titlebar-h-max'].value + 'px';
    v['--tk-scrollbar-w'] = st.kaydir.kalinlik + 'px';
    v['--tk-thumb'] = R(st.kaydir.renk);
    v['--tk-thumb-hover'] = R(st.kaydir.renk === 'pink' ? 'blue' : 'pink');
    v['--tk-track'] = rgba(R('black'), 0.3);
    v['--tk-scroll-behavior'] = st.hareketAz ? 'auto' : st.kaydir.davranis;
    v['--tk-t-instant'] = T.duration.instant.ms + 'ms';
    v['--tk-bg-rotate'] = T.duration['bg-rotate'].ms + 'ms';
    v['--tk-e-out'] = 'cubic-bezier(' + T.easing.out.bezier.join(', ') + ')';
    v['--tk-e-linear'] = 'linear';
    v['--tk-bg'] = degrade(st, '160deg');
    v['--tk-bg-demo'] = hale(st) + ', ' + degrade(st, '160deg');
    return v;
  }

  function uygula(el, st, arkaDa) {
    const v = degiskenler(st);
    for (const [k, d] of Object.entries(v)) el.style.setProperty(k, d);
    if (arkaDa) {
      const a = arkaPlan(st);
      el.style.background = a.deger;
      el.dataset.zeminDon = a.don ? '1' : '0';
      el.dataset.arka = st.arka.tur;
    }
    if (st.hareketAz) el.dataset.hareket = 'az';
    else delete el.dataset.hareket;
  }

  function oranEtiket(r, secenek) {
    const o = secenek || {};
    const esik = o.esik || K.THRESHOLD;
    if (o.muaf)
      return '<span class="oran oran-muaf" title="Edilgen renk 7:1 eşiğinden muaftır">' + K.fmt(r) + ':1 · Muaf</span>';
    const kotu = r < esik;
    return (
      '<span class="oran' + (kotu ? ' oran-kotu' : '') + '"' + (kotu ? ' title="' + esik + ':1 eşiğinin altında"' : '') + '>' +
      (kotu ? '✕ ' : '') + K.fmt(r) + ':1' + (kotu ? ' · ' + esik + ':1 Altı' : '') + '</span>'
    );
  }

  function adi(ad) {
    return AD[ad] || ad;
  }

  function kare(st, secenek) {
    const { baslik, hex, alfa, anahtar, yaziKontrol } = secenek;
    const tanim = anahtar ? T.on[anahtar] : null;
    const bil = alfa < 1 ? bilesik(st, hex, alfa) : hex;
    let yazi;
    let r;
    let not;
    if (tanim && tanim.on) {
      yazi = coz(st, tanim.on);
      r = oran(st, hex, alfa, yazi);
      not = 'Üstünde ' + adi(tanim.on);
    } else {
      const e = enIyi(st, hex, alfa);
      yazi = e.hex;
      r = e.oran;
      not = tanim ? 'Yazı Taşımaz · En İyi ' + adi(e.ad) : 'En İyi Yazı: ' + adi(e.ad);
    }
    const yo = yaziKontrol ? yaziOlarak(st, hex, alfa) : null;
    const kotu = (tanim && tanim.on && r < K.THRESHOLD) || (yo !== null && yo < K.THRESHOLD);
    return (
      '<figure class="kare' + (kotu ? ' kare-kotu' : '') + '">' +
      '<div class="kare-renk" style="background: ' + rgba(hex, alfa) + '; color: ' + yazi + '">Aa 12</div>' +
      '<figcaption>' +
      '<span class="kare-ad">' + baslik + '</span>' +
      '<code>' + bil + (alfa < 1 ? ' · %' + Math.round(alfa * 100) : '') + '</code>' +
      '<span class="kare-not">' + not + '</span>' + oranEtiket(r, tanim && !tanim.on ? { esik: K.THRESHOLD } : null) +
      (yo !== null ? '<span class="kare-not">Yüzeyde Yazı Olarak</span>' + oranEtiket(yo) : '') +
      '</figcaption></figure>'
    );
  }

  function tonlar(st, taban) {
    const hex = coz(st, taban);
    const parca = [kare(st, { baslik: adi(taban) + ' 100', hex, alfa: 1, anahtar: taban, yaziKontrol: true })];
    for (const s of T.derived['tone-scale'].steps)
      parca.push(kare(st, { baslik: adi(taban) + ' ' + s, hex, alfa: s / 100, anahtar: taban + '-' + s }));
    return parca.join('');
  }

  function yaziTonlari(st) {
    const out = [];
    for (const b of T.derived['text-scale'].bases) {
      const hex = coz(st, b);
      out.push(kare(st, { baslik: adi(b), hex, alfa: 1, anahtar: T.on[b] ? b : null, yaziKontrol: true }));
      for (const s of T.derived['text-scale'].steps)
        out.push(kare(st, { baslik: adi(b) + ' ' + s, hex, alfa: s / 100, anahtar: null, yaziKontrol: true }));
    }
    return out.join('');
  }

  function rampa(st, taban) {
    const h = hsl(coz(st, taban));
    const out = [];
    for (let l = 10; l <= 90; l += 10)
      out.push(kare(st, { baslik: 'Açıklık ' + l, hex: hslHex(h.h, h.s, l), alfa: 1, anahtar: null, yaziKontrol: true }));
    return out.join('');
  }

  function onlar(st) {
    const out = [];
    for (const k of Object.keys(T.on)) {
      if (k === '_' || /-\d+$/.test(k)) continue;
      const d = dolgu(st, k);
      if (!d.hex) continue;
      out.push(kare(st, { baslik: adi(k), hex: d.hex, alfa: d.alfa, anahtar: k }));
    }
    return out.join('');
  }

  function tonBolumu(st, on) {
    const bas = (b) => '<h3>' + adi(b) + ' · Ton Kademeleri</h3><div class="kareler">' + tonlar(st, b) + '</div>';
    return (
      '<section class="bolum" id="' + on + '-tonlar"><h2>Tonlar</h2>' +
      '<p>Her kare yüzey (' + coz(st, 'surface') + ') üstünde ölçülür. Kesik kenarlı ve ✕ işaretli kareler 7:1 eşiğinin altındadır.</p>' +
      bas('blue') + bas('pink') + bas('purple') +
      '<h3>Yazı Kesimleri · Text Scale</h3><div class="kareler">' + yaziTonlari(st) + '</div>' +
      '<h3>Mavi · Açıklık Rampası (Aynı Ton Ve Doygunluk)</h3><div class="kareler">' + rampa(st, 'blue') + '</div>' +
      '<h3>Pembe · Açıklık Rampası (Aynı Ton Ve Doygunluk)</h3><div class="kareler">' + rampa(st, 'pink') + '</div>' +
      '<h3>On Eşleri · Dolgu Ve Üstündeki Yazı</h3><div class="kareler">' + onlar(st) + '</div>' +
      '</section>'
    );
  }

  function yanBolumu(st, on) {
    const taraf = (b, yaziAd) => {
      const hex = coz(st, b);
      const yazi = coz(st, yaziAd);
      const onk = T.on[b] && T.on[b].on ? coz(st, T.on[b].on) : enIyi(st, hex, 1).hex;
      const h = hsl(hex);
      const serit = T.derived['tone-scale'].steps
        .slice()
        .reverse()
        .map((s) => '<span style="background: ' + rgba(hex, s / 100) + '"></span>')
        .join('');
      return (
        '<div class="yan">' +
        '<p class="yan-baslik" style="color: ' + yazi + '">' + adi(b) + '</p>' +
        '<code>' + hex + ' · H ' + h.h + ' S ' + h.s + ' L ' + h.l + '</code>' +
        '<span class="kare-not">Başlık Olarak (' + adi(yaziAd) + ')</span>' + oranEtiket(yaziOlarak(st, yazi)) +
        '<div class="kare-renk" style="background: ' + hex + '; color: ' + onk + '; border-radius: var(--tk-r)">Dolgu Üstünde Yazı</div>' +
        oranEtiket(oran(st, hex, 1, onk)) +
        '<div class="serit" aria-hidden="true"><span style="background: ' + hex + '"></span>' + serit + '</div>' +
        '<div class="hale-ornek" style="box-shadow: 0 0 ' + T.derived.glow.blur + 'px ' + rgba(hex, T.derived.glow.alpha) + '; border-color: ' + rgba(hex, 0.5) + '"></div>' +
        '<span class="kare-not">Kenarlık %50 · Eşik 3:1</span>' + oranEtiket(yaziOlarak(st, hex, 0.5), { esik: 3 }) +
        '</div>'
      );
    };
    const satir = (ad, a, b, secenek) => '<tr><th scope="row">' + ad + '</th><td>' + oranEtiket(a, secenek) + '</td><td>' + oranEtiket(b, secenek) + '</td></tr>';
    const B = coz(st, 'blue');
    const Pk = coz(st, 'pink');
    return (
      '<section class="bolum" id="' + on + '-yanyana"><h2>Mavi Ve Pembe Yan Yana</h2>' +
      '<div class="yanyana">' + taraf('blue', 'blue') + taraf('pink', 'pink-text') + '</div>' +
      '<h3>Oran Tablosu</h3><div class="tablo-kap"><table><thead><tr><th scope="col">Ölçü</th><th scope="col">Mavi</th><th scope="col">Pembe</th></tr></thead><tbody>' +
      satir('Dolgu Yazı Olarak', yaziOlarak(st, B), yaziOlarak(st, Pk)) +
      satir('Siyah Dolgu Üstünde', oran(st, B, 1, coz(st, 'black')), oran(st, Pk, 1, coz(st, 'black'))) +
      satir('Metin %10 Üstünde', oran(st, B, 0.1, coz(st, 'text')), oran(st, Pk, 0.1, coz(st, 'text'))) +
      satir('Metin %30 Üstünde', oran(st, B, 0.3, coz(st, 'text')), oran(st, Pk, 0.3, coz(st, 'text'))) +
      satir('Metin %60 Üstünde', oran(st, B, 0.6, coz(st, 'text')), oran(st, Pk, 0.6, coz(st, 'text'))) +
      satir('Kenarlık %50', yaziOlarak(st, B, 0.5), yaziOlarak(st, Pk, 0.5), { esik: 3 }) +
      '</tbody></table></div></section>'
    );
  }

  function dugmeBolumu(st, on) {
    const R = (a) => coz(st, a);
    const tur = [
      ['birincil', 'Birincil', [R('blue'), 1, R('black')], [R('blue'), 0.8, R('black')]],
      ['ikincil', 'İkincil', [R('pink'), 0.1, R('pink-text')], [R('pink'), 0.2, R('text')]],
      ['hayalet', 'Hayalet', [R('purple'), 0.1, R('purple-text')], [R('purple'), 0.2, R('text')]],
      ['tehlike', 'Tehlike', [R('danger-text'), 1, onRenk(st, 'danger-text')], [R('danger-text'), 1, onRenk(st, 'danger-text')]],
    ];
    const durumlar = ['Canlı', 'Dinlenik', 'Üzerinde', 'Basılı', 'Odak', 'Edilgen'];
    let h = '<div class="izgara-bas"></div>' + durumlar.map((d) => '<div class="izgara-bas">' + d + '</div>').join('');
    for (const [sinif, ad, dinlenik, uzerinde] of tur) {
      const r0 = oran(st, dinlenik[0], dinlenik[1], dinlenik[2]);
      const r1 = oran(st, uzerinde[0], uzerinde[1], uzerinde[2]);
      const rd = yaziOlarak(st, R('disabled'));
      const hucre = (r, ek, secenek, attr) =>
        '<div class="hucre">' + oranEtiket(r, secenek) + '<button type="button" class="btn btn-' + sinif + ek + '"' + (attr || '') + '>' + ad + '</button></div>';
      h +=
        '<div class="izgara-bas">' + ad + '</div>' +
        hucre(r0, '', null, ' title="Üzerine gel, bas, sekmeyle odakla"') +
        hucre(r0, ' s-dinlenik', null, ' tabindex="-1"') +
        hucre(r1, ' s-uzerinde', null, ' tabindex="-1"') +
        hucre(r0, ' s-basili', null, ' tabindex="-1"') +
        hucre(r0, ' s-odak', null, ' tabindex="-1"') +
        hucre(rd, '', { muaf: true }, ' disabled title="Edilgen: işlem şu an yapılamaz"');
    }
    return (
      '<section class="bolum" id="' + on + '-dugmeler"><h2>Düğmeler</h2>' +
      '<p>İlk sütun canlıdır: üzerine gelin, basın, Tab ile odaklayın. Diğer sütunlar durumları sabit gösterir. İkincil düğme standartta tanımlı değildir; pembe dolgu yazı taşımadığı için %10 dolgu ve pembe yazı kesimiyle önerilmiştir.</p>' +
      '<div class="dugme-izgara">' + h + '</div></section>'
    );
  }

  function bilesenBolumu(st, on) {
    const R = (a) => coz(st, a);
    const blok = (ad, ic) => '<div class="bilesen"><p class="bilesen-ad">' + ad + '</p>' + ic + '</div>';
    const panelHex = bilesik(st, R('surface'), T.derived.panel.alpha);
    const camHex = bilesik(st, R('glass-base'), T.derived.glass.alpha);
    const satirlar = [
      ['Gelen Kutusu', '128'],
      ['Taslaklar', '4'],
      ['Gönderilenler', '1 024'],
      ['Arşiv', '9 870'],
    ]
      .map(
        ([a, d], i) =>
          '<li role="option" aria-selected="' + (i === 1) + '"><span>' + a + '</span><span class="deger">' + d + '</span></li>'
      )
      .join('');
    const uzun = [];
    for (let i = 1; i <= 60; i++)
      uzun.push('<li><span>Kayıt ' + String(i).padStart(2, '0') + ' · Örnek Satır</span><span class="deger">' + (i * 37) % 1000 + '</span></li>');
    return (
      '<section class="bolum" id="' + on + '-bilesenler"><h2>Bileşenler</h2><div class="bilesenler">' +
      blok(
        'Rozet',
        '<div class="satir"><span class="rozet rozet-mavi">7</span>' + oranEtiket(oran(st, R('blue'), 1, onRenk(st, 'blue'))) + '</div>' +
          '<div class="satir"><span class="rozet rozet-basari">12</span>' + oranEtiket(oran(st, R('success'), 1, onRenk(st, 'success'))) + '</div>' +
          '<div class="satir"><span class="rozet rozet-tehlike">3</span>' + oranEtiket(oran(st, R('danger-text'), 1, onRenk(st, 'danger-text'))) + '</div>'
      ) +
      blok(
        'Çip',
        '<div class="satir"><span class="cip cip-mavi">Mavi Çip</span>' + oranEtiket(oran(st, R('blue'), 0.1, R('text'))) + '</div>' +
          '<div class="satir"><span class="cip cip-pembe">Pembe Çip</span>' + oranEtiket(oran(st, R('pink'), 0.1, R('text'))) + '</div>' +
          '<div class="satir"><span class="cip cip-mor">Mor Çip</span>' + oranEtiket(oran(st, R('purple'), 0.1, R('text'))) + '</div>'
      ) +
      blok(
        'Giriş Kutusu',
        '<label class="ornek-etiket" for="' + on + '-ad">Proje Adı</label>' + oranEtiket(yaziOlarak(st, R('text-label'))) +
          '<input class="ornek-giris" id="' + on + '-ad" value="Teknesyum">' + oranEtiket(yaziOlarak(st, R('text'))) +
          '<label class="ornek-etiket" for="' + on + '-ep">E-Posta</label>' +
          '<input class="ornek-giris" id="' + on + '-ep" value="adres@" aria-invalid="true" aria-describedby="' + on + '-ep-h">' +
          '<span class="hata-yazi" id="' + on + '-ep-h">Geçerli bir adres yazın.</span>' + oranEtiket(yaziOlarak(st, R('danger-text')))
      ) +
      blok('Seçili Liste Satırı', oranEtiket(oran(st, R('blue'), 0.2, R('text'))) + '<ul class="liste" role="listbox" aria-label="Klasörler">' + satirlar + '</ul>') +
      blok(
        'Başlık Çubuğu',
        oranEtiket(K.pair(K.withAlpha(P(R('glass-base')), T.derived.glass.alpha), P(R('text')), zemin(st)).ratio) +
          '<div><div class="baslik-cubugu"><strong>Teknesyum · Pencere</strong><div class="pencere-dugmeler">' +
          '<button type="button" class="pencere-dugme" aria-label="Küçült" title="Küçült">–</button>' +
          '<button type="button" class="pencere-dugme" aria-label="Büyüt" title="Büyüt">□</button>' +
          '<button type="button" class="pencere-dugme pencere-kapat" aria-label="Kapat" title="Kapat">✕</button>' +
          '</div></div><div class="pencere-govde">Pencere gövdesi, panel yüzeyi.</div></div>'
      ) +
      blok(
        'İlerleme Çubuğu',
        '<div class="satir"><span class="mono">%64</span>' + oranEtiket(yaziOlarak(st, R('blue')), null) + '</div>' +
          '<div class="ilerleme" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100" aria-label="Mavi ilerleme"><span style="width: 64%"></span></div>' +
          '<span class="kare-not">Dolgu / İz · Eşik 3:1</span>' + oranEtiket(K.ratio(P(R('blue')), P(bilesik(st, R('blue'), 0.1))), { esik: 3 }) +
          '<div class="ilerleme ilerleme-pembe" role="progressbar" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100" aria-label="Pembe ilerleme"><span style="width: 38%"></span></div>' +
          oranEtiket(K.ratio(P(R('pink')), P(bilesik(st, R('blue'), 0.1))), { esik: 3 })
      ) +
      '</div>' +
      '<h3>Uzun Kayan Liste</h3>' +
      '<div class="kaydirma-arac"><button type="button" class="btn btn-hayalet" data-kaydir="son" data-hedef="' + on + '-uzun">Sona Kaydır</button>' +
      '<button type="button" class="btn btn-hayalet" data-kaydir="bas" data-hedef="' + on + '-uzun">Başa Kaydır</button></div>' +
      '<ul class="uzun-liste" id="' + on + '-uzun" tabindex="0" aria-label="Uzun liste">' + uzun.join('') + '</ul>' +
      '<p class="kare-not">Panel ' + panelHex + ' · Cam ' + camHex + '</p>' +
      '</section>'
    );
  }

  function tipoBolumu(st, on) {
    const R = (a) => coz(st, a);
    const px = (n) => Math.round(T.size['fs-' + n].value * st.yazi.carpan);
    const satir = (etiket, olcu, ornek, r) =>
      '<div class="tipo-satir"><div><div class="t-etiket">' + etiket + '</div><div class="tipo-olcu">' + olcu + '</div>' + (r || '') + '</div><div>' + ornek + '</div></div>';
    const uyari = px(1) < 14 ? '<p class="t-uyari">Uyarı: fs-1 ' + px(1) + ' px, 14 px tabanının altında.</p>' : '';
    return (
      '<section class="bolum" id="' + on + '-tipografi"><h2>Tipografi Ölçeği</h2>' + uyari +
      '<div class="tipo">' +
      satir('fs-5 · Kahraman', px(5) + ' px · ' + st.yazi.kahraman, '<span class="t-hero">1 248,50</span>', oranEtiket(yaziOlarak(st, R('blue')))) +
      satir('fs-4 · h2', px(4) + ' px · ' + st.yazi.yari, '<span class="t-h2">Bölüm Başlığı</span>', oranEtiket(yaziOlarak(st, R('blue')))) +
      satir('fs-3 · h3', px(3) + ' px · ' + st.yazi.yari, '<span class="t-h3">Alt Başlık</span>', oranEtiket(yaziOlarak(st, R('text-label')))) +
      satir('fs-2 · Gövde', px(2) + ' px · ' + st.yazi.govde, '<span class="t-govde">Arayüz metni okunaklı kalır; ikincil yazı için gri değil, silmek gerekir.</span>', oranEtiket(yaziOlarak(st, R('text')))) +
      satir('fs-2 · Mono', px(2) + ' px · ' + st.yazi.yari, '<span class="t-mono">0x00F3FF · 12:45:09</span>', oranEtiket(yaziOlarak(st, R('pink-text')))) +
      satir('fs-1 · Etiket', px(1) + ' px · ' + st.yazi.yari, '<span class="t-etiket">ETİKET METNİ</span>', oranEtiket(yaziOlarak(st, R('text-label')))) +
      satir('fs-1 · İpucu', px(1) + ' px · ' + st.yazi.govde, '<span class="t-ipucu">Kısa yardım metni, gövdeden küçük.</span>', oranEtiket(yaziOlarak(st, R('text')))) +
      satir('fs-2 · Hata', px(2) + ' px', '<span class="t-hata">Dosya kaydedilemedi.</span>', oranEtiket(yaziOlarak(st, R('danger-text')))) +
      satir('fs-2 · Uyarı', px(2) + ' px', '<span class="t-uyari">Disk alanı azalıyor.</span>', oranEtiket(yaziOlarak(st, R('warning')))) +
      '</div></section>'
    );
  }

  function yuzeyBolumu(st, on) {
    const R = (a) => coz(st, a);
    const panelR = K.pair(K.withAlpha(P(R('surface')), T.derived.panel.alpha), P(R('text')), zemin(st)).ratio;
    const camR = K.pair(K.withAlpha(P(R('glass-base')), T.derived.glass.alpha), P(R('text')), zemin(st)).ratio;
    const u = (ad, sinif, r, metin) =>
      '<div class="yuzey-arka"><div class="' + sinif + '"><span class="y-ad">' + ad + '</span>' + oranEtiket(r) + '<p>' + metin + '</p></div></div>';
    return (
      '<section class="bolum" id="' + on + '-yuzeyler"><h2>Kart, Panel Ve Cam</h2><div class="yuzeyler">' +
      u('Panel', 'y-panel', panelR, 'Yüzey %95, kenarlık mavi %50, gölge.') +
      u('Cam', 'y-cam', camR, 'Cam tabanı %85 ve bulanıklık; arkadaki hale görünür.') +
      u('Kart', 'y-kart', yaziOlarak(st, R('text')), 'Düz yüzey, dekoratif kenarlık.') +
      u('Uyarı Yüzeyi', 'y-uyari', yaziOlarak(st, R('warning')), 'Dolgu yok; kenarlık ve yazı uyarı rengi.') +
      '</div></section>'
    );
  }

  function icerik(st, on) {
    return tonBolumu(st, on) + yanBolumu(st, on) + dugmeBolumu(st, on) + bilesenBolumu(st, on) + tipoBolumu(st, on) + yuzeyBolumu(st, on);
  }

  function gezinti(on) {
    const b = [
      ['tonlar', 'Tonlar'],
      ['yanyana', 'Yan Yana'],
      ['dugmeler', 'Düğmeler'],
      ['bilesenler', 'Bileşenler'],
      ['tipografi', 'Tipografi'],
      ['yuzeyler', 'Yüzeyler'],
    ];
    return '<nav class="gezinti" aria-label="Bölümler">' + b.map(([id, ad]) => '<a href="#' + on + '-' + id + '">' + ad + '</a>').join('') + '</nav>';
  }

  function farkListesi() {
    const f = farklar();
    const li = f.length ? f.map((x) => '<li>' + x + '</li>').join('') : '<li>Henüz değişiklik yok.</li>';
    return '<div class="farklar"><strong>Değişenler</strong><ul>' + li + '</ul></div>';
  }

  function ciz() {
    bekleyen = false;
    const kok = $('#onizleme');
    const kaydirma = kok.scrollTop;
    uygula(kok, su, true);
    if (kip === 'karsi') {
      kok.innerHTML =
        gezinti('s') + farkListesi() +
        '<div class="karsi"><section class="sahne" id="sahne-once" aria-label="Önce"><h2 class="sahne-baslik">Önce · Token Dosyası</h2>' + icerik(ilk, 'o') + '</section>' +
        '<section class="sahne" id="sahne-sonra" aria-label="Sonra"><h2 class="sahne-baslik">Sonra · Şu Anki Ayar</h2>' + icerik(su, 's') + '</section></div>';
      uygula($('#sahne-once'), ilk, true);
      uygula($('#sahne-sonra'), su, true);
    } else {
      kok.innerHTML = gezinti('s') + icerik(su, 's');
    }
    kok.scrollTop = kaydirma;
  }

  function planla() {
    if (bekleyen) return;
    bekleyen = true;
    requestAnimationFrame(ciz);
  }

  function renkDenetimi(ad) {
    const acik = ACIK.includes(ad) ? ' open' : '';
    const etiket = ad === 'black' ? 'Siyah (Degrade Başı)' : adi(ad);
    const kaydirici = (k, ust, etiket) =>
      '<label class="alan"><span class="alan-ust">' + etiket + ' <output id="o-' + k + '-' + ad + '"></output></span>' +
      '<input type="range" min="0" max="' + ust + '" step="' + (k === 'h' ? 1 : 0.5) + '" data-renk="' + ad + '" data-alan="' + k + '" aria-label="' + adi(ad) + ' ' + etiket + '"></label>';
    const tur = TURETILIR[ad]
      ? '<button type="button" class="arac-dugme" data-turet="' + ad + '">' + adi(TURETILIR[ad]) + ' Dolgusundan Türet (7:1)</button>'
      : '';
    return (
      '<details class="grup"' + acik + '><summary><span><span class="nokta" data-nokta="' + ad + '"></span>' + etiket + '</span><code data-hexgoster="' + ad + '"></code></summary>' +
      '<div class="grup-ic">' +
      '<div class="satir"><input type="color" class="secici" data-renk="' + ad + '" data-alan="secici" aria-label="' + adi(ad) + ' Renk Seçici">' +
      '<input type="text" class="giris hex" data-renk="' + ad + '" data-alan="hex" maxlength="7" spellcheck="false" aria-label="' + adi(ad) + ' Hex">' +
      '<button type="button" class="arac-dugme" data-geri="' + ad + '">Geri Al</button></div>' +
      kaydirici('h', 360, 'Ton (H)') + kaydirici('s', 100, 'Doygunluk (S)') + kaydirici('l', 100, 'Açıklık (L)') + tur +
      '</div></details>'
    );
  }

  function aralik(id, etiket, min, max, adim) {
    return (
      '<label class="alan"><span class="alan-ust">' + etiket + ' <output id="o-' + id + '"></output></span>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + adim + '"></label>'
    );
  }

  function secim(id, etiket, secenekler) {
    return (
      '<label class="alan"><span class="alan-ust">' + etiket + '</span><select class="giris" id="' + id + '">' +
      secenekler.map(([d, a]) => '<option value="' + d + '">' + a + '</option>').join('') + '</select></label>'
    );
  }

  function formKur() {
    const A = aileler();
    const f = $('#ayarlar');
    const grup = (baslik, ic, acik) => '<details class="grup"' + (acik ? ' open' : '') + '><summary>' + baslik + '</summary><div class="grup-ic">' + ic + '</div></details>';
    f.innerHTML =
      DUZENLENEN.map(renkDenetimi).join('') +
      grup(
        'Arka Plan',
        secim('arka-tur', 'Tasarım', ARKALAR) +
          aralik('arka-durak', 'Degrade Durakları', 2, 32, 1) +
          aralik('arka-aci', 'Açı (Derece)', 0, 360, 1) +
          '<label class="secim"><input type="checkbox" id="arka-don"> Arka Plan Salınsın (150–170°, 48 sn)</label>' +
          '<p class="ipucu">Degrade başı Siyah, sonu Yüzey rengidir; ikisini yukarıdan ayarlayın.</p>',
        true
      ) +
      grup(
        'Yazı',
        secim('yazi-aile', 'Yazı Ailesi', Object.entries(A).map(([k, v]) => [k, v[0]])) +
          aralik('yazi-carpan', 'Boyut Çarpanı', 0.8, 1.4, 0.05) +
          '<p class="ipucu mono" id="yazi-olcek"></p>' +
          secim('yazi-govde', 'Gövde Ağırlığı', [[300, '300'], [400, '400'], [500, '500']]) +
          secim('yazi-yari', 'Başlık / Etiket Ağırlığı', [[500, '500'], [600, '600'], [700, '700']]) +
          secim('yazi-kahraman', 'Kahraman Ağırlığı', [[700, '700'], [800, '800'], [900, '900']]) +
          '<p class="ipucu uyari" id="yazi-uyari" hidden>Standart 700 ağırlığı yalnız kahraman için tanır.</p>'
      ) +
      grup('Köşe Yarıçapı', aralik('sekil-r', 'Yarıçap (r)', 0, 20, 1) + aralik('sekil-rp', 'Pencere Yarıçapı', 0, 24, 1)) +
      grup(
        'Kaydırma',
        aralik('kay-kalinlik', 'Çubuk Kalınlığı (px)', 4, 20, 1) +
          secim('kay-renk', 'Çubuk Rengi', KAYDIRMA_RENK) +
          '<fieldset class="alan"><legend>Kaydırma Davranışı</legend>' +
          '<label class="secim"><input type="radio" name="kay-davranis" value="smooth"> Yumuşak (smooth)</label>' +
          '<label class="secim"><input type="radio" name="kay-davranis" value="auto"> Anında (auto)</label></fieldset>'
      ) +
      grup('Hareket', '<label class="secim"><input type="checkbox" id="hareket-az"> Hareketi Azalt</label><p class="ipucu">Geçişleri, salınımı ve yumuşak kaydırmayı kapatır.</p>');
  }

  function renkEsle(ad, kaynak) {
    const hex = su.renk[ad];
    for (const el of $$('[data-renk="' + ad + '"]')) {
      if (el === kaynak) continue;
      const a = el.dataset.alan;
      if (a === 'secici') el.value = hex;
      else if (a === 'hex') {
        el.value = hex;
        el.removeAttribute('aria-invalid');
      }
    }
    if (!kaynak || !['h', 's', 'l'].includes(kaynak.dataset.alan)) hslBellek[ad] = hsl(hex);
    const b = hslBellek[ad];
    for (const k of ['h', 's', 'l']) {
      const el = $('[data-renk="' + ad + '"][data-alan="' + k + '"]');
      if (el !== kaynak) el.value = b[k];
      $('#o-' + k + '-' + ad).textContent = b[k];
    }
    $('[data-hexgoster="' + ad + '"]').textContent = hex;
    $('[data-nokta="' + ad + '"]').style.background = hex;
  }

  function formDoldur() {
    for (const ad of DUZENLENEN) renkEsle(ad);
    $('#arka-tur').value = su.arka.tur;
    $('#arka-durak').value = su.arka.durak;
    $('#arka-aci').value = su.arka.aci;
    $('#arka-don').checked = su.arka.don;
    $('#yazi-aile').value = su.yazi.aile;
    $('#yazi-carpan').value = su.yazi.carpan;
    $('#yazi-govde').value = su.yazi.govde;
    $('#yazi-yari').value = su.yazi.yari;
    $('#yazi-kahraman').value = su.yazi.kahraman;
    $('#sekil-r').value = su.sekil.r;
    $('#sekil-rp').value = su.sekil.rPencere;
    $('#kay-kalinlik').value = su.kaydir.kalinlik;
    $('#kay-renk').value = su.kaydir.renk;
    for (const r of $$('[name="kay-davranis"]')) r.checked = r.value === su.kaydir.davranis;
    $('#hareket-az').checked = su.hareketAz;
    ciktilar();
  }

  function ciktilar() {
    $('#o-arka-durak').textContent = su.arka.durak;
    $('#o-arka-aci').textContent = su.arka.aci + '°';
    $('#o-yazi-carpan').textContent = '×' + Number(su.yazi.carpan).toFixed(2);
    $('#o-sekil-r').textContent = su.sekil.r + ' px';
    $('#o-sekil-rp').textContent = su.sekil.rPencere + ' px';
    $('#o-kay-kalinlik').textContent = su.kaydir.kalinlik + ' px';
    const olcek = [1, 2, 3, 4, 5].map((n) => 'fs-' + n + ' ' + Math.round(T.size['fs-' + n].value * su.yazi.carpan));
    $('#yazi-olcek').textContent = olcek.join(' · ');
    $('#yazi-uyari').hidden = !(Number(su.yazi.yari) >= 700 || Number(su.yazi.govde) >= 700);
    $('#arka-aci').disabled = su.arka.don && !su.hareketAz;
    $('#arka-aci').title = $('#arka-aci').disabled ? 'Salınım açıkken açı 150–170° arasında gezer' : '';
    document.documentElement.style.setProperty('--tk-scrollbar-w', su.kaydir.kalinlik + 'px');
  }

  function turet(ad) {
    const kaynak = hsl(su.renk[TURETILIR[ad]]);
    const siyah = coz(su, 'black');
    for (let l = kaynak.l; l <= 100; l += 0.5) {
      const hex = hslHex(kaynak.h, kaynak.s, l);
      if (yaziOlarak(su, hex) >= 7.05 && oran(su, hex, 1, siyah) >= 7) return hex;
    }
    return hslHex(kaynak.h, kaynak.s, 90);
  }

  function olaylar() {
    const f = $('#ayarlar');
    f.addEventListener('submit', (e) => e.preventDefault());
    f.addEventListener('input', (e) => {
      const el = e.target;
      const ad = el.dataset.renk;
      if (ad) {
        const a = el.dataset.alan;
        if (a === 'secici') su.renk[ad] = el.value.toLocaleLowerCase('tr');
        else if (a === 'hex') {
          const v = el.value.trim();
          const c = /^#?[0-9a-fA-F]{6}$/.test(v) ? P(v[0] === '#' ? v : '#' + v) : null;
          if (!c) {
            el.setAttribute('aria-invalid', 'true');
            return;
          }
          el.removeAttribute('aria-invalid');
          su.renk[ad] = K.hex(c);
        } else {
          const b = hslBellek[ad] || hsl(su.renk[ad]);
          b[a] = Number(el.value);
          hslBellek[ad] = b;
          su.renk[ad] = hslHex(b.h, b.s, b.l);
        }
        renkEsle(ad, el);
        planla();
        return;
      }
      oku();
      ciktilar();
      planla();
    });
    f.addEventListener('change', (e) => {
      if (!e.target.dataset.renk) {
        oku();
        ciktilar();
        planla();
      }
    });
    f.addEventListener('click', (e) => {
      const g = e.target.closest('[data-geri]');
      if (g) {
        const ad = g.dataset.geri;
        su.renk[ad] = ilk.renk[ad];
        renkEsle(ad);
        planla();
      }
      const t = e.target.closest('[data-turet]');
      if (t) {
        const ad = t.dataset.turet;
        su.renk[ad] = turet(ad);
        renkEsle(ad);
        planla();
        durum(adi(ad) + ' ' + su.renk[ad] + ' olarak türetildi.');
      }
    });
    $('#onizleme').addEventListener('click', (e) => {
      const k = e.target.closest('[data-kaydir]');
      if (k) {
        const liste = document.getElementById(k.dataset.hedef);
        liste.scrollTo({ top: k.dataset.kaydir === 'son' ? liste.scrollHeight : 0 });
      }
      const li = e.target.closest('.liste li');
      if (li) for (const x of $$('li', li.parentElement)) x.setAttribute('aria-selected', String(x === li));
    });
    for (const b of $$('[data-kip]'))
      b.addEventListener('click', () => {
        kip = b.dataset.kip;
        for (const x of $$('[data-kip]')) x.setAttribute('aria-pressed', String(x === b));
        planla();
      });
    $('#sifirla').addEventListener('click', () => {
      su = kopya(ilk);
      for (const k of Object.keys(hslBellek)) delete hslBellek[k];
      formDoldur();
      planla();
      durum('Token dosyasındaki değerlere dönüldü.');
    });
    $('#kopyala').addEventListener('click', kopyala);
    $('#indir').addEventListener('click', indir);
  }

  function oku() {
    su.arka.tur = $('#arka-tur').value;
    su.arka.durak = Number($('#arka-durak').value);
    su.arka.aci = Number($('#arka-aci').value);
    su.arka.don = $('#arka-don').checked;
    su.yazi.aile = $('#yazi-aile').value;
    su.yazi.carpan = Number($('#yazi-carpan').value);
    su.yazi.govde = Number($('#yazi-govde').value);
    su.yazi.yari = Number($('#yazi-yari').value);
    su.yazi.kahraman = Number($('#yazi-kahraman').value);
    su.sekil.r = Number($('#sekil-r').value);
    su.sekil.rPencere = Number($('#sekil-rp').value);
    su.kaydir.kalinlik = Number($('#kay-kalinlik').value);
    su.kaydir.renk = $('#kay-renk').value;
    const d = $$('[name="kay-davranis"]').find((r) => r.checked);
    su.kaydir.davranis = d ? d.value : 'smooth';
    su.hareketAz = $('#hareket-az').checked;
    if (su.hareketAz) document.documentElement.dataset.hareket = 'az';
    else delete document.documentElement.dataset.hareket;
  }

  function disaAktar() {
    const out = {};
    const koy = (bolum, anahtar, deger) => {
      out[bolum] = out[bolum] || {};
      out[bolum][anahtar] = deger;
    };
    for (const ad of DUZENLENEN) if (su.renk[ad] !== ilk.renk[ad]) koy('brand', ad, { value: su.renk[ad] });
    if (su.yazi.carpan !== ilk.yazi.carpan)
      for (let n = 1; n <= 5; n++) koy('size', 'fs-' + n, { value: Math.round(T.size['fs-' + n].value * su.yazi.carpan), unit: 'px' });
    if (su.yazi.govde !== ilk.yazi.govde) koy('size', 'fw-body', { value: su.yazi.govde });
    if (su.yazi.yari !== ilk.yazi.yari) koy('size', 'fw-semi', { value: su.yazi.yari });
    if (su.yazi.kahraman !== ilk.yazi.kahraman) koy('size', 'fw-hero', { value: su.yazi.kahraman });
    if (su.sekil.r !== ilk.sekil.r) koy('shape', 'r', { value: su.sekil.r, unit: 'px' });
    if (su.sekil.rPencere !== ilk.sekil.rPencere) koy('shape', 'r-window', { value: su.sekil.rPencere, unit: 'px' });
    if (su.kaydir.kalinlik !== ilk.kaydir.kalinlik) koy('metric', 'scrollbar-w', { value: su.kaydir.kalinlik, unit: 'px' });
    if (su.arka.durak !== ilk.arka.durak) koy('derived', 'bg-gradient', { stops: su.arka.durak });
    if (su.yazi.aile !== ilk.yazi.aile && su.yazi.aile !== 'mono') koy('font', 'sans', { chain: aileler()[su.yazi.aile][2] });
    const notlar = [];
    if (su.arka.tur !== ilk.arka.tur) notlar.push('Arka plan tasarımı: ' + su.arka.tur + ' (token karşılığı yok).');
    if (su.arka.aci !== ilk.arka.aci) notlar.push('Degrade açısı: ' + su.arka.aci + 'deg (generate.js varsayılanı 160deg).');
    if (su.arka.don !== ilk.arka.don) notlar.push('Arka plan salınımı: ' + (su.arka.don ? 'açık' : 'kapalı') + '.');
    if (su.kaydir.renk !== ilk.kaydir.renk) notlar.push('Kaydırma çubuğu rengi: ' + su.kaydir.renk + '.');
    if (su.kaydir.davranis !== ilk.kaydir.davranis) notlar.push('Kaydırma davranışı: ' + su.kaydir.davranis + '.');
    if (su.yazi.aile === 'mono' && ilk.yazi.aile !== 'mono') notlar.push('Gövde yazısı mono zincire çevrildi.');
    if (notlar.length) out._ = notlar;
    return out;
  }

  function farklar() {
    const d = disaAktar();
    const out = [];
    for (const [bolum, alanlar] of Object.entries(d)) {
      if (bolum === '_') {
        out.push(...alanlar);
        continue;
      }
      for (const [k, v] of Object.entries(alanlar)) {
        const eski = bolum === 'brand' ? ilk.renk[k] : '';
        out.push(bolum + '.' + k + ': ' + (eski ? eski + ' → ' : '') + (typeof v.value === 'string' ? v.value : JSON.stringify(v.value !== undefined ? v.value : v)));
      }
    }
    return out;
  }

  function metin() {
    return JSON.stringify(disaAktar(), null, 2) + '\n';
  }

  function durum(m) {
    $('#durum').textContent = m;
  }

  async function kopyala() {
    const m = metin();
    try {
      await navigator.clipboard.writeText(m);
      durum('Değişen alanlar panoya kopyalandı.');
    } catch {
      const t = document.createElement('textarea');
      t.value = m;
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      durum(ok ? 'Değişen alanlar panoya kopyalandı.' : 'Pano erişimi yok; İndir düğmesini kullanın.');
    }
  }

  function indir() {
    const url = URL.createObjectURL(new Blob([metin()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neon.tokens.degisen.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    durum('neon.tokens.degisen.json indirildi.');
  }

  async function basla() {
    try {
      const r = await fetch('/tokens.json', { cache: 'no-store' });
      T = await r.json();
    } catch (e) {
      $('#onizleme').textContent = 'Token dosyası okunamadı: ' + e.message;
      return;
    }
    ilk = durumKur(T);
    su = kopya(ilk);
    const baglanti = new URLSearchParams(location.hash.slice(1));
    let bolum = null;
    for (const [k, v] of baglanti) {
      if (DUZENLENEN.includes(k) && /^[0-9a-fA-F]{6}$/.test(v)) su.renk[k] = '#' + v.toLocaleLowerCase('tr');
      else if (k === 'kip' && (v === 'tek' || v === 'karsi')) kip = v;
      else if (k === 'arka' && ARKALAR.some((a) => a[0] === v)) su.arka.tur = v;
      else if (k === 'bolum' && /^[a-z]+$/.test(v)) bolum = v;
    }
    for (const x of $$('[data-kip]')) x.setAttribute('aria-pressed', String(x.dataset.kip === kip));
    uygula(document.documentElement, ilk, false);
    formKur();
    formDoldur();
    olaylar();
    ciz();
    const hedef = bolum && document.getElementById('s-' + bolum);
    if (hedef) hedef.scrollIntoView({ behavior: 'instant' });
    window.Onizleme = { durum: () => su, ilk: () => ilk, disaAktar, T: () => T };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla);
  else basla();
})();
