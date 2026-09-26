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
    disabled: 'Pasif',
    warning: 'Uyarı',
    text: 'Metin',
    success: 'Başarı',
    danger: 'Tehlike',
    'danger-text': 'Tehlike Yazısı',
    panel: 'Panel',
    glass: 'Cam',
  };

  const DUZENLENEN = ['blue', 'pink', 'pink-text', 'purple', 'purple-text', 'surface', 'black', 'glass-base', 'text', 'disabled', 'success', 'warning'];
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

  const SAYFALAR = [
    ['renkler', 'Renkler Ve Tonlar'],
    ['dugmeler', 'Düğmeler'],
    ['formlar', 'Formlar'],
    ['ustcubuk', 'Üst Çubuk'],
    ['ilerleme', 'İlerleme Çubuğu'],
    ['kaydirma', 'Kaydırma Çubuğu'],
    ['arka', 'Arka Plan'],
    ['rozetler', 'Rozetler'],
    ['bildirimler', 'Bildirimler'],
    ['kurulum', 'Kurulum Paneli'],
    ['modal', 'Modal'],
    ['tipografi', 'Tipografi'],
    ['akicilik', 'Akıcılık'],
    ['okunur', 'Okunurluk'],
    ['teknik', 'Teknik'],
  ];
  const TEK = ['arka', 'akicilik', 'okunur', 'teknik'];
  const ESKI = { renk: 'renkler', parca: 'ustcubuk', tonlar: 'renkler', yanyana: 'renkler', yuzeyler: 'renkler', bilesenler: 'formlar', form: 'formlar' };
  const ILGILI = {
    renkler: ['renk'],
    dugmeler: ['dugme', 'renk-blue', 'renk-pink', 'renk-pink-text', 'renk-purple', 'renk-purple-text', 'renk-disabled', 'parlama', 'sekil', 'yogunluk', 'hareket'],
    formlar: ['renk-text', 'renk-surface', 'renk-blue', 'renk-pink-text', 'renk-disabled', 'sekil', 'yogunluk', 'yazi'],
    ustcubuk: ['pencere', 'renk-glass-base', 'renk-text', 'renk-pink-text', 'renk-purple-text', 'yazi', 'sekil', 'yuzey'],
    ilerleme: ['renk-blue', 'renk-purple', 'renk-success', 'parlama', 'hareket'],
    kaydirma: ['kaydir', 'renk-purple-text', 'renk-pink-text'],
    arka: ['arka', 'renk-black', 'renk-surface', 'renk-blue', 'renk-pink', 'renk-purple', 'yuzey'],
    rozetler: ['renk-success', 'renk-warning', 'renk-blue', 'renk-pink', 'renk-purple-text', 'sekil'],
    bildirimler: ['renk-success', 'renk-warning', 'renk-surface', 'hareket', 'yuzey'],
    kurulum: ['renk-blue', 'renk-success', 'renk-surface', 'yuzey', 'yazi'],
    modal: ['yuzey', 'hareket', 'renk-surface', 'renk-text', 'renk-black'],
    tipografi: ['yazi', 'renk-text', 'renk-blue', 'parlama'],
    akicilik: ['egri', 'hareket'],
    okunur: ['renk'],
    teknik: ['hareket', 'parlama', 'yuzey'],
  };
  const PARLAMALAR = [
    ['glow', 'Kutu Halesi'],
    ['glow-button', 'Düğme Halesi'],
    ['glow-hero', 'Kahraman Yazı Halesi'],
  ];
  const PARLAMA_DUZEY = [
    ['yok', 'Yok'],
    ['ince', 'İnce'],
    ['token', 'Token Dosyası'],
    ['neon', 'Neon'],
    ['ozel', 'Özel'],
  ];
  const SURELER = [
    ['instant', 'Anında'],
    ['fast', 'Hızlı'],
    ['base', 'Temel'],
    ['slow', 'Yavaş'],
  ];
  const BICIMLER = [
    ['dolu', 'Dolu'],
    ['ince', 'İnce'],
    ['hap', 'Hap'],
    ['gizli', 'Üzerine Gelince'],
  ];
  const DURUMLAR = [
    ['', 'Normal'],
    ['s-uzerinde', 'Üzerinde'],
    ['s-basili', 'Basılı'],
    ['s-odak', 'Odak'],
    ['pasif', 'Pasif'],
  ];

  let T = null;
  let ilk = null;
  let su = null;
  let kip = 'tek';
  let sayfa = 'renkler';
  let bekleyen = false;
  let temalar = [];
  let sonCizim = null;
  let arkaPanel = true;
  let ilerlemeNo = 0;
  const hslBellek = {};
  const zamanlar = new Set();
  const A = () => window.Akicilik;
  const r2 = (n) => Math.round(n * 100) / 100;
  const egriMetin = (b) => '[' + b.map(r2).join(', ') + ']';

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
    const parlama = {};
    for (const [g] of PARLAMALAR) parlama[g] = { alpha: t.derived[g].alpha, blur: t.derived[g].blur };
    const egri = {};
    if (A()) for (const [ad, , b] of A().EGRILER) egri[ad] = b.slice();
    for (const [ad, v] of Object.entries(t.easing || {})) if (v && Array.isArray(v.bezier)) egri[ad] = v.bezier.slice();
    const sure = {};
    for (const [k] of SURELER) sure[k] = t.duration[k].ms;
    return {
      parlama,
      parlamaDuzey: 'token',
      egri,
      arayuzEgri: 'out',
      sure,
      sureCarpan: 1,
      yogunluk: 1,
      kenar: t.shape['border-w'] ? t.shape['border-w'].value : 1,
      cam: 16,
      golge: 1,
      pencere: { kenar: 'border-strong', cubuk: T.size['titlebar-h-min'] ? T.size['titlebar-h-min'].value : 32 },
      dugme: { h: Math.round(t.size['fs-2'].value * t.size['lh-heading'].value + 14 * 2 + 2), px: 20 },
      renk,
      koyu: t.meta.dark !== false,
      arka: { tur: 'degrade', durak: t.derived['bg-gradient'].stops, aci: 160, don: false },
      yazi: {
        aile: 'sans',
        carpan: 1,
        govde: t.size['fw-body'].value,
        yari: t.size['fw-semi'].value,
        kahraman: t.size['fw-hero'].value,
      },
      sekil: { r: t.shape.r.value, rPencere: t.shape['r-window'].value },
      kaydir: { kalinlik: t.metric['scrollbar-w'].value, renk: 'purple-text', davranis: 'auto', bicim: 'dolu' },
      hareketAz: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
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
    try {
      return K.hex(window.Skor.onSec(T, st.renk, anahtar).renk);
    } catch {}
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
    const pg = st.parlama.glow;
    for (const b of T.derived.glow.bases) v['--tk-glow-' + b] = '0 0 ' + pg.blur + 'px ' + rgba(R(b), pg.alpha);
    const gb = st.parlama['glow-button'];
    v['--tk-glow-button'] = '0 0 ' + gb.blur + 'px ' + rgba(R(T.derived['glow-button'].ref), gb.alpha);
    const gh = st.parlama['glow-hero'];
    v['--tk-glow-hero'] = '0 0 ' + gh.blur + 'px ' + rgba(R(T.derived['glow-hero'].ref), gh.alpha);
    const sp = T.derived['shadow-panel'];
    v['--tk-shadow-panel'] = '0 0 ' + Math.round(sp.blur * st.golge) + 'px ' + rgba(R(sp.ref), Math.min(1, sp.alpha * st.golge));
    v['--tk-glass-blur'] = st.cam + 'px';
    v['--tk-border-w'] = st.kenar + 'px';
    const pk = st.pencere.kenar;
    v['--tk-window-edge'] = pk === 'yok' ? 'transparent' : pk === 'border-strong' ? rgba(R(T.derived['border-strong'].ref), T.derived['border-strong'].alpha) : R(pk);
    v['--tk-titlebar-h-min'] = st.pencere.cubuk + 'px';
    v['--tk-btn-h'] = st.dugme.h + 'px';
    v['--tk-btn-px'] = st.dugme.px + 'px';
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
    for (const k of ['1', '2', '3', '4', '5']) v['--tk-sp-' + k] = Math.round(T.space[k].value * st.yogunluk) + 'px';
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
    for (const [k] of SURELER) v['--tk-t-' + k] = st.sure[k] + 'ms';
    v['--tk-bg-rotate'] = T.duration['bg-rotate'].ms + 'ms';
    for (const [ad, b] of Object.entries(st.egri)) v['--tk-e-' + ad] = 'cubic-bezier(' + b.map(r2).join(', ') + ')';
    if (st.egri[st.arayuzEgri]) v['--tk-e-out'] = v['--tk-e-' + st.arayuzEgri];
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
      el.dataset.kaydirBicim = st.kaydir.bicim;
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
      '<p>İlk sütun canlıdır: üzerine gelin, basın, Tab ile odaklayın. Diğer sütunlar durumları sabit gösterir. İkincil ve hayalet düğmede renk yalnız kenardadır, yazı gövde rengidir; dolgu ile yazı aynı ton ailesinden olamaz. Üzerine gelince %10 dolgu gelir, yazı o dolgunun on eşinden.</p>' +
      '<div class="dugme-izgara">' + h + '</div></section>'
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

  function blok(on, id, baslik, aciklama, ic) {
    return '<section class="bolum" id="' + on + '-' + id + '"><h2>' + baslik + '</h2>' + (aciklama ? '<p>' + aciklama + '</p>' : '') + ic + '</section>';
  }

  const etiketli = (etiket, ic) => '<figure class="parca-kutu"><figcaption class="bilesen-ad">' + etiket + '</figcaption>' + ic + '</figure>';
  const kutucuk = (ad, ic) => '<div class="bilesen"><p class="bilesen-ad">' + ad + '</p>' + ic + '</div>';
  const tkDugme = (sinif, metin, ek) => '<button type="button" class="tk-btn ' + sinif + '"' + (ek || '') + '>' + metin + '</button>';
  const zorla = (s) => (s ? ' ' + s : '');
  const durumAttr = (s, p, neden) => (p ? ' disabled title="' + neden + '"' : s ? ' tabindex="-1"' : '');

  function durumIzgara(satirlar) {
    let h = '<div class="durum-bas"></div>' + DURUMLAR.map(([, a]) => '<div class="durum-bas">' + a + '</div>').join('');
    for (const [ad, fn] of satirlar) {
      h += '<div class="durum-bas durum-satir-ad">' + ad + '</div>';
      for (const [s] of DURUMLAR) h += '<div class="durum-hucre">' + fn(s === 'pasif' ? '' : s, s === 'pasif') + '</div>';
    }
    return '<div class="durum-izgara">' + h + '</div>';
  }

  function renklerSayfasi(st, on) {
    return tonBolumu(st, on) + yanBolumu(st, on) + yuzeyBolumu(st, on);
  }

  function dugmelerSayfasi(st, on) {
    const R = (a) => coz(st, a);
    const izgara = durumIzgara([
      ['Birincil', (s, p) => tkDugme('tk-btn-primary' + zorla(s), 'Kaydet', durumAttr(s, p, 'Önce bir kayıt seçin'))],
      ['Hayalet', (s, p) => tkDugme('tk-btn-ghost' + zorla(s), 'Vazgeç', durumAttr(s, p, 'İşlem sürüyor, bekleyin'))],
      ['Tehlike', (s, p) => tkDugme('tk-btn-danger' + zorla(s), 'Sil', durumAttr(s, p, 'Silinecek kayıt yok'))],
    ]);
    const oranlar =
      '<div class="satir oran-satir">' +
      '<span class="kare-not">Birincil</span>' + oranEtiket(oran(st, R('blue'), 1, onRenk(st, 'blue'))) +
      '<span class="kare-not">Hayalet Üzerinde</span>' + oranEtiket(oran(st, R('purple'), 0.1, R('text'))) +
      '<span class="kare-not">Tehlike</span>' + oranEtiket(oran(st, R('danger-text'), 1, onRenk(st, 'danger-text'))) +
      '</div>';
    return (
      blok(on, 'standart', 'Standart Düğme · Durumlar', 'Normal sütunu canlıdır: üzerine gelin, basın, Tab ile odaklayın. Diğer sütunlar durumu sabit gösterir. Dolgulu düğmenin yazısı dolgunun on eşinden gelir; hayalet düğmede renk yalnız kenardadır, yazı gövde rengidir. Pasif düğme neden pasif olduğunu title ile söyler.', izgara + oranlar) +
      dugmeBolumu(st, on)
    );
  }

  function formlarSayfasi(st, on) {
    const R = (a) => coz(st, a);
    const form =
      '<div class="parca-izgara parca-form">' +
      '<div class="tk-field"><label class="tk-label" for="' + on + '-ad">Hasta Adı</label><input class="tk-input" id="' + on + '-ad" value="Ayşe Yılmaz"></div>' +
      '<div class="tk-field"><label class="tk-label" for="' + on + '-tel">Telefon</label><input class="tk-input" id="' + on + '-tel" value="0532 12" aria-invalid="true" aria-describedby="' + on + '-tel-h">' +
      '<p class="tk-error" id="' + on + '-tel-h">Telefon 11 haneli olmalı.</p></div>' +
      '<div class="tk-field"><label class="tk-label" for="' + on + '-kod">Dosya No</label><input class="tk-input tk-mono" id="' + on + '-kod" value="AL-2026-0412" readonly></div>' +
      '<div class="tk-field"><label class="tk-label" for="' + on + '-kapali">Oda</label><input class="tk-input" id="' + on + '-kapali" value="Seçilmedi" disabled title="Önce servis seçin"></div>' +
      '</div>';
    const izgara = durumIzgara([
      ['Giriş', (s, p) => '<input class="tk-input' + zorla(s) + '" value="Ayşe Yılmaz" aria-label="Örnek giriş"' + durumAttr(s, p, 'Önce servis seçin') + '>'],
      ['Hatalı', (s, p) => '<input class="tk-input' + zorla(s) + '" value="0532 12" aria-invalid="true" aria-label="Hatalı giriş"' + durumAttr(s, p, 'Önce servis seçin') + '>'],
      ['Mono', (s, p) => '<input class="tk-input tk-mono' + zorla(s) + '" value="AL-2026-0412" aria-label="Mono giriş"' + durumAttr(s, p, 'Önce servis seçin') + '>'],
    ]);
    const satirlar = [
      ['Gelen Kutusu', '128'],
      ['Taslaklar', '4'],
      ['Gönderilenler', '1 024'],
      ['Arşiv', '9 870'],
    ]
      .map(([a, d], i) => '<li role="option" aria-selected="' + (i === 1) + '"><span>' + a + '</span><span class="deger">' + d + '</span></li>')
      .join('');
    const karsit =
      '<div class="bilesenler">' +
      kutucuk(
        'Giriş Kutusu',
        '<label class="ornek-etiket" for="' + on + '-pad">Proje Adı</label>' + oranEtiket(yaziOlarak(st, R('text-label'))) +
          '<input class="ornek-giris" id="' + on + '-pad" value="Teknesyum">' + oranEtiket(yaziOlarak(st, R('text'))) +
          '<label class="ornek-etiket" for="' + on + '-ep">E-Posta</label>' +
          '<input class="ornek-giris" id="' + on + '-ep" value="adres@" aria-invalid="true" aria-describedby="' + on + '-ep-h">' +
          '<span class="hata-yazi" id="' + on + '-ep-h">Geçerli bir adres yazın.</span>' + oranEtiket(yaziOlarak(st, R('danger-text')))
      ) +
      kutucuk('Seçili Liste Satırı', oranEtiket(oran(st, R('blue'), 0.2, R('text'))) + '<ul class="liste" role="listbox" aria-label="Klasörler">' + satirlar + '</ul>') +
      '</div>';
    return (
      blok(on, 'form', 'Form Alanları', 'Normal, hatalı, salt okunur, edilgen. Etiket hep görünür; hata metni alanın altındadır ve alana bağlıdır.', form) +
      blok(on, 'giris-durum', 'Giriş Kutusu · Durumlar', 'Normal sütunu canlıdır. Üzerinde ve basılıda kenar güçlenir, basılıda imleç pembeye döner, odakta iki katmanlı halka çizilir.', izgara) +
      blok(on, 'karsitlik', 'Karşıtlık Ölçümleri', 'Etiket, değer ve hata metni yüzey üstünde ölçülür.', karsit)
    );
  }

  const KAHVE =
    '<svg class="tk-titlebar__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M5 6.5v8a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-8Z"/><path d="M16 8.5h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 .5v3M12 .5v3"/></svg>';

  function denetim(sinif, ad, ic, ek) {
    return '<button type="button" class="tk-titlebar__control' + sinif + '" aria-label="' + ad + '" title="' + ad + '"' + (ek || '') + '><span class="tk-titlebar__' + ic + '" aria-hidden="true"></span></button>';
  }

  function senkron(durum, metin) {
    return '<button type="button" class="tk-sync' + (durum === 'syncing' ? ' tk-sync-progress' : '') + '" data-state="' + durum + '" title="Şimdi eşitle">' + metin + '</button>';
  }

  function guncelleme(adim, baslik) {
    return '<button type="button" class="tk-update" data-step="' + adim + '" title="' + baslik + '">Güncelleme</button>';
  }

  function ustcubukSayfasi(st, on) {
    const R = (a) => coz(st, a);
    const pencere =
      '<div class="tk-titlebar__window">' + denetim('', 'Küçült', 'minimize') + denetim('', 'Büyüt', 'maximize') + denetim(' tk-titlebar__control--close', 'Kapat', 'close') + '</div>';
    const sekmeler = (secili) =>
      '<nav class="tk-titlebar__tabs" aria-label="Sekmeler">' +
      ['Ana Sayfa', 'Kayıtlar', 'Ayarlar']
        .map((a, i) => '<a class="tk-titlebar__tab" href="#" data-bos' + (i === secili ? ' aria-current="page"' : '') + '>' + a + '</a>')
        .join('') +
      '</nav>';
    const ustcubuk = (secili, rozetler, cipler) =>
      '<div class="parca-pencere"><header class="tk-titlebar">' +
      '<div class="tk-titlebar__brand"><span class="tk-titlebar__name">Ameliyat<span class="tk-titlebar__accent">Liste</span></span></div>' +
      sekmeler(secili) +
      '<div class="tk-titlebar__tools">' + rozetler + cipler + pencere + '</div></header>' +
      '<div class="parca-pencere-ic">İçerik alanı</div></div>';
    const duzCip =
      '<a class="tk-titlebar__chip tk-titlebar__chip--support" href="#" data-bos>' + KAHVE + 'Destek Ol</a>' +
      '<a class="tk-titlebar__chip" href="#" data-bos>teknesyum.com</a>';
    const cerCip =
      '<a class="tk-titlebar__chip tk-titlebar__chip--support" href="#" data-bos>' + KAHVE + 'Destek Ol</a>' +
      '<a class="tk-titlebar__chip tk-titlebar__chip--outlined" href="#" data-bos>teknesyum.com</a>';
    const sekmeli =
      ustcubuk(0, senkron('synced', 'Eşitlendi · 14:32') + guncelleme('download', 'Yeni sürüm var, indirmek için tıklayın'), duzCip) +
      ustcubuk(1, senkron('offline', 'Çevrimdışı · 14:05') + guncelleme('install', 'İndirildi, kurmak için tıklayın'), duzCip);
    const bagEk = (s, p, neden) => (p ? ' aria-disabled="true" title="' + neden + '"' : s ? ' tabindex="-1"' : '');
    const kucuk = (ic) => '<div class="durum-cubuk">' + ic + '</div>';
    const anahatsiz = durumIzgara([
      ['Sekme', (s, p) => kucuk('<a class="tk-titlebar__tab' + zorla(s) + '" href="#" data-bos' + bagEk(s, p, 'Bu sekme yetki ister') + '>Kayıtlar</a>')],
      ['Seçili Sekme', (s, p) => kucuk('<a class="tk-titlebar__tab' + zorla(s) + '" href="#" data-bos aria-current="page"' + bagEk(s, p, 'Bu sekme yetki ister') + '>Ana Sayfa</a>')],
      ['Çip', (s, p) => kucuk('<a class="tk-titlebar__chip' + zorla(s) + '" href="#" data-bos' + bagEk(s, p, 'Bağlantı yok') + '>teknesyum.com</a>')],
      ['Küçült', (s, p) => kucuk(denetim(zorla(s), 'Küçült', 'minimize', durumAttr(s, p, 'Pencere küçültülemez')))],
      ['Kapat', (s, p) => kucuk(denetim(' tk-titlebar__control--close' + zorla(s), 'Kapat', 'close', durumAttr(s, p, 'Kayıt sürerken kapatılamaz')))],
    ]);
    const cerceveli =
      ustcubuk(2, senkron('synced', 'Eşitlendi · 14:32'), cerCip) +
      durumIzgara([
        ['Çerçeveli Çip', (s, p) => kucuk('<a class="tk-titlebar__chip tk-titlebar__chip--outlined' + zorla(s) + '" href="#" data-bos' + bagEk(s, p, 'Bağlantı yok') + '>teknesyum.com</a>')],
      ]);
    const sade =
      oranEtiket(K.pair(K.withAlpha(P(R('glass-base')), T.derived.glass.alpha), P(R('text')), zemin(st)).ratio) +
      '<div><div class="baslik-cubugu"><strong>Teknesyum · Pencere</strong><div class="pencere-dugmeler">' +
      '<button type="button" class="pencere-dugme" aria-label="Küçült" title="Küçült">–</button>' +
      '<button type="button" class="pencere-dugme" aria-label="Büyüt" title="Büyüt">□</button>' +
      '<button type="button" class="pencere-dugme pencere-kapat" aria-label="Kapat" title="Kapat">✕</button>' +
      '</div></div><div class="pencere-govde">Pencere gövdesi, panel yüzeyi.</div></div>';
    return (
      blok(on, 'sekmeli', 'Sekmeli Gezinme', 'Seçili sekme aria-current ile işaretlenir: yazı gövde rengine döner, altında gösterge çizgisi sabit durur. Üzerine gelin, basın, Tab ile gezin.', sekmeli) +
      blok(on, 'anahatsiz', 'Anahatsız Düğmeler · Durumlar', 'Sekme, çip ve pencere düğmelerinde anahat yoktur. Üzerine gelince yazı pembe yazı kesimine döner, metnin altında ortadan açılan bir çizgi belirir. Normal sütunu canlıdır.', anahatsiz) +
      blok(on, 'cerceveli', 'Çerçeveli İstisna', 'Tek istisna çerçeveli çiptir: kenarı yazı rengindedir, çubukta dikey ortalı durur ve alt çizgi göstermez.', cerceveli) +
      blok(on, 'sade', 'Sade Başlık Çubuğu · Karşıtlık', 'Cam yüzey üstünde gövde yazısı ölçülür.', sade)
    );
  }

  function ilerlemeHtml(durum, yuzde, adim, ek) {
    return (
      '<div class="tk-progress" data-status="' + durum + '" data-hedef="' + yuzde + '"' + (ek || '') + '><span class="tk-progress__step">' + adim + '</span><div class="tk-progress__row">' +
      '<div class="tk-progress__track" role="progressbar" aria-valuenow="' + yuzde + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + adim + '">' +
      '<div class="tk-progress__fill" style="--tk-progress-value: ' + yuzde / 100 + '"></div></div>' +
      '<span class="tk-progress__percent">' + yuzde + '%</span></div></div>'
    );
  }

  function ilerlemeSayfasi(st, on) {
    const R = (a) => coz(st, a);
    const canli =
      '<div class="parca-yigin">' + ilerlemeHtml('running', 0, 'Başlamaya hazır', ' data-demo-ilerleme') + '</div>' +
      '<div class="satir demo-arac">' + tkDugme('tk-btn-primary', 'Baştan Oynat', ' data-eylem="ilerleme"') + '</div>';
    const cubuklar =
      '<div class="parca-yigin">' +
      ilerlemeHtml('running', 35, 'Video kodlanıyor · 2 / 6') +
      ilerlemeHtml('done', 100, 'Kodlama bitti') +
      ilerlemeHtml('error', 70, 'Kodlama durdu: disk dolu') +
      '</div>';
    const sade =
      '<div class="parca-yigin">' +
      '<div class="satir"><span class="mono">%64</span>' + oranEtiket(yaziOlarak(st, R('blue'))) + '</div>' +
      '<div class="ilerleme" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100" aria-label="Mavi ilerleme"><span style="width: 64%"></span></div>' +
      '<span class="kare-not">Dolgu / İz · Eşik 3:1</span>' + oranEtiket(K.ratio(P(R('blue')), P(bilesik(st, R('blue'), 0.1))), { esik: 3 }) +
      '<div class="ilerleme ilerleme-pembe" role="progressbar" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100" aria-label="Pembe ilerleme"><span style="width: 38%"></span></div>' +
      oranEtiket(K.ratio(P(R('pink')), P(bilesik(st, R('blue'), 0.1))), { esik: 3 }) +
      '</div>';
    return (
      blok(on, 'canli', 'Canlı İlerleme', 'Hedef her yavaş süre jetonunda (' + st.sure.slow + ' ms) farklı büyüklükte sıçrar; gösterilen değer ona 0,1 adımlarla akar. Fark büyüdükçe hızlanır, hedefe yaklaştıkça yavaşlar (zaman sabiti ' + st.sure.slow / 2 + ' ms). Dolgu clip-path ile kesilir; / / / taralar kayar, tarama ışığı yalnız dolu kısımda geçer. Bitince düz başarı rengine döner.', canli) +
      blok(on, 'durumlar', 'Durumlar', 'Çalışırken iki renkli geçiş, kayan taralar ve dolu kısımda tarama ışığı, bitince düz başarı rengi, hatada tehlike rengi.', cubuklar) +
      blok(on, 'sade', 'Sade Çubuk · Karşıtlık', 'Dolgu ile iz arasında 3:1 eşiği aranır.', sade)
    );
  }

  function kaydirmaSayfasi(st, on) {
    const uzun = [];
    for (let i = 1; i <= 60; i++)
      uzun.push('<li><span>Kayıt ' + String(i).padStart(2, '0') + ' · Örnek Satır</span><span class="deger">' + ((i * 37) % 1000) + '</span></li>');
    const ornek = (b, ad) =>
      '<figure class="parca-kutu kaydir-kutu"><figcaption class="bilesen-ad">' + ad + '</figcaption>' +
      '<ul class="uzun-liste kaydir-ornek" data-bicim="' + b + '" tabindex="0" aria-label="' + ad + ' biçimi">' + uzun.slice(0, 30).join('') + '</ul></figure>';
    const arac =
      '<div class="kaydirma-arac"><button type="button" class="btn btn-hayalet" data-kaydir="son" data-hedef="' + on + '-uzun">Sona Kaydır</button>' +
      '<button type="button" class="btn btn-hayalet" data-kaydir="bas" data-hedef="' + on + '-uzun">Başa Kaydır</button></div>';
    return (
      blok(on, 'kaydirma', 'Kaydırma Çubuğu', 'Çubukta hale yoktur: ince ve hareketli bir çubuğun çevresindeki parlama bulaşır, gürültü gibi okunur. Kalınlık, renk, biçim ve davranış sağdaki Kaydırma grubundan değişir; önizlemenin kendi çubuğu da aynı ayarı kullanır.', arac + '<ul class="uzun-liste" id="' + on + '-uzun" tabindex="0" aria-label="Uzun liste">' + uzun.join('') + '</ul>') +
      blok(on, 'bicimler', 'Biçimler', 'Dört biçim yan yana. Seçili biçim (' + BICIMLER.find((b) => b[0] === st.kaydir.bicim)[1] + ') sayfanın ve uzun listenin çubuğuna uygulanır.', '<div class="kaydir-ornekler">' + BICIMLER.map(([b, a]) => ornek(b, a)).join('') + '</div>')
    );
  }

  function arkaSayfasi(st) {
    const turler = ARKALAR.map(
      ([k, a]) => '<button type="button" class="arac-dugme" data-arka-sec="' + k + '" aria-pressed="' + (st.arka.tur === k) + '">' + a + '</button>'
    ).join('');
    const don = st.hareketAz ? ' disabled title="Hareketi azalt açıkken salınım durur"' : '';
    return (
      '<div class="arka-sahne">' +
      '<div class="arka-arac">' +
      '<h2 class="arka-baslik">Arka Plan</h2>' +
      '<p>Arka plan önizlemenin tamamını kaplar. Türü aşağıdan seçin; degrade başı Siyah, sonu Yüzey rengidir.</p>' +
      '<div class="arka-turler" role="group" aria-label="Arka Plan Türü">' + turler + '</div>' +
      '<div class="satir">' +
      '<label class="secim"><input type="checkbox" data-arka-panel' + (arkaPanel ? ' checked' : '') + '> Örnek Paneli Göster</label>' +
      '<label class="secim"><input type="checkbox" data-arka-don' + (st.arka.don ? ' checked' : '') + don + '> Salınım (150–170°)</label>' +
      '</div></div>' +
      (arkaPanel
        ? '<div class="bolum arka-ornek"><h2>Örnek Panel</h2><p>Panel yüzeyi arka planın üstünde durur. Cam türünde yüzey yarı saydamdır, arkadaki hale bulanık görünür.</p>' +
          '<div class="satir">' + tkDugme('tk-btn-primary', 'Birincil') + tkDugme('tk-btn-ghost', 'Hayalet') + '</div></div>'
        : '') +
      '</div>'
    );
  }

  function rozetlerSayfasi(st, on) {
    const R = (a) => coz(st, a);
    const rozet =
      '<div class="bilesenler">' +
      kutucuk(
        'Sayı Rozeti',
        '<div class="satir"><span class="rozet rozet-mavi">7</span>' + oranEtiket(oran(st, R('blue'), 1, onRenk(st, 'blue'))) + '</div>' +
          '<div class="satir"><span class="rozet rozet-basari">12</span>' + oranEtiket(oran(st, R('success'), 1, onRenk(st, 'success'))) + '</div>' +
          '<div class="satir"><span class="rozet rozet-tehlike">3</span>' + oranEtiket(oran(st, R('danger-text'), 1, onRenk(st, 'danger-text'))) + '</div>'
      ) +
      kutucuk(
        'Çip',
        '<div class="satir"><span class="cip cip-mavi">Mavi Çip</span>' + oranEtiket(oran(st, R('blue'), 0.1, R('text'))) + '</div>' +
          '<div class="satir"><span class="cip cip-pembe">Pembe Çip</span>' + oranEtiket(oran(st, R('pink'), 0.1, R('text'))) + '</div>' +
          '<div class="satir"><span class="cip cip-mor">Mor Çip</span>' + oranEtiket(oran(st, R('purple'), 0.1, R('text'))) + '</div>'
      ) +
      kutucuk(
        'Durum Noktası',
        '<div class="satir"><span class="parca-nokta"><span class="tk-dot tk-dot-on"></span>Bağlı</span></div>' +
          '<div class="satir"><span class="parca-nokta"><span class="tk-dot tk-dot-off"></span>Bağlı Değil</span></div>' +
          '<p class="kare-not">Dolu daire ve halka: renk olmadan da ayrılır.</p>'
      ) +
      '</div>';
    const senk =
      '<div class="parca-sira">' +
      etiketli('Bekliyor', senkron('waiting', 'Bağlanıyor…')) +
      etiketli('Eşitleniyor', senkron('syncing', 'Eşitleniyor…')) +
      etiketli('Eşitlendi', senkron('synced', 'Eşitlendi · 14:32')) +
      etiketli('Çevrimdışı', senkron('offline', 'Çevrimdışı · 14:05')) +
      etiketli('Yerel', senkron('local', 'Yalnız bu bilgisayar')) +
      '</div>';
    const gun =
      '<div class="parca-sira">' +
      etiketli('1 · Sarı: Yeni Sürüm Var, Tıkla İndir', guncelleme('download', 'Yeni sürüm var, indirmek için tıklayın')) +
      etiketli('2 · Yeşil: İndi, Tıkla Kur', guncelleme('install', 'İndirildi, kurmak için tıklayın')) +
      '</div>';
    return (
      blok(on, 'rozet', 'Rozet, Çip Ve Nokta', 'Dolgulu rozetin yazısı on eşinden gelir; çipte renk %10 dolgu ve kenardadır, yazı gövde rengidir.', rozet) +
      blok(on, 'senkron', 'Senkron Rozeti · Beş Durum', 'Renkli nokta ve metin; rengin yanında metin ikinci taşıyıcıdır.', senk) +
      blok(on, 'guncelleme', 'Güncelleme Rozeti · İki Adım', 'Önce indir, sonra kur; her adımın rengi ve metni ayrıdır.', gun)
    );
  }

  const KAPAT_SIMGE =
    '<button type="button" class="tk-toast-close" aria-label="Kapat"><svg viewBox="0 0 14 14" aria-hidden="true" stroke="currentColor" stroke-width="1.5"><path d="M2 2l10 10M12 2L2 12"/></svg></button>';
  const BILDIRIM = {
    success: ['Kaydedildi', 'Ayarlar diske yazıldı.'],
    warning: ['Çevrimdışı', 'Değişiklikler bağlantı gelince eşitlenecek.'],
    danger: ['Kaydedilemedi', 'Disk dolu; yer açıp yeniden deneyin.'],
  };

  function bildirimHtml(tur) {
    const [baslik, metin] = BILDIRIM[tur];
    return '<div class="tk-panel tk-toast tk-toast-' + tur + '" role="status"><div class="tk-toast-body"><div class="tk-toast-title">' + baslik + '</div>' + metin + '</div>' + KAPAT_SIMGE + '</div>';
  }

  function bildirimlerSayfasi(st, on) {
    const omur = T.metric['toast-life'].value;
    const tavan = T.metric['toast-max'].value;
    const canli =
      '<div class="satir demo-arac">' +
      tkDugme('tk-btn-ghost', 'Başarı Göster', ' data-eylem="bildirim" data-tur="success"') +
      tkDugme('tk-btn-ghost', 'Uyarı Göster', ' data-eylem="bildirim" data-tur="warning"') +
      tkDugme('tk-btn-danger', 'Hata Göster', ' data-eylem="bildirim" data-tur="danger"') +
      '</div><div class="bildirim-sahne"><div class="bildirim-yigin" data-bildirim-yigin aria-live="polite"></div></div>';
    const statik = '<div class="parca-sira parca-ust">' + bildirimHtml('success') + bildirimHtml('warning') + bildirimHtml('danger') + '</div>';
    return (
      blok(on, 'canli', 'Canlı Bildirim', 'Bildirim sağdan kayarak girer (' + st.sure.fast + ' ms), ' + omur / 1000 + ' saniye sonra kendiliğinden kapanır; hata bildirimi siz kapatana kadar kalır. Aynı anda en çok ' + tavan + ' bildirim görünür, üzerine gelince süre durur.', canli) +
      blok(on, 'turler', 'Türler', 'Renk kenar ve başlıktadır, gövde yazısı düzdür.', statik)
    );
  }

  function kurulumSayfasi(st, on) {
    const GUNLUK = [
      'Kaynak denetlendi: D:\\AmeliyatListe',
      'Eski sürüm yedeklendi (.old)',
      'Çalışan süreç kapatıldı',
      'Dosyalar kopyalanıyor · 412 / 980',
      'Dosyalar kopyalanıyor · 980 / 980',
      'Bağımlılıklar doğrulandı',
      'Masaüstü kısayolu yazıldı',
      'Başlat menüsü kaydı yazıldı',
      'Kaldırma kaydı yazıldı',
      'Kurulum tamamlandı',
    ];
    const simge =
      '<svg class="tk-installer__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--tk-blue)">' +
      '<rect x="5" y="5" width="38" height="38" rx="10"/><path d="M16 25l6 6 11-13"/></svg>';
    const kur = (durum, yuzde, adim, alt, satirlar, dugmeler) =>
      '<div class="tk-installer" data-status="' + durum + '" data-hedef="' + yuzde + '">' +
      '<div class="tk-installer__head">' + simge +
      '<div class="tk-installer__titles"><p class="tk-installer__title">AmeliyatListe<span class="tk-installer__accent">Kurulum</span></p>' +
      '<p class="tk-installer__sub" title="' + alt + '">' + alt + '</p></div></div>' +
      '<div><div class="tk-installer__row"><span class="tk-installer__step">' + adim + '</span><span class="tk-installer__percent">' + yuzde + '%</span></div>' +
      '<div class="tk-progress__track parca-kur-cubuk" role="progressbar" aria-valuenow="' + yuzde + '" aria-valuemin="0" aria-valuemax="100" aria-label="Kurulum">' +
      '<div class="tk-progress__fill" style="--tk-progress-value: ' + yuzde / 100 + '"></div></div></div>' +
      '<ol class="tk-installer__log">' + satirlar.slice(-9).map((s) => '<li>' + s + '</li>').join('') + '</ol>' +
      '<div class="tk-installer__actions">' + dugmeler + '</div></div>';
    const panel =
      '<div class="parca-izgara">' +
      etiketli('Çalışıyor · Düğme Yok, Kapatılamaz', kur('running', 62, 'Program dosyaları kopyalanıyor', 'İlk kurulum · C:\\Program Files\\AmeliyatListe', GUNLUK.slice(0, 4), '')) +
      etiketli('Bitti · Programı Aç + Kapat', kur('done', 100, 'Kurulum tamamlandı, program hazır', 'İlk kurulum · C:\\Program Files\\AmeliyatListe', GUNLUK, tkDugme('tk-btn-primary', 'Programı Aç') + tkDugme('tk-btn-ghost', 'Kapat'))) +
      etiketli('Hata · Günlüğü Aç + Kapat', kur('error', 48, 'Kopyalama durdu: hedef klasör başka bir programda açık', 'Günlük · C:\\Users\\Kullanici\\AppData\\Local\\AmeliyatListe\\kur.log', GUNLUK.slice(0, 4).concat('HATA: data.db kilitli, işlem durduruldu'), tkDugme('tk-btn-primary', 'Günlüğü Aç') + tkDugme('tk-btn-ghost', 'Kapat'))) +
      '</div>';
    return blok(on, 'kurulum', 'Kurulum Ve Güncelleme Paneli', 'Adım cümlesi, yüzde, tavanlı çubuk ve son dokuz günlük satırı. İş bitmeden düğme görünmez; hata durumunda günlük yolu açıkça yazılır.', panel);
  }

  function modalSayfasi(st, on) {
    const govde = (idEk, kapat) =>
      '<div class="tk-panel tk-modal"' + (kapat ? '' : ' role="dialog" aria-label="Kaydı sil"') + '>' +
      '<p class="tk-h3"' + (idEk ? ' id="' + idEk + '"' : '') + '>Kayıt silinsin mi?</p><p class="tk-modal-body">“Ameliyat 2026-09-25” kaydı ve ekleri kalıcı olarak silinir.</p>' +
      '<div class="tk-modal-actions">' + tkDugme('tk-btn-ghost', 'Vazgeç', kapat) + tkDugme('tk-btn-danger', 'Sil', kapat) + '</div></div>';
    const canli =
      '<div class="satir demo-arac">' + tkDugme('tk-btn-primary', 'Onay Penceresini Aç', ' data-eylem="modal"') + '</div>' +
      '<dialog class="demo-modal" data-demo-modal aria-labelledby="' + on + '-modal-baslik">' + govde(on + '-modal-baslik', ' data-modal-kapat') + '</dialog>';
    return (
      blok(on, 'canli', 'Canlı Modal', 'Pencere ölçek ve saydamlıkla temel sürede (' + st.sure.base + ' ms) açılır, hızlı sürede (' + st.sure.fast + ' ms) kapanır. Esc, Vazgeç ya da perdeye tıklama kapatır.', canli) +
      blok(on, 'modal', 'Onay Penceresi', 'Perde üstünde panel; birincil eylem sağda, yıkıcı eylem tehlike renginde.', '<div class="parca-modal">' + govde('', '') + '</div>')
    );
  }

  function tipografiSayfasi(st, on) {
    return tipoBolumu(st, on);
  }

  const SAYFA_IC = {
    renkler: renklerSayfasi,
    dugmeler: dugmelerSayfasi,
    formlar: formlarSayfasi,
    ustcubuk: ustcubukSayfasi,
    ilerleme: ilerlemeSayfasi,
    kaydirma: kaydirmaSayfasi,
    rozetler: rozetlerSayfasi,
    bildirimler: bildirimlerSayfasi,
    kurulum: kurulumSayfasi,
    modal: modalSayfasi,
    tipografi: tipografiSayfasi,
  };

  function farkListesi() {
    const f = farklar();
    const li = f.length ? f.map((x) => '<li>' + x + '</li>').join('') : '<li>Henüz değişiklik yok.</li>';
    return '<div class="farklar"><strong>Değişenler</strong><ul>' + li + '</ul></div>';
  }

  const NOT_KOD = { 'Mükemmel': 'mukemmel', 'İyi': 'iyi', 'Zayıf': 'zayif', 'Kötü': 'kotu' };
  let skorBellek = null;

  function skorlar() {
    const anahtar = JSON.stringify(su.renk);
    if (!skorBellek || skorBellek.anahtar !== anahtar)
      skorBellek = { anahtar, ilk: window.Skor.skorla(T, ilk.renk), su: window.Skor.skorla(T, su.renk) };
    return skorBellek;
  }

  function farkYazi(f) {
    const r = Math.round(f);
    return r > 0 ? '+' + r : r < 0 ? '−' + Math.abs(r) : '±0';
  }

  function farkSinif(f) {
    const r = Math.round(f);
    return r > 0 ? 'fark-arti' : r < 0 ? 'fark-eksi' : 'fark-yok';
  }

  function puanEtiket(p, ek) {
    return '<span class="puan' + (ek ? ' ' + ek : '') + '" data-not="' + NOT_KOD[window.Skor.not(p)] + '">' + Math.round(p) + '</span>';
  }

  const KOMBI_HEDEF = [70, 75, 80, 85, 90, 95, 100];
  const AILE = { blue: [190, 250], pink: [300, 350], purple: [255, 295], success: [120, 160], warning: [30, 52] };
  let kombiHedef = null;
  let kombiAd = null;
  let kombiler = [];
  const ZEMINLER = ['surface', 'black', 'glass-base'];

  const bagliBellek = {};

  function bagliOgeler(ad) {
    if (!bagliBellek[ad]) {
      const dz = (hex) => window.Skor.skorla(T, Object.assign({}, su.renk, { [ad]: hex })).paneller.flatMap((p) => p.ogeler.map((o) => o.puan));
      const a = dz('#000000');
      const b = dz('#ffffff');
      bagliBellek[ad] = new Set(a.map((p, i) => (Math.abs(p - b[i]) > 0.01 ? i : -1)).filter((i) => i >= 0));
    }
    return bagliBellek[ad];
  }

  function renkPuani(r, ad) {
    const sk = window.Skor.skorla(T, Object.assign({}, su.renk, r));
    const bag = bagliOgeler(ad);
    const ogeler = sk.paneller.flatMap((p) => p.ogeler).filter((o, i) => bag.has(i));
    const w = ogeler.reduce((t, o) => t + o.agirlik, 0);
    return { puan: w ? ogeler.reduce((t, o) => t + o.puan * o.agirlik, 0) / w : sk.genel, genel: sk.genel };
  }

  function tekBul(hedef, ad) {
    const rs = (a, b) => a + Math.random() * (b - a);
    const taban = hsl(su.renk[ad]);
    const aile = AILE[ad.replace('-text', '')];
    const koyu = su.koyu !== false;
    let en = null;
    for (let deneme = 0; deneme < 12; deneme++) {
      const h = Math.round(aile ? rs(aile[0], aile[1]) : (taban.h + rs(-30, 30) + 360) % 360);
      const s = Math.round(aile ? rs(45, 95) : Math.max(0, Math.min(100, taban.s + rs(-15, 15))));
      const dene = (l) => {
        const r = { [ad]: hslHex(h, s, l) };
        return Object.assign({ renk: r }, renkPuani(r, ad));
      };
      const [la, lb] = ZEMINLER.includes(ad) ? (koyu ? [0, 40] : [60, 100]) : AILE[ad] ? [30, 85] : [20, 100];
      const liste = [];
      for (let l = la; l <= lb; l++) liste.push(dene(l));
      const uyan = liste.filter((y) => Math.abs(y.puan - hedef) <= 0.5);
      const x = uyan.length ? uyan[Math.floor(Math.random() * uyan.length)] : liste.reduce((a, b) => (Math.abs(b.puan - hedef) < Math.abs(a.puan - hedef) ? b : a));
      if (!en || Math.abs(x.puan - hedef) < Math.abs(en.puan - hedef)) en = x;
      if (Math.abs(x.puan - hedef) <= 0.5) break;
    }
    return en;
  }

  function kombiTohum() {
    const r = (a, b) => a + Math.random() * (b - a);
    const t = {};
    for (const [ad, [a, b]] of Object.entries(AILE)) t[ad] = { h: Math.round(r(a, b)), s: Math.round(r(55, 95)) };
    t.zemin = { h: Math.round(r(0, 360)), s: Math.round(r(8, 35)) };
    t.yazi = { s: Math.round(r(5, 25)) };
    return t;
  }

  function kombiRenk(t, k, koyu) {
    const L = (a, b) => {
      const v = a + (b - a) * k;
      const w = Math.max(0, Math.min(100, v));
      return Math.round((koyu ? w : 100 - w) * 10) / 10;
    };
    const z = t.zemin;
    const r = {
      surface: hslHex(z.h, z.s, L(16, 3)),
      black: hslHex(z.h, z.s, L(8, 1)),
      'glass-base': hslHex(z.h, z.s, L(20, 6)),
      text: hslHex(z.h, t.yazi.s, L(78, 98)),
      disabled: hslHex(z.h, t.yazi.s, L(42, 74)),
    };
    for (const ad of Object.keys(AILE)) r[ad] = hslHex(t[ad].h, t[ad].s, L(52, 90));
    r['pink-text'] = hslHex(t.pink.h, t.pink.s, L(66, 94));
    r['purple-text'] = hslHex(t.purple.h, t.purple.s, L(66, 94));
    return r;
  }

  function kombiBul(hedef) {
    const koyu = su.koyu !== false;
    const puani = (r) => window.Skor.skorla(T, Object.assign({}, su.renk, r)).genel;
    let en = null;
    for (let deneme = 0; deneme < 12; deneme++) {
      const t = kombiTohum();
      let a = -1.5;
      let b = 1;
      let r = kombiRenk(t, 1, koyu);
      let p = puani(r);
      if (p >= hedef) {
        for (let i = 0; i < 22; i++) {
          const m = (a + b) / 2;
          const rm = kombiRenk(t, m, koyu);
          const pm = puani(rm);
          if (pm >= hedef) {
            b = m;
            r = rm;
            p = pm;
          } else a = m;
        }
      }
      if (!en || Math.abs(p - hedef) < Math.abs(en.puan - hedef)) en = { renk: r, puan: p };
      if (Math.abs(p - hedef) <= 0.5) break;
    }
    return en;
  }

  const EGRILER = [[95, '--tk-success'], [90, '--tk-blue'], [85, '--tk-warning']];
  const ALAN_H = 10;
  const ALAN_L = 2.5;
  const alanBellek = {};

  function alanOlc(ad) {
    const s = hsl(su.renk[ad]).s;
    const anahtar = ad + '|' + s + '|' + su.renk.surface + '|' + su.renk.text;
    if (!alanBellek[anahtar]) {
      const izgara = [];
      for (let l = 0; l <= 100; l += ALAN_L) {
        const satir = [];
        for (let h = 0; h <= 360; h += ALAN_H) satir.push(renkPuani({ [ad]: hslHex(h % 360, s, l) }, ad).puan);
        izgara.push(satir);
      }
      alanBellek[anahtar] = { s, izgara };
    }
    return alanBellek[anahtar];
  }

  function egriCiz(ctx, izgara, esik, g, y) {
    const sx = g / (izgara[0].length - 1);
    const sy = y / (izgara.length - 1);
    const nokta = (i, j, i2, j2) => {
      const a = izgara[i][j] - esik;
      const b = izgara[i2][j2] - esik;
      const t = a / (a - b);
      return [(j + (j2 - j) * t) * sx, y - (i + (i2 - i) * t) * sy];
    };
    ctx.beginPath();
    for (let i = 0; i < izgara.length - 1; i++)
      for (let j = 0; j < izgara[0].length - 1; j++) {
        const k = [[i, j], [i, j + 1], [i + 1, j + 1], [i + 1, j]];
        const kenar = [];
        for (let e = 0; e < 4; e++) {
          const [a1, b1] = k[e];
          const [a2, b2] = k[(e + 1) % 4];
          if (izgara[a1][b1] >= esik !== izgara[a2][b2] >= esik) kenar.push(nokta(a1, b1, a2, b2));
        }
        for (let e = 0; e + 1 < kenar.length; e += 2) {
          ctx.moveTo(kenar[e][0], kenar[e][1]);
          ctx.lineTo(kenar[e + 1][0], kenar[e + 1][1]);
        }
      }
    ctx.stroke();
  }

  function alanCiz() {
    const cv = $('#kombi-alan');
    if (!cv || !kombiAd) return;
    const ad = kombiAd;
    const { s, izgara } = alanOlc(ad);
    const ctx = cv.getContext('2d');
    const g = cv.width;
    const y = cv.height;
    const hs = getComputedStyle(document.documentElement);
    const v = (n) => hs.getPropertyValue(n).trim();
    for (let px = 0; px < g; px += 4)
      for (let py = 0; py < y; py += 4) {
        ctx.fillStyle = 'hsl(' + (px / g) * 360 + ', ' + s + '%, ' + (1 - py / y) * 100 + '%)';
        ctx.fillRect(px, py, 4, 4);
      }
    const esikler = EGRILER.concat(EGRILER.some(([e]) => e === kombiHedef) ? [] : [[kombiHedef, '--tk-pink-text']]);
    for (const [esik, renk] of esikler) {
      ctx.setLineDash(renk === '--tk-pink-text' ? [6, 4] : []);
      ctx.strokeStyle = v('--tk-black');
      ctx.lineWidth = 4;
      egriCiz(ctx, izgara, esik, g, y);
      ctx.strokeStyle = v(renk);
      ctx.lineWidth = 2;
      egriCiz(ctx, izgara, esik, g, y);
    }
    ctx.setLineDash([]);
    const isaret = (hex, dolu) => {
      const k = hsl(hex);
      const px = (k.h / 360) * g;
      const py = y - (k.l / 100) * y;
      ctx.beginPath();
      ctx.arc(px, py, dolu ? 6 : 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = v('--tk-black');
      ctx.fillStyle = v('--tk-text');
      if (dolu) ctx.fill();
      ctx.stroke();
    };
    for (const k of kombiler) isaret(k.renk[ad], false);
    isaret(su.renk[ad], true);
  }

  function alanNokta(cv, e) {
    const k = cv.getBoundingClientRect();
    const h = Math.round(Math.max(0, Math.min(1, (e.clientX - k.left) / k.width)) * 360) % 360;
    const l = Math.round(Math.max(0, Math.min(1, 1 - (e.clientY - k.top) / k.height)) * 1000) / 10;
    const hex = hslHex(h, alanOlc(kombiAd).s, l);
    return { hex, puan: renkPuani({ [kombiAd]: hex }, kombiAd).puan };
  }

  function kombiUret(hedef, ad = kombiAd) {
    kombiHedef = hedef;
    kombiAd = ad;
    kombiler = [0, 1, 2, 3, 4].map(() => (ad ? tekBul(hedef, ad) : kombiBul(hedef)));
    kombiCiz();
    if ($('#kombi-pencere').open) alanCiz();
  }

  function onRenkHex(r, ad) {
    try {
      return K.hex(window.Skor.onSec(T, Object.assign({}, su.renk, r), ad).renk);
    } catch {
      return r.black;
    }
  }

  function kombiCiz() {
    const p = $('#kombi-pencere');
    const kart = (k, i) => {
      const r = k.renk;
      const nokta = (ad) => '<span class="kombi-nokta" style="background:' + r[ad] + '"></span>';
      return (
        '<button type="button" class="kombi-kart" data-kombi="' + i + '" aria-label="Palet ' + (i + 1) + ', okunurluk ' + Math.round(k.puan) + '">' +
        '<span class="kombi-sahne" style="background:' + r.surface + ';color:' + r.text + '">' +
        '<span class="kombi-baslik" style="color:' + r.blue + '">Aa</span>' +
        '<span>Gövde <span style="color:' + r['pink-text'] + '">vurgu</span> <span style="color:' + r.disabled + '">pasif</span></span>' +
        '<span class="kombi-dugme" style="background:' + r.blue + ';color:' + onRenkHex(r, 'blue') + '">Uygula</span>' +
        '<span class="kombi-noktalar">' + ['blue', 'pink', 'purple', 'success', 'warning'].map(nokta).join('') + '</span></span>' +
        '<span class="kombi-puan puan" data-not="' + NOT_KOD[window.Skor.not(k.puan)] + '">' + Math.round(k.puan) + '</span></button>'
      );
    };
    const tekKart = (k, i) => {
      const hex = k.renk[kombiAd];
      const r = Object.assign({}, su.renk, k.renk);
      const sahne = ZEMINLER.includes(kombiAd)
        ? '<span class="kombi-sahne" style="background:' + hex + ';color:' + r.text + '"><span class="kombi-baslik">Aa</span><span>Gövde <span style="color:' + r['pink-text'] + '">vurgu</span></span>'
        : '<span class="kombi-sahne" style="background:' + r.surface + ';color:' + r.text + '"><span class="kombi-baslik" style="color:' + hex + '">Aa</span>' +
          (AILE[kombiAd] ? '<span class="kombi-dugme" style="background:' + hex + ';color:' + onRenkHex(r, kombiAd) + '">Uygula</span>' : '<span style="color:' + hex + '">Örnek metin</span>');
      return (
        '<button type="button" class="kombi-kart" data-kombi="' + i + '" aria-label="' + adi(kombiAd) + ' ' + hex + ', okunurluk ' + Math.round(k.puan) + '">' +
        sahne + '<code>' + hex + '</code></span>' +
        '<span class="kombi-puan puan" data-not="' + NOT_KOD[window.Skor.not(k.puan)] + '">' + Math.round(k.puan) + '</span>' +
        '<span class="kaydet-not">Genel ' + Math.round(k.genel) + '</span></button>'
      );
    };
    const ulasilmadi = kombiler.some((k) => Math.abs(k.puan - kombiHedef) > 0.5);
    const kapsam =
      '<div class="oneri" role="group" aria-label="Kapsam">' +
      [[null, 'Tüm Palet']].concat(DUZENLENEN.map((a) => [a, adi(a)]))
        .map(([a, t]) => '<button type="button" class="oneri-dugme" data-kombi-kapsam="' + (a || '') + '" aria-pressed="' + (a === kombiAd) + '"' + (a && !bagliOgeler(a).size ? ' disabled title="Bu renk puanlanan hiçbir yazıyı etkilemiyor"' : '') + '>' + (a ? '<span class="kombi-nokta" style="background:' + su.renk[a] + '"></span>' : '') + t + '</button>')
        .join('') +
      '</div>';
    const ne = kombiAd ? adi(kombiAd) + ' için 5 yeni renk' : '5 yeni rastgele palet';
    const sonra = kombiAd ? ' Puan bu rengin geçtiği öğelerin okunurluğudur. Bir renge basınca yalnız ' + adi(kombiAd) + ' değişir.' : ' Bir palete basınca renkler uygulanır.';
    p.innerHTML =
      '<div class="tk-panel tk-modal kaydet-kutu kombi-kutu">' +
      '<h2 class="tk-h3" id="kombi-baslik">Hedef Okunurluk' + (kombiAd ? ' · ' + adi(kombiAd) : '') + '</h2>' +
      kapsam +
      '<label class="alan kombi-hedef"><span class="alan-ust">Hedef Puan <output data-kombi-hedef-cikti>' + kombiHedef + '</output></span>' +
      '<input type="range" min="50" max="100" step="1" value="' + kombiHedef + '" data-kombi-hedef-aralik aria-label="Hedef Puan"></label>' +
      '<div class="oneri" role="group" aria-label="Hedef puan">' +
      [...new Set(KOMBI_HEDEF.concat(kombiHedef))]
        .sort((x, y) => x - y)
        .map((h) => '<button type="button" class="oneri-dugme" data-kombi-hedef="' + h + '" aria-pressed="' + (h === kombiHedef) + '">' + h + '</button>')
        .join('') +
      '</div>' +
      '<p class="kaydet-not">Her tıklamada ' + kombiHedef + ' puanı veren ' + ne + '.' + sonra +
      (ulasilmadi ? ' Bazıları hedefe ulaşamadı; en yakın puan gösterildi.' : '') + '</p>' +
      (kombiAd
        ? '<figure class="kombi-alan-kap"><canvas id="kombi-alan" width="720" height="200" aria-label="' + adi(kombiAd) + ' okunurluk eğrileri: yatay ton, dikey açıklık"></canvas>' +
          '<figcaption class="kombi-lejant">' +
          EGRILER.map(([e, r]) => '<span style="border-top-color:var(' + r + ')">' + e + '</span>').join('') +
          (EGRILER.some(([e]) => e === kombiHedef) ? '' : '<span class="kombi-lejant-hedef">' + kombiHedef + ' (hedef)</span>') +
          '<span class="kombi-alan-bilgi" data-kombi-alan-bilgi>Yatay ton, dikey açıklık · Tıkla: o rengi uygula</span></figcaption></figure>'
        : '') +
      '<div class="kombi-izgara">' + kombiler.map(kombiAd ? tekKart : kart).join('') + '</div>' +
      '<div class="tk-installer__actions"><button type="button" class="tk-btn tk-btn-ghost" data-kombi-kapat>Kapat</button>' +
      '<button type="button" class="tk-btn tk-btn-primary" data-kombi-yenile>' + (kombiAd ? 'Yeni 5 Renk' : 'Yeni 5 Palet') + '</button></div></div>';
  }

  function kombiAc(hedef, ad = null) {
    const p = $('#kombi-pencere');
    kombiUret(hedef, ad);
    requestAnimationFrame(alanCiz);
    if (!p.open) p.showModal();
  }

  function kombiOlaylar() {
    const p = $('#kombi-pencere');
    p.addEventListener('change', (e) => {
      if (e.target.matches('[data-kombi-hedef-aralik]')) kombiUret(Number(e.target.value));
    });
    p.addEventListener('input', (e) => {
      if (e.target.matches('[data-kombi-hedef-aralik]')) $('[data-kombi-hedef-cikti]', p).textContent = e.target.value;
    });
    p.addEventListener('pointermove', (e) => {
      if (e.target.id !== 'kombi-alan') return;
      const n = alanNokta(e.target, e);
      $('[data-kombi-alan-bilgi]', p).textContent = n.hex + ' · okunurluk ' + Math.round(n.puan);
    });
    p.addEventListener('click', (e) => {
      if (e.target.id === 'kombi-alan') {
        const n = alanNokta(e.target, e);
        su.renk[kombiAd] = n.hex;
        delete hslBellek[kombiAd];
        renkEsle(kombiAd);
        planla();
        alanCiz();
        durum(adi(kombiAd) + ' ' + n.hex + ', okunurluk ' + Math.round(n.puan) + ' uygulandı. Tümünü Sıfırla token dosyasına döner.');
        return;
      }
      const h = e.target.closest('[data-kombi-hedef]');
      if (h) return kombiUret(Number(h.dataset.kombiHedef));
      const kp = e.target.closest('[data-kombi-kapsam]');
      if (kp) return kombiUret(kombiHedef, kp.dataset.kombiKapsam || null);
      if (e.target.closest('[data-kombi-yenile]')) return kombiUret(kombiHedef);
      if (e.target.closest('[data-kombi-kapat]') || e.target === p) return p.close();
      const k = e.target.closest('[data-kombi]');
      if (!k) return;
      const s = kombiler[Number(k.dataset.kombi)];
      Object.assign(su.renk, s.renk);
      for (const ad of Object.keys(hslBellek)) delete hslBellek[ad];
      formDoldur();
      planla();
      p.close();
      durum((kombiAd ? adi(kombiAd) + ' ' + s.renk[kombiAd] + ', okunurluk ' + Math.round(s.puan) + ' uygulandı.' : 'Okunurluk ' + Math.round(s.puan) + ' paleti uygulandı.') + ' Tümünü Sıfırla token dosyasına döner.');
    });
  }

  function okunurGuncelle() {
    const y = $('#okunur-puan');
    if (!y || !window.Skor) return;
    const s = skorlar();
    y.textContent = String(Math.round(s.su.genel));
    y.dataset.not = NOT_KOD[s.su.not];
  }

  function okunurGezinti() {
    const b = [['genel', 'Genel'], ['etki', 'En Çok Etkilenenler'], ['zayif', 'Zayıf Parçalar'], ['paneller', 'Paneller']];
    return '<nav class="gezinti" aria-label="Okunurluk">' + b.map(([id, ad]) => '<a href="#o-' + id + '">' + ad + '</a>').join('') + '</nav>';
  }

  function okunurSayfasi() {
    const { ilk: A, su: B } = skorlar();
    const f = Math.round(B.genel) - Math.round(A.genel);
    const kutu = (etiket, ic, alt) => '<div class="okunur-kutu"><span class="bilesen-ad">' + etiket + '</span>' + ic + '<span class="okunur-not">' + alt + '</span></div>';
    const olcek =
      '<div class="okunur-olcek">' +
      [['kotu', 0, 49, '0–49 · Kötü'], ['zayif', 50, 69, '50–69 · Zayıf'], ['iyi', 70, 89, '70–89 · İyi'], ['mukemmel', 90, 100, '90–100 · Mükemmel']]
        .map(([k, a, b, t]) => '<button type="button" data-not="' + k + '" data-olcek="' + a + ',' + b + '" title="Tıkla: bu noktadaki puanı veren 5 palet">' + t + '</button>')
        .join('') +
      '</div>';
    const genel =
      '<section class="bolum" id="o-genel"><h2>Genel Okunurluk</h2>' +
      '<p>Puan 0 ile 100 arasıdır; yüksek daha iyidir. 70 ve üstü standardı geçer. Bir parça uygulamalarda ne kadar sık görünüyorsa (×1 – ×10) puana o kadar ağır katılır: gövde yazısı, sekmeler, birincil düğme ve giriş kutusu en ağırlarıdır.</p>' +
      '<div class="okunur-ozet">' +
      kutu('Şu Anki Ayar', puanEtiket(B.genel, 'puan-buyuk'), B.not) +
      kutu('Token Dosyası', puanEtiket(A.genel, 'puan-buyuk'), A.not) +
      kutu('Fark', '<span class="puan puan-buyuk ' + farkSinif(f) + '">' + farkYazi(f) + '</span>', f > 0 ? 'Daha okunur' : f < 0 ? 'Daha az okunur' : 'Değişmedi') +
      '</div>' + olcek +
      '<p class="okunur-dip">Her parçanın puanı yazı renginin zeminine karşıtlığından gelir: 3:1 → 30, 4.5:1 → 50, 7:1 → 70, 12:1 → 90, 18:1 ve üstü → 100. Büyük başlıklar daha az karşıtlıkla da okunduğu için aynı renkte daha yüksek puan alır.</p></section>';
    const cift = B.paneller.flatMap((p, i) => p.ogeler.map((o, j) => ({ panel: p.ad, a: A.paneller[i].ogeler[j], b: o })));
    const ornek = (o) => '<span class="okunur-ornek" style="color: ' + o.on + '; background: ' + o.arka + '">Aa</span>';
    const satir = (x, ilkSutun) => '<tr><th scope="row">' + ornek(x.b) + x.b.ad + (ilkSutun ? '<span class="okunur-panel-ad">' + x.panel + '</span>' : '') + '</th><td>×' + x.b.agirlik + '</td><td>' + puanEtiket(x.a.puan) + '</td><td>' + puanEtiket(x.b.puan) + '</td><td class="' + farkSinif(x.b.puan - x.a.puan) + '">' + farkYazi(x.b.puan - x.a.puan) + '</td></tr>';
    const tablo = (satirlar, ilkSutun) => '<table class="okunur-tablo"><thead><tr><th scope="col">Parça</th><th scope="col">Kullanım</th><th scope="col">Önce</th><th scope="col">Şimdi</th><th scope="col">Fark</th></tr></thead><tbody>' + satirlar.map((x) => satir(x, ilkSutun)).join('') + '</tbody></table>';
    const etkilenen = cift
      .filter((x) => Math.round(x.b.puan) !== Math.round(x.a.puan))
      .sort((x, y) => Math.abs((y.b.puan - y.a.puan) * y.b.agirlik) - Math.abs((x.b.puan - x.a.puan) * x.b.agirlik))
      .slice(0, 8);
    const etki =
      '<section class="bolum" id="o-etki"><h2>En Çok Etkilenenler</h2>' +
      (etkilenen.length ? '<p>Renk değişiminin puanı en çok oynattığı parçalar; kullanım ağırlığı ile çarpılarak sıralanır.</p>' + tablo(etkilenen, true) : '<p>Şu anki ayar token dosyasıyla aynı puanı veriyor; bir renk değiştirince burada hangi parçaların etkilendiği görünür.</p>') +
      '</section>';
    const zayiflar = cift
      .filter((x) => x.b.puan < 70)
      .sort((x, y) => (70 - y.b.puan) * y.b.agirlik - (70 - x.b.puan) * x.b.agirlik);
    const zayif =
      '<section class="bolum" id="o-zayif"><h2>Zayıf Parçalar</h2>' +
      (zayiflar.length ? '<p>70 puanın altında kalan parçalar; en üstteki düzeltildiğinde genel puan en çok artar.</p>' + tablo(zayiflar, true) : '<p>70 puanın altında parça yok.</p>') +
      '</section>';
    const kart = (pa, pb) =>
      '<article class="okunur-panel"><header class="okunur-panel-ust"><h3>' + pb.ad + '</h3>' + puanEtiket(pb.puan, 'puan-orta') +
      '<span class="' + farkSinif(pb.puan - pa.puan) + '">' + farkYazi(pb.puan - pa.puan) + '</span></header>' +
      '<div class="okunur-cubuk" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pb.puan) + '" aria-label="' + pb.ad + ' okunurluk"><span data-not="' + NOT_KOD[window.Skor.not(pb.puan)] + '" style="inline-size: ' + pb.puan.toFixed(1) + '%"></span></div>' +
      '<p class="okunur-not">Kullanım payı ' + pb.agirlik + ' / ' + B.paneller.reduce((t, p) => t + p.agirlik, 0) + '</p>' +
      tablo(pb.ogeler.map((o, j) => ({ panel: pb.ad, a: pa.ogeler[j], b: o })), false) + '</article>';
    const paneller =
      '<section class="bolum" id="o-paneller"><h2>Paneller</h2><p>Her panelin puanı kendi parçalarının kullanım ağırlıklı ortalamasıdır.</p>' +
      '<div class="okunur-paneller">' + B.paneller.map((p, i) => kart(A.paneller[i], p)).join('') + '</div></section>';
    return okunurGezinti() + genel + etki + zayif + paneller;
  }

  let ilerlemeDeger = 0;

  function akisCtx() {
    return {
      egri: su.egri,
      ilkEgri: ilk.egri,
      sure: Object.assign({}, su.sure),
      sistemAz: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      duzenle: egriDuzenle,
      guncel: akisCtx,
    };
  }

  function zamanla(fn, ms) {
    const z = setTimeout(() => {
      zamanlar.delete(z);
      fn();
    }, ms);
    zamanlar.add(z);
    return z;
  }

  function sayfaBirak() {
    if (window.Teknik) window.Teknik.durdur();
    if (A()) A().durdur();
    for (const z of zamanlar) clearTimeout(z);
    zamanlar.clear();
    ilerlemeNo++;
    ilerlemeDeger = 0;
    for (const k of akis.keys()) if (k !== 'kaydet') akis.delete(k);
  }

  function sayfaIcerik(st, on) {
    const f = SAYFA_IC[sayfa];
    return f ? f(st, on) : '';
  }

  function ciz() {
    bekleyen = false;
    const t0 = performance.now();
    const kok = $('#onizleme');
    uygula(kok, su, true);
    uygula(document.documentElement, su, false);
    const ayni = kok.dataset.sayfa === sayfa;
    if (ayni && sayfa === 'akicilik' && A() && $('[data-akis]', kok)) {
      A().guncelle(kok, akisCtx());
      return cizBitti(t0);
    }
    if (ayni && sayfa === 'teknik' && window.Teknik && window.Teknik.calisiyor()) {
      window.Teknik.renkYenile();
      return cizBitti(t0);
    }
    if (!ayni) sayfaBirak();
    const kaydirma = ayni ? kok.scrollTop : 0;
    const karsi = kip === 'karsi' && !TEK.includes(sayfa);
    let html;
    if (sayfa === 'arka') html = arkaSayfasi(su);
    else if (sayfa === 'okunur') html = okunurSayfasi();
    else if (sayfa === 'akicilik') html = A() ? A().sayfa(akisCtx()) : '<p>Akıcılık modülü yüklenemedi.</p>';
    else if (sayfa === 'teknik') html = window.Teknik ? window.Teknik.sayfa() : '<p>Teknik modülü yüklenemedi.</p>';
    else if (karsi)
      html =
        farkListesi() +
        '<div class="karsi"><section class="sahne" id="sahne-once" aria-label="Önce"><h2 class="sahne-baslik">Önce · Token Dosyası</h2>' + sayfaIcerik(ilk, 'o') + '</section>' +
        '<section class="sahne" id="sahne-sonra" aria-label="Sonra"><h2 class="sahne-baslik">Sonra · Şu Anki Ayar</h2>' + sayfaIcerik(su, 's') + '</section></div>';
    else html = sayfaIcerik(su, 's');
    const ad = SAYFALAR.find((x) => x[0] === sayfa)[1];
    const bas = TEK.includes(sayfa) ? '' : '<header class="sayfa-ust"><h1 class="sayfa-baslik">' + ad + '</h1></header>';
    kok.innerHTML = '<div class="sayfa' + (ayni ? '' : ' sayfa-gir') + '" data-bilesen="' + sayfa + '">' + bas + html + '</div>';
    if (karsi) {
      uygula($('#sahne-once'), ilk, true);
      uygula($('#sahne-sonra'), su, true);
    }
    kok.dataset.sayfa = sayfa;
    kok.scrollTop = kaydirma;
    if (sayfa === 'akicilik' && A()) A().bagla(kok, akisCtx());
    if (sayfa === 'teknik' && window.Teknik) window.Teknik.baslat($('.teknik', kok) || kok);
    $$('[data-hedef]', kok).forEach((el, i) => {
      el.dataset.anahtar = 'i' + i;
      if (!el.hasAttribute('data-demo-ilerleme')) akit(el, Number(el.dataset.hedef), el.dataset.anahtar);
    });
    if (sayfa === 'ilerleme') {
      if (ayni) for (const el of $$('[data-demo-ilerleme]', kok)) ilerlemeYaz(el, ilerlemeDeger);
      else ilerlemeOynat();
    }
    cizBitti(t0);
  }

  function cizBitti(t0) {
    sonCizim = performance.now() - t0;
    kaydetGuncelle();
    okunurGuncelle();
  }

  function planla() {
    if (bekleyen) return;
    bekleyen = true;
    requestAnimationFrame(ciz);
  }

  function ilerlemeYaz(el, deger) {
    const bitti = deger >= 100;
    el.dataset.status = bitti ? 'done' : 'running';
    $('.tk-progress__step', el).textContent = bitti ? 'Aktarım bitti' : deger === 0 ? 'Başlamaya hazır' : 'Dosyalar aktarılıyor · ' + deger + ' / 100';
    $('.tk-progress__track', el).setAttribute('aria-valuenow', String(deger));
    el.dataset.hedef = String(deger);
    akit(el, deger, el.dataset.anahtar);
  }

  const DEMO_SICRAMA = [3, 8, 1, 12, 5, 2, 9, 4, 15, 6];

  function ilerlemeOynat() {
    const no = ++ilerlemeNo;
    ilerlemeDeger = 0;
    let i = 0;
    for (const el of $$('#onizleme [data-demo-ilerleme]')) akis.delete(el.dataset.anahtar);
    const adim = () => {
      if (no !== ilerlemeNo || sayfa !== 'ilerleme') return;
      for (const el of $$('#onizleme [data-demo-ilerleme]')) ilerlemeYaz(el, ilerlemeDeger);
      if (ilerlemeDeger >= 100) return;
      ilerlemeDeger = Math.min(100, ilerlemeDeger + DEMO_SICRAMA[i++ % DEMO_SICRAMA.length]);
      zamanla(adim, su.sure.slow);
    };
    adim();
  }

  const akis = new Map();
  const ONDALIK = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let akisKare = 0;
  let akisOnceki = 0;

  function akisYaz(d) {
    if (!d.el.isConnected) return;
    const dolgu = $('.tk-progress__fill', d.el);
    if (dolgu) dolgu.style.setProperty('--tk-progress-value', String(d.goster / 100));
    const yuzde = $('.tk-progress__percent, .tk-installer__percent', d.el);
    if (yuzde) yuzde.textContent = ONDALIK.format(d.goster) + '%';
  }

  function akit(el, hedef, anahtar) {
    let d = akis.get(anahtar);
    if (!d) {
      d = { goster: 0, hedef: 0 };
      akis.set(anahtar, d);
    }
    d.el = el;
    d.hedef = hedef;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.goster = hedef;
    akisYaz(d);
    if (d.goster !== d.hedef && !akisKare) {
      akisOnceki = performance.now();
      akisKare = requestAnimationFrame(akisAdim);
    }
  }

  function akisAdim(t) {
    const dt = Math.min(64, Math.max(0, t - akisOnceki));
    akisOnceki = t;
    const k = 1 - Math.exp(-dt / (su.sure.slow / 2));
    let surer = false;
    for (const d of akis.values()) {
      if (d.goster === d.hedef) continue;
      const fark = d.hedef - d.goster;
      d.goster = Math.abs(fark) < 0.05 ? d.hedef : d.goster + fark * k;
      akisYaz(d);
      if (d.goster !== d.hedef) surer = true;
    }
    akisKare = surer ? requestAnimationFrame(akisAdim) : 0;
  }

  function sonraki(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function bildirimKapat(el) {
    if (!el || el.dataset.tkKapaniyor) return;
    el.dataset.tkKapaniyor = '1';
    let bitti = false;
    const sil = () => {
      if (bitti) return;
      bitti = true;
      el.remove();
    };
    el.addEventListener('transitionend', sil, { once: true });
    setTimeout(sil, su.sure.instant + 120);
  }

  function bildirimGoster(dugme) {
    const yigin = $('[data-bildirim-yigin]', dugme.closest('.bolum'));
    if (!yigin) return;
    const tur = dugme.dataset.tur;
    const canli = $$('.tk-toast:not([data-tk-kapaniyor])', yigin);
    if (canli.length >= T.metric['toast-max'].value) bildirimKapat(canli[0]);
    yigin.insertAdjacentHTML('beforeend', bildirimHtml(tur));
    const el = yigin.lastElementChild;
    el.dataset.tkGiriyor = '1';
    sonraki(() => delete el.dataset.tkGiriyor);
    if (tur === 'danger') return;
    const omur = T.metric['toast-life'].value;
    let z = zamanla(() => bildirimKapat(el), omur);
    el.addEventListener('mouseenter', () => {
      clearTimeout(z);
      zamanlar.delete(z);
    });
    el.addEventListener('mouseleave', () => {
      z = zamanla(() => bildirimKapat(el), omur / 2);
    });
  }

  function modalAc(dugme) {
    const d = $('[data-demo-modal]', dugme.closest('.bolum'));
    if (!d || d.open) return;
    const m = $('.tk-modal', d);
    m.dataset.tkGiriyor = '1';
    d.showModal();
    sonraki(() => delete m.dataset.tkGiriyor);
  }

  function modalKapat(d) {
    const m = $('.tk-modal', d);
    if (!d.open || m.dataset.tkKapaniyor) return;
    m.dataset.tkKapaniyor = '1';
    let bitti = false;
    const son = () => {
      if (bitti) return;
      bitti = true;
      d.close();
      delete m.dataset.tkKapaniyor;
    };
    m.addEventListener('transitionend', son, { once: true });
    setTimeout(son, su.sure.fast + 120);
  }

  function navKur() {
    $('#bilesen-liste').innerHTML =
      '<ul class="bilesen-ul">' +
      SAYFALAR.map(
        ([id, ad]) =>
          '<li><button type="button" class="bilesen-oge" data-git="' + id + '"><span>' + ad + '</span>' +
          (id === 'okunur' ? '<span class="puan puan-kucuk" id="okunur-puan" title="Tıkla: hedef puana göre 5 renk paleti"></span>' : '') + '</button></li>'
      ).join('') +
      '</ul>';
  }

  function navGuncelle() {
    for (const b of $$('[data-git]')) {
      if (b.dataset.git === sayfa) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
    for (const x of $$('[data-kip]')) {
      const kapali = TEK.includes(sayfa);
      if (kapali) x.setAttribute('aria-disabled', 'true');
      else x.removeAttribute('aria-disabled');
      x.title = kapali ? 'Bu bileşen tek görünümdür' : '';
    }
  }

  function grupSirala() {
    const ilgili = ILGILI[sayfa] || [];
    const sira = (g) => {
      const i = ilgili.indexOf(g);
      if (i >= 0) return i;
      if (g.startsWith('renk-') && ilgili.includes('renk')) return ilgili.indexOf('renk');
      return -1;
    };
    for (const d of $$('#ayarlar [data-grup]')) {
      const i = sira(d.dataset.grup);
      d.style.order = String(i >= 0 ? 1 + i : 60);
      d.classList.toggle('grup-ilgili', i >= 0);
      if (i >= 0 && !d.dataset.grup.startsWith('renk-')) d.open = true;
    }
    $('[data-ayrac="ilgili"]').style.order = '0';
    $('[data-ayrac="diger"]').style.order = '50';
    const sag = $('.sag');
    if (sag) sag.scrollTop = 0;
  }

  function hashYaz() {
    const p = new URLSearchParams(location.hash.slice(1));
    p.set('sayfa', sayfa);
    p.set('kip', kip);
    p.set('arka', su.arka.tur);
    p.delete('bolum');
    history.replaceState(null, '', '#' + p.toString());
  }

  function sayfaAc(id) {
    if (!SAYFALAR.some((x) => x[0] === id)) return;
    sayfa = id;
    navGuncelle();
    grupSirala();
    hashYaz();
    planla();
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
      '<details class="grup" data-grup="renk-' + ad + '"' + acik + '><summary><span><span class="nokta" data-nokta="' + ad + '"></span>' + etiket + '</span><code data-hexgoster="' + ad + '"></code></summary>' +
      '<div class="grup-ic">' +
      '<div class="satir"><input type="color" class="secici" data-renk="' + ad + '" data-alan="secici" aria-label="' + adi(ad) + ' Renk Seçici">' +
      '<input type="text" class="giris hex" data-renk="' + ad + '" data-alan="hex" maxlength="7" spellcheck="false" aria-label="' + adi(ad) + ' Hex">' +
      '<button type="button" class="arac-dugme" data-geri="' + ad + '">Geri Al</button></div>' +
      '<div class="oneri" role="group" aria-label="' + adi(ad) + ' Tema Önerileri" data-oneri-renk="' + ad + '"></div>' +
      '<button type="button" class="arac-dugme" data-kombi-renk="' + ad + '">Hedef Okunurluk: 5 Alternatif</button>' +
      kaydirici('h', 360, 'Ton (H)') + kaydirici('s', 100, 'Doygunluk (S)') + kaydirici('l', 100, 'Açıklık (L)') + tur +
      '</div></details>'
    );
  }

  function aralik(id, etiket, min, max, adim) {
    return (
      '<label class="alan"><span class="alan-ust">' + etiket + ' <output id="o-' + id + '"></output></span>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + adim + '"></label>' +
      '<div class="oneri" role="group" aria-label="' + etiket + ' Önerileri" data-oneri-aralik="' + id + '"></div>'
    );
  }

  function secim(id, etiket, secenekler) {
    return (
      '<label class="alan"><span class="alan-ust">' + etiket + '</span><select class="giris" id="' + id + '">' +
      secenekler.map(([d, a]) => '<option value="' + d + '">' + a + '</option>').join('') + '</select></label>'
    );
  }

  const EGRI_ALAN = ['x1', 'y1', 'x2', 'y2'];

  function egriAdlari() {
    return Object.keys(su.egri).map((ad) => [ad, (A() ? A().adi(ad) : ad) + ' (' + ad + ')']);
  }

  function formKur() {
    const AL = aileler();
    const f = $('#ayarlar');
    const grup = (id, baslik, ic) => '<details class="grup" data-grup="' + id + '"><summary>' + baslik + '</summary><div class="grup-ic">' + ic + '</div></details>';
    const parlama = PARLAMALAR.map(
      ([g, ad]) =>
        '<p class="alt-baslik">' + ad + '</p>' + aralik('parlama-' + g + '-alpha', 'Saydamlık', 0, 1, 0.01) + aralik('parlama-' + g + '-blur', 'Bulanıklık (px)', 0, 48, 1)
    ).join('');
    const egriK = (k, min, max) => aralik('egri-' + k, k.toLocaleUpperCase('tr'), min, max, 0.01);
    f.innerHTML =
      '<p class="grup-ayrac" data-ayrac="ilgili">Bu Bileşenin Ayarları</p>' +
      '<p class="grup-ayrac" data-ayrac="diger">Diğer Ayarlar</p>' +
      '<p class="grup-ayrac sihirbaz-ayrac" data-ayrac="sihirbaz" hidden></p>' +
      DUZENLENEN.map(renkDenetimi).join('') +
      grup(
        'arka',
        'Arka Plan',
        secim('arka-tur', 'Tasarım', ARKALAR) +
          aralik('arka-durak', 'Degrade Durakları', 2, 32, 1) +
          aralik('arka-aci', 'Açı (Derece)', 0, 360, 1) +
          '<label class="secim"><input type="checkbox" id="arka-don"> Arka Plan Salınsın (150–170°, 48 sn)</label>' +
          [['black', 'Üst Uç (Siyah)'], ['surface', 'Alt Uç (Yüzey)']].map(([ad, et]) =>
            '<div class="alan"><span class="alan-ust">' + et + '</span><div class="satir"><input type="color" class="secici" data-renk="' + ad + '" data-alan="secici" aria-label="Degrade ' + et + ' Renk Seçici">' +
            '<input type="text" class="giris hex" data-renk="' + ad + '" data-alan="hex" maxlength="7" spellcheck="false" aria-label="Degrade ' + et + ' Hex"></div></div>'
          ).join('') +
          '<p class="ipucu">Degrade üstten Siyaha, alttan Yüzey rengine akar. Yüzey rengi paneller ve kutuların da zeminidir; alt ucu değiştirmek onları da değiştirir.</p>'
      ) +
      grup(
        'parlama',
        'Parlama',
        secim('parlama-duzey', 'Parlama Düzeyi', PARLAMA_DUZEY) + parlama +
          '<p class="ipucu">Kaydırma çubuğunda hale yoktur; düzey yalnız kutu, düğme ve kahraman yazısına uygulanır.</p>'
      ) +
      grup(
        'hareket',
        'Hareket',
        secim('arayuz-egri', 'Arayüz Eğrisi (Geçişler)', egriAdlari()) +
          aralik('sure-carpan', 'Süre Çarpanı', 0.5, 2, 0.05) +
          SURELER.map(([k, ad]) => aralik('sure-' + k, ad + ' Süre (ms)', 0, 2000, 10)).join('') +
          '<label class="secim"><input type="checkbox" id="hareket-az"> Hareketi Azalt</label>' +
          '<p class="ipucu">Hareketi azalt geçişleri, salınımı ve yumuşak kaydırmayı kapatır. Yalnız transform ve opacity canlanır.</p>'
      ) +
      grup(
        'egri',
        'Eğri Düzenleyici',
        secim('egri-sec', 'Eğri', egriAdlari()) +
          '<svg class="egri-mini" viewBox="0 -40 100 180" aria-hidden="true"><path class="egri-mini-izgara" d="M0,0 H100 M0,100 H100 M0,100 L100,0"/><path class="egri-mini-yol" id="egri-mini-yol" d=""/></svg>' +
          egriK('x1', 0, 1) + egriK('y1', -1, 2) + egriK('x2', 0, 1) + egriK('y2', -1, 2) +
          '<div class="satir"><code class="mono" id="egri-deger"></code><button type="button" class="arac-dugme" data-egri-geri>Geri Al</button></div>' +
          '<p class="ipucu">X değerleri 0–1 arasıdır; Y 1’i aşarsa eğri hedefi geçip geri döner.</p>'
      ) +
      grup(
        'yazi',
        'Yazı',
        secim('yazi-aile', 'Yazı Ailesi', Object.entries(AL).map(([k, v]) => [k, v[0]])) +
          aralik('yazi-carpan', 'Boyut Çarpanı', 0.8, 1.4, 0.05) +
          '<p class="ipucu mono" id="yazi-olcek"></p>' +
          secim('yazi-govde', 'Gövde Ağırlığı', [[300, '300'], [400, '400'], [500, '500']]) +
          secim('yazi-yari', 'Başlık / Etiket Ağırlığı', [[500, '500'], [600, '600'], [700, '700']]) +
          secim('yazi-kahraman', 'Kahraman Ağırlığı', [[700, '700'], [800, '800'], [900, '900']]) +
          '<p class="ipucu uyari" id="yazi-uyari" hidden>Standart 700 ağırlığı yalnız kahraman için tanır.</p>'
      ) +
      grup('sekil', 'Köşe Yarıçapı', aralik('sekil-r', 'Yarıçap (r)', 0, 20, 1) + aralik('sekil-rp', 'Pencere Yarıçapı', 0, 24, 1)) +
      grup('yogunluk', 'Yoğunluk Ve Kenar', aralik('yogunluk', 'Yoğunluk (Boşluk Çarpanı)', 0.75, 1.5, 0.05) + aralik('kenar', 'Kenar Kalınlığı (px)', 0, 3, 1)) +
      grup(
        'pencere',
        'Pencere Ve Üst Çubuk',
        secim('pencere-kenar', 'Pencere Kenarı (Büyütülmemişken)', [['border-strong', 'Güçlü Kenar'], ['blue', 'Mavi'], ['pink', 'Pembe'], ['purple', 'Mor'], ['yok', 'Yok']]) +
          aralik('pencere-cubuk', 'Üst Çubuk Yüksekliği (px)', 20, 48, 1)
      ) +
      grup('dugme', 'Düğme Boyutu', aralik('dugme-h', 'Düğme Yüksekliği (px)', 24, 64, 1) + aralik('dugme-px', 'Yatay Dolgu (px)', 8, 40, 1)) +
      grup('yuzey', 'Yüzey', aralik('cam', 'Cam Bulanıklığı (px)', 0, 48, 1) + aralik('golge', 'Gölge Gücü', 0, 2, 0.05)) +
      grup(
        'kaydir',
        'Kaydırma',
        aralik('kay-kalinlik', 'Çubuk Kalınlığı (px)', 2, 20, 1) +
          secim('kay-renk', 'Çubuk Rengi', KAYDIRMA_RENK) +
          secim('kay-bicim', 'Çubuk Biçimi', BICIMLER) +
          '<fieldset class="alan"><legend>Kaydırma Davranışı</legend>' +
          '<label class="secim"><input type="radio" name="kay-davranis" value="smooth"> Yumuşak (smooth)</label>' +
          '<label class="secim"><input type="radio" name="kay-davranis" value="auto"> Anında (auto)</label></fieldset>'
      );
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
    for (const b of $$('[data-oneri-hedef="' + ad + '"]')) b.setAttribute('aria-pressed', String(b.dataset.oneriHex === hex));
  }

  function egriDoldur() {
    const ad = $('#egri-sec').value;
    const b = su.egri[ad];
    if (!b) return;
    EGRI_ALAN.forEach((k, i) => {
      $('#egri-' + k).value = b[i];
      $('#o-egri-' + k).textContent = r2(b[i]).toFixed(2);
    });
    $('#egri-mini-yol').setAttribute('d', A() ? A().yol(b) : '');
    $('#egri-deger').textContent = egriMetin(b);
    $('[data-egri-geri]').disabled = !ilk.egri[ad] || egriMetin(ilk.egri[ad]) === egriMetin(b);
  }

  function egriDuzenle(ad) {
    if (!su.egri[ad]) return;
    $('#egri-sec').value = ad;
    egriDoldur();
    const g = $('[data-grup="egri"]');
    g.open = true;
    g.scrollIntoView({ block: 'nearest' });
    $('#egri-x1').focus();
  }

  function ayarDoldur() {
    $('#arka-tur').value = su.arka.tur;
    $('#arka-durak').value = su.arka.durak;
    $('#arka-aci').value = su.arka.aci;
    $('#arka-don').checked = su.arka.don;
    $('#parlama-duzey').value = su.parlamaDuzey;
    for (const [g] of PARLAMALAR) {
      $('#parlama-' + g + '-alpha').value = su.parlama[g].alpha;
      $('#parlama-' + g + '-blur').value = su.parlama[g].blur;
    }
    $('#arayuz-egri').value = su.arayuzEgri;
    $('#sure-carpan').value = su.sureCarpan;
    for (const [k] of SURELER) $('#sure-' + k).value = su.sure[k];
    $('#hareket-az').checked = su.hareketAz;
    $('#yazi-aile').value = su.yazi.aile;
    $('#yazi-carpan').value = su.yazi.carpan;
    $('#yazi-govde').value = su.yazi.govde;
    $('#yazi-yari').value = su.yazi.yari;
    $('#yazi-kahraman').value = su.yazi.kahraman;
    $('#sekil-r').value = su.sekil.r;
    $('#sekil-rp').value = su.sekil.rPencere;
    $('#yogunluk').value = su.yogunluk;
    $('#kenar').value = su.kenar;
    $('#pencere-kenar').value = su.pencere.kenar;
    $('#pencere-cubuk').value = su.pencere.cubuk;
    $('#dugme-h').value = su.dugme.h;
    $('#dugme-px').value = su.dugme.px;
    $('#cam').value = su.cam;
    $('#golge').value = su.golge;
    $('#kay-kalinlik').value = su.kaydir.kalinlik;
    $('#kay-renk').value = su.kaydir.renk;
    $('#kay-bicim').value = su.kaydir.bicim;
    for (const r of $$('[name="kay-davranis"]')) r.checked = r.value === su.kaydir.davranis;
    egriDoldur();
  }

  function formDoldur() {
    for (const ad of DUZENLENEN) renkEsle(ad);
    ayarDoldur();
    ciktilar();
    renkOneriCiz();
  }

  const oneriTaban = {};

  function oneriKur() {
    for (const el of $$('#ayarlar input[type="range"][id]')) {
      const kutu = $('[data-oneri-aralik="' + el.id + '"]');
      if (!kutu) continue;
      const min = Number(el.min), max = Number(el.max), adim = Number(el.step) || 1;
      const taban = Number(el.value);
      oneriTaban[el.id] = taban;
      const basamak = (String(adim).split('.')[1] || '').length;
      const yuvarla = (v) => Number((Math.round((v - min) / adim) * adim + min).toFixed(basamak));
      const d = [0, 0.25, 0.5, 0.75, 1].map((p) => yuvarla(min + (max - min) * p));
      let en = 0;
      for (let i = 1; i < d.length; i++) if (Math.abs(d[i] - taban) < Math.abs(d[en] - taban)) en = i;
      d[en] = taban;
      kutu.innerHTML = [...new Set(d)]
        .map((v) => '<button type="button" class="oneri-dugme' + (v === taban ? ' oneri-taban' : '') + '" data-oneri-id="' + el.id + '" data-deger="' + v + '" aria-pressed="false"' + (v === taban ? ' title="Token değeri"' : '') + '>' + v.toLocaleString('tr-TR') + '</button>')
        .join('');
    }
    oneriIsaretle();
  }

  function oneriIsaretle() {
    for (const b of $$('#ayarlar [data-oneri-id]')) {
      const el = document.getElementById(b.dataset.oneriId);
      b.setAttribute('aria-pressed', String(!!el && Number(el.value) === Number(b.dataset.deger)));
    }
  }

  function renkOneriCiz() {
    const tur = su.koyu ? 'koyu' : 'acik';
    for (const kutu of $$('#ayarlar [data-oneri-renk]')) {
      const ad = kutu.dataset.oneriRenk;
      const gorulen = new Set();
      const liste = [];
      for (const t of temalar) {
        const hex = t.tur === tur && t.renk && t.renk[ad] ? String(t.renk[ad]).toLocaleLowerCase('en') : null;
        if (!hex || !/^#[0-9a-f]{6}$/.test(hex) || gorulen.has(hex) || liste.length >= 5) continue;
        gorulen.add(hex);
        liste.push([hex, t.baslik]);
      }
      kutu.innerHTML = liste
        .map(([hex, ad2]) => '<button type="button" class="oneri-renk" data-oneri-hex="' + hex + '" data-oneri-hedef="' + ad + '" aria-pressed="' + (su.renk[ad] === hex) + '" title="' + kacis(ad2) + ' · ' + hex + '" aria-label="' + kacis(ad2) + ' ' + hex + '" style="background:' + hex + '"></button>')
        .join('');
    }
  }

  function ciktilar() {
    const yaz = (id, m) => {
      const o = $('#o-' + id);
      if (o) o.textContent = m;
    };
    yaz('arka-durak', su.arka.durak);
    yaz('arka-aci', su.arka.aci + '°');
    for (const [g] of PARLAMALAR) {
      yaz('parlama-' + g + '-alpha', Number(su.parlama[g].alpha).toFixed(2));
      yaz('parlama-' + g + '-blur', su.parlama[g].blur + ' px');
    }
    yaz('sure-carpan', '×' + Number(su.sureCarpan).toFixed(2));
    for (const [k] of SURELER) yaz('sure-' + k, su.sure[k] + ' ms');
    yaz('yazi-carpan', '×' + Number(su.yazi.carpan).toFixed(2));
    yaz('sekil-r', su.sekil.r + ' px');
    yaz('sekil-rp', su.sekil.rPencere + ' px');
    yaz('yogunluk', '×' + Number(su.yogunluk).toFixed(2));
    yaz('kenar', su.kenar + ' px');
    yaz('pencere-cubuk', su.pencere.cubuk + ' px');
    yaz('dugme-h', su.dugme.h + ' px');
    yaz('dugme-px', su.dugme.px + ' px');
    yaz('cam', su.cam + ' px');
    yaz('golge', '×' + Number(su.golge).toFixed(2));
    yaz('kay-kalinlik', su.kaydir.kalinlik + ' px');
    const olcek = [1, 2, 3, 4, 5].map((n) => 'fs-' + n + ' ' + Math.round(T.size['fs-' + n].value * su.yazi.carpan));
    $('#yazi-olcek').textContent = olcek.join(' · ');
    $('#yazi-uyari').hidden = !(Number(su.yazi.yari) >= 700 || Number(su.yazi.govde) >= 700);
    $('#arka-aci').disabled = su.arka.don && !su.hareketAz;
    $('#arka-aci').title = $('#arka-aci').disabled ? 'Salınım açıkken açı 150–170° arasında gezer' : '';
    document.documentElement.style.setProperty('--tk-scrollbar-w', su.kaydir.kalinlik + 'px');
    document.documentElement.dataset.kaydirBicim = su.kaydir.bicim;
    oneriIsaretle();
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

  function parlamaUygula(d) {
    su.parlamaDuzey = d;
    if (d === 'ozel') return;
    for (const [g] of PARLAMALAR) {
      const t = ilk.parlama[g];
      if (d === 'yok') su.parlama[g] = { alpha: 0, blur: 0 };
      else if (d === 'ince') su.parlama[g] = { alpha: r2(t.alpha * 0.5), blur: Math.round(t.blur * 0.5) };
      else if (d === 'neon') su.parlama[g] = { alpha: Math.min(1, r2(t.alpha * 1.8)), blur: Math.min(48, Math.round(t.blur * 1.5)) };
      else su.parlama[g] = { alpha: t.alpha, blur: t.blur };
    }
  }

  function ozelGirdi(el) {
    const id = el.id || '';
    if (id === 'parlama-duzey') {
      parlamaUygula(el.value);
      return true;
    }
    const m = /^parlama-(.+)-(alpha|blur)$/.exec(id);
    if (m) {
      su.parlama[m[1]][m[2]] = Number(el.value);
      su.parlamaDuzey = 'ozel';
      return true;
    }
    if (id === 'sure-carpan') {
      su.sureCarpan = Number(el.value);
      for (const [k] of SURELER) su.sure[k] = Math.max(0, Math.min(2000, Math.round(ilk.sure[k] * su.sureCarpan)));
      return true;
    }
    if (id === 'egri-sec') {
      egriDoldur();
      return 'bos';
    }
    if (/^egri-(x1|y1|x2|y2)$/.test(id)) {
      const ad = $('#egri-sec').value;
      const b = EGRI_ALAN.map((k) => Number($('#egri-' + k).value));
      b[0] = Math.max(0, Math.min(1, b[0]));
      b[2] = Math.max(0, Math.min(1, b[2]));
      su.egri[ad] = b.map(r2);
      return true;
    }
    return false;
  }

  const TIK_AYAR = [
    ['.tk-btn-primary', ['dugme', 'renk-blue', 'parlama']],
    ['.tk-btn-danger', ['dugme', 'renk-pink', 'parlama']],
    ['.tk-btn-ghost', ['dugme', 'renk-purple']],
    ['.tk-btn, .btn', ['dugme']],
    ['.tk-titlebar__control, .tk-titlebar__chip, .tk-titlebar__tab', ['pencere', 'renk-blue', 'renk-pink-text']],
    ['.tk-titlebar, .baslik-cubugu', ['pencere', 'renk-glass-base']],
    ['.tk-progress, .tk-installer', ['renk-blue', 'renk-purple', 'renk-success', 'hareket']],
    ['.kaydir-ornek, .uzun-liste', ['kaydir']],
    ['.tk-input, input, select, textarea', ['yogunluk', 'renk-surface', 'sekil']],
    ['.tk-toast, .tk-modal', ['yuzey', 'hareket']],
    ['[class*="badge"], [class*="rozet"]', ['sekil', 'renk-success', 'renk-warning']],
    ['h1, h2, h3, p, .tk-h3', ['yazi', 'renk-text']],
  ];

  function tikGruplari(hedef) {
    let el = hedef;
    for (let n = 0; el && el.id !== 'onizleme' && n < 30; n++, el = el.parentElement) {
      for (const [secici, gruplar] of TIK_AYAR) if (el.matches(secici)) return gruplar;
    }
    return [];
  }

  function ayarAc(gruplar) {
    let ilk = null;
    for (const id of gruplar) {
      const d = $('#ayarlar [data-grup="' + id + '"]');
      if (!d) continue;
      d.open = true;
      d.classList.remove('grup-vurgu');
      void d.offsetWidth;
      d.classList.add('grup-vurgu');
      if (!ilk) ilk = d;
    }
    if (ilk) ilk.scrollIntoView({ block: 'nearest', behavior: 'instant' });
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
      const o = ozelGirdi(el);
      if (o === 'bos') return;
      if (!o) oku();
      ayarDoldur();
      ciktilar();
      planla();
    });
    f.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.renk) return;
      if (/^egri-/.test(el.id) && sayfa === 'akicilik' && A()) {
        requestAnimationFrame(() => requestAnimationFrame(() => A().oynat($('#onizleme'))));
        return;
      }
      if (el.id === 'arka-tur') hashYaz();
      if (el.type === 'radio' || el.type === 'checkbox') {
        oku();
        ciktilar();
        planla();
      }
    });
    f.addEventListener('click', (e) => {
      const on = e.target.closest('[data-oneri-id]');
      if (on) {
        const el = document.getElementById(on.dataset.oneriId);
        el.value = on.dataset.deger;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        oneriIsaretle();
        return;
      }
      const kr = e.target.closest('[data-kombi-renk]');
      if (kr && window.Skor) {
        const ad = kr.dataset.kombiRenk;
        if (!bagliOgeler(ad).size) {
          durum(adi(ad) + ' puanlanan hiçbir yazıyı etkilemiyor; okunurluk hedefi için ' + (DUZENLENEN.includes(ad + '-text') ? adi(ad + '-text') : 'yazı renklerini') + ' seçin.');
          return;
        }
        const s = Math.round(renkPuani({}, ad).puan);
        kombiAc(KOMBI_HEDEF.find((h) => h > s) || 100, ad);
        return;
      }
      const orr = e.target.closest('[data-oneri-hex]');
      if (orr) {
        const ad = orr.dataset.oneriHedef;
        su.renk[ad] = orr.dataset.oneriHex;
        delete hslBellek[ad];
        renkEsle(ad);
        planla();
        return;
      }
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
      if (e.target.closest('[data-egri-geri]')) {
        const ad = $('#egri-sec').value;
        if (ilk.egri[ad]) su.egri[ad] = ilk.egri[ad].slice();
        egriDoldur();
        planla();
      }
    });
    const kok = $('#onizleme');
    kok.addEventListener('click', (e) => {
      const olcek = e.target.closest('[data-olcek]');
      if (olcek && window.Skor) {
        const [a, b] = olcek.dataset.olcek.split(',').map(Number);
        const k = olcek.getBoundingClientRect();
        const oran = k.width ? Math.max(0, Math.min(1, (e.clientX - k.left) / k.width)) : 0.5;
        kombiAc(Math.round(a + (b - a) * oran));
        return;
      }
      ayarAc(tikGruplari(e.target));
      const k = e.target.closest('[data-kaydir]');
      if (k) {
        const liste = document.getElementById(k.dataset.hedef);
        liste.scrollTo({ top: k.dataset.kaydir === 'son' ? liste.scrollHeight : 0 });
      }
      if (e.target.closest('[data-bos]')) e.preventDefault();
      const li = e.target.closest('.liste li');
      if (li) for (const x of $$('li', li.parentElement)) x.setAttribute('aria-selected', String(x === li));
      const ey = e.target.closest('[data-eylem]');
      if (ey) {
        if (ey.dataset.eylem === 'ilerleme') ilerlemeOynat();
        else if (ey.dataset.eylem === 'bildirim') bildirimGoster(ey);
        else if (ey.dataset.eylem === 'modal') modalAc(ey);
      }
      const kapat = e.target.closest('[data-bildirim-yigin] .tk-toast-close');
      if (kapat) bildirimKapat(kapat.closest('.tk-toast'));
      const dlg = e.target.closest('[data-demo-modal]');
      if (dlg && (e.target === dlg || e.target.closest('[data-modal-kapat]'))) modalKapat(dlg);
      const as = e.target.closest('[data-arka-sec]');
      if (as) {
        su.arka.tur = as.dataset.arkaSec;
        $('#arka-tur').value = su.arka.tur;
        hashYaz();
        planla();
      }
    });
    kok.addEventListener('change', (e) => {
      if (e.target.matches('[data-arka-panel]')) {
        arkaPanel = e.target.checked;
        planla();
      } else if (e.target.matches('[data-arka-don]')) {
        su.arka.don = e.target.checked;
        $('#arka-don').checked = su.arka.don;
        ciktilar();
        planla();
      }
    });
    kok.addEventListener(
      'cancel',
      (e) => {
        const d = e.target;
        if (d.matches && d.matches('[data-demo-modal]')) {
          e.preventDefault();
          modalKapat(d);
        }
      },
      true
    );
    const nav = $('#bilesen-liste');
    nav.addEventListener('click', (e) => {
      if (e.target.closest('#okunur-puan') && window.Skor) {
        const s = Math.round(skorlar().su.genel);
        kombiAc(KOMBI_HEDEF.find((h) => h >= s) || 100);
        return;
      }
      const b = e.target.closest('[data-git]');
      if (b) sayfaAc(b.dataset.git);
    });
    nav.addEventListener('keydown', (e) => {
      const b = e.target.closest('[data-git]');
      if (!b) return;
      const hepsi = $$('[data-git]', nav);
      const i = hepsi.indexOf(b);
      const j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: hepsi.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      const h = hepsi[(j + hepsi.length) % hepsi.length];
      h.focus();
      sayfaAc(h.dataset.git);
    });
    const kipSec = (b) => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      kip = b.dataset.kip;
      kipIsaretle();
      hashYaz();
      planla();
    };
    for (const b of $$('[data-kip]')) b.addEventListener('click', () => kipSec(b));
    $('.kip').addEventListener('keydown', (e) => {
      const hepsi = $$('[data-kip]').filter((x) => x.getAttribute('aria-disabled') !== 'true');
      const j = hepsi.indexOf(document.activeElement);
      const yeni = { ArrowRight: j + 1, ArrowLeft: j - 1, Home: 0, End: hepsi.length - 1 }[e.key];
      if (yeni === undefined || !hepsi.length) return;
      e.preventDefault();
      const h = hepsi[(yeni + hepsi.length) % hepsi.length];
      h.focus();
      kipSec(h);
    });
    pencereBagla();
    $('#tema-sec').addEventListener('change', (e) => temaSec(e.target.value));
    $('#sifirla').addEventListener('click', () => {
      su = kopya(ilk);
      $('#tema-sec').value = '';
      for (const k of Object.keys(hslBellek)) delete hslBellek[k];
      formDoldur();
      oku();
      planla();
      durum('Token dosyasındaki değerlere dönüldü.');
    });
    $('#kopyala').addEventListener('click', kopyala);
    $('#indir').addEventListener('click', indir);
    $('#kaydet').addEventListener('click', kaydetAc);
    $('#kaydet-pencere').addEventListener('cancel', (e) => {
      if (kayitSuruyor) e.preventDefault();
    });
  }

  function oku() {
    su.arka.tur = $('#arka-tur').value;
    su.arka.durak = Number($('#arka-durak').value);
    su.arka.aci = Number($('#arka-aci').value);
    su.arka.don = $('#arka-don').checked;
    su.arayuzEgri = $('#arayuz-egri').value;
    for (const [k] of SURELER) su.sure[k] = Math.max(0, Math.min(2000, Math.round(Number($('#sure-' + k).value))));
    su.yazi.aile = $('#yazi-aile').value;
    su.yazi.carpan = Number($('#yazi-carpan').value);
    su.yazi.govde = Number($('#yazi-govde').value);
    su.yazi.yari = Number($('#yazi-yari').value);
    su.yazi.kahraman = Number($('#yazi-kahraman').value);
    su.sekil.r = Number($('#sekil-r').value);
    su.sekil.rPencere = Number($('#sekil-rp').value);
    su.yogunluk = Number($('#yogunluk').value);
    su.kenar = Number($('#kenar').value);
    su.cam = Number($('#cam').value);
    su.golge = Number($('#golge').value);
    su.pencere.kenar = $('#pencere-kenar').value;
    su.pencere.cubuk = Number($('#pencere-cubuk').value);
    su.dugme.h = Number($('#dugme-h').value);
    su.dugme.px = Number($('#dugme-px').value);
    su.kaydir.kalinlik = Number($('#kay-kalinlik').value);
    su.kaydir.renk = $('#kay-renk').value;
    su.kaydir.bicim = $('#kay-bicim').value;
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
    for (const ad of DUZENLENEN) if (su.renk[ad] !== ilk.renk[ad]) koy(T.role[ad] ? 'role' : 'brand', ad, { value: su.renk[ad] });
    if (su.koyu !== ilk.koyu) koy('meta', 'dark', su.koyu);
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
    for (const [ad, b] of Object.entries(su.egri)) {
      if (!T.easing || !T.easing[ad] || !ilk.egri[ad]) continue;
      const y = b.map(r2);
      if (egriMetin(y) !== egriMetin(ilk.egri[ad])) koy('easing', ad, { bezier: y });
    }
    for (const [k] of SURELER) if (su.sure[k] !== ilk.sure[k]) koy('duration', k, { ms: Math.max(0, Math.min(2000, Math.round(su.sure[k]))) });
    for (const [g] of PARLAMALAR) {
      const a = su.parlama[g];
      const b = ilk.parlama[g];
      const d = {};
      if (r2(a.alpha) !== r2(b.alpha)) d.alpha = Math.max(0, Math.min(1, r2(a.alpha)));
      if (Math.round(a.blur) !== Math.round(b.blur)) d.blur = Math.max(0, Math.min(48, Math.round(a.blur)));
      if (Object.keys(d).length) koy('derived', g, d);
    }
    const notlar = [];
    if (su.arka.tur !== ilk.arka.tur) notlar.push('Arka plan tasarımı: ' + su.arka.tur + ' (token karşılığı yok).');
    if (su.arka.aci !== ilk.arka.aci) notlar.push('Degrade açısı: ' + su.arka.aci + 'deg (generate.js varsayılanı 160deg).');
    if (su.arka.don !== ilk.arka.don) notlar.push('Arka plan salınımı: ' + (su.arka.don ? 'açık' : 'kapalı') + '.');
    if (su.kaydir.renk !== ilk.kaydir.renk) notlar.push('Kaydırma çubuğu rengi: ' + su.kaydir.renk + '.');
    if (su.kaydir.davranis !== ilk.kaydir.davranis) notlar.push('Kaydırma davranışı: ' + su.kaydir.davranis + '.');
    if (su.kaydir.bicim !== ilk.kaydir.bicim) notlar.push('Kaydırma çubuğu biçimi: ' + su.kaydir.bicim + '.');
    if (su.yazi.aile === 'mono' && ilk.yazi.aile !== 'mono') notlar.push('Gövde yazısı mono zincire çevrildi.');
    if (su.arayuzEgri !== ilk.arayuzEgri) notlar.push('Arayüz geçiş eğrisi: ' + su.arayuzEgri + ' (önizlemede --tk-e-out yerine).');
    if (su.yogunluk !== ilk.yogunluk) notlar.push('Yoğunluk: ×' + su.yogunluk + ' (boşluk ölçeği çarpanı).');
    if (su.kenar !== ilk.kenar) notlar.push('Kenar kalınlığı: ' + su.kenar + ' px.');
    if (su.cam !== ilk.cam) notlar.push('Cam bulanıklığı: ' + su.cam + ' px.');
    if (su.golge !== ilk.golge) notlar.push('Panel gölgesi gücü: ×' + su.golge + '.');
    if (su.pencere.kenar !== ilk.pencere.kenar) notlar.push('Pencere kenarı: ' + su.pencere.kenar + '.');
    if (su.dugme.h !== ilk.dugme.h || su.dugme.px !== ilk.dugme.px) notlar.push('Düğme: ' + su.dugme.h + ' px yükseklik, ' + su.dugme.px + ' px yatay dolgu.');
    if (su.pencere.cubuk !== ilk.pencere.cubuk) notlar.push('Üst çubuk yüksekliği: ' + su.pencere.cubuk + ' px (titlebar-h-min).');
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
        if (bolum === 'easing') {
          out.push('easing.' + k + ': ' + egriMetin(ilk.egri[k]) + ' → ' + egriMetin(v.bezier));
          continue;
        }
        if (bolum === 'duration') {
          out.push('duration.' + k + ': ' + ilk.sure[k] + ' → ' + v.ms + ' ms');
          continue;
        }
        if (bolum === 'derived' && ilk.parlama[k]) {
          const p = [];
          if ('alpha' in v) p.push('alpha ' + ilk.parlama[k].alpha + ' → ' + v.alpha);
          if ('blur' in v) p.push('blur ' + ilk.parlama[k].blur + ' → ' + v.blur);
          out.push('derived.' + k + ': ' + p.join(', '));
          continue;
        }
        const eski = bolum === 'brand' ? ilk.renk[k] : '';
        out.push(bolum + '.' + k + ': ' + (eski ? eski + ' → ' : '') + (typeof v.value === 'string' ? v.value : JSON.stringify(v.value !== undefined ? v.value : v)));
      }
    }
    return out;
  }

  function metin() {
    return JSON.stringify(disaAktar(), null, 2) + '\n';
  }

  let durumSayac = 0;
  function durum(m) {
    $('#durum').textContent = m;
    clearTimeout(durumSayac);
    if (m) durumSayac = setTimeout(() => ($('#durum').textContent = ''), 8000);
  }

  function kipIsaretle() {
    for (const x of $$('[data-kip]')) {
      const bu = x.dataset.kip === kip;
      if (bu) x.setAttribute('aria-current', 'page');
      else x.removeAttribute('aria-current');
      x.tabIndex = bu ? 0 : -1;
    }
  }

  function pencereBagla() {
    const p = window.pencere;
    if (!p) return;
    $('#pencere-denetim').hidden = false;
    for (const b of $$('[data-pencere]')) b.addEventListener('click', () => p.komut(b.dataset.pencere));
    p.durum((d) => {
      document.documentElement.dataset.window = d;
      const b = $('[data-pencere="buyut"]');
      const buyuk = d !== 'normal';
      b.setAttribute('aria-label', buyuk ? 'Geri Al' : 'Büyüt');
      b.title = buyuk ? 'Geri Al' : 'Büyüt';
      b.firstElementChild.className = buyuk ? 'tk-titlebar__restore' : 'tk-titlebar__maximize';
    });
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

  let kayitSuruyor = false;

  function kacis(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function tokenDegisimi() {
    const d = disaAktar();
    delete d._;
    return d;
  }

  function kaydetGuncelle() {
    const b = $('#kaydet');
    if (!b) return;
    b.disabled = kayitSuruyor;
    b.title = 'Ayarlarını özel olarak kaydet; genel depoya gitmez.';
  }

  function sonrakiSurum(s) {
    const p = String(s).split('.').map(Number);
    return p.length === 3 && p.every(Number.isInteger) ? p[0] + '.' + (p[1] + 1) + '.0' : '?';
  }

  function kaydetAc() {
    const p = $('#kaydet-pencere');
    const satir = farkSatirlari(fark(su, ilk));
    const yer = ozelBilgi.tur === 'raf' ? 'Özel raf: teknesyum-private/teknesyum-ui/onizleme/ayarlar.json (özel depoya gönderilir)' : 'Yerel dosya: ui/onizleme/ozel-ayar.json (.gitignore içinde, depoya girmez)';
    p.innerHTML =
      '<div class="tk-panel tk-modal kaydet-kutu">' +
      '<h2 class="tk-h3" id="kaydet-baslik">Özel Kaydet</h2>' +
      '<p class="kaydet-surum">' + (satir.length ? satir.length + ' ayar önerilenden farklı' : 'Tüm ayarlar önerilen değerde') + '</p>' +
      (satir.length ? '<ul class="kaydet-liste">' + satir.map((s) => '<li>' + kacis(s) + '</li>').join('') + '</ul>' : '') +
      '<p class="kaydet-not">' + kacis(yer) + '. Yalnız önerilenden farkın yazılır; açılışta bu ayarlar yüklenir.</p>' +
      '<div class="tk-installer__actions"><button type="button" class="tk-btn tk-btn-ghost" data-kaydet="vazgec">Vazgeç</button>' +
      '<button type="button" class="tk-btn tk-btn-ghost" data-kaydet="yayin">Herkese Açık Yayınla…</button>' +
      '<button type="button" class="tk-btn tk-btn-primary" data-kaydet="ozel">Özel Kaydet</button></div></div>';
    $('[data-kaydet="vazgec"]', p).addEventListener('click', () => p.close());
    $('[data-kaydet="yayin"]', p).addEventListener('click', yayinAc);
    $('[data-kaydet="ozel"]', p).addEventListener('click', async () => {
      p.close();
      await ozelKaydet(false);
    });
    if (!p.open) p.showModal();
    $('[data-kaydet="ozel"]', p).focus();
  }

  async function yayinAc() {
    const p = $('#kaydet-pencere');
    let surum = '?';
    try {
      surum = (await (await fetch('/surum', { cache: 'no-store' })).json()).surum;
    } catch {}
    const satirlar = farklar().filter((s) => !disaAktar()._ || !disaAktar()._.includes(s));
    const notlar = disaAktar()._ || [];
    p.innerHTML =
      '<div class="tk-panel tk-modal kaydet-kutu">' +
      '<h2 class="tk-h3" id="kaydet-baslik">Herkese Açık Yayınla</h2>' +
      '<p class="kaydet-uyari">Bu, ayarları genel token dosyasına yazar ve GitHub sürümü olarak yayınlar; herkes görür ve indirenler bunları önerilen değer olarak alır.</p>' +
      '<p class="kaydet-surum">Sürüm ' + kacis(surum) + ' → ' + kacis(sonrakiSurum(surum)) + '</p>' +
      '<p class="kaydet-surum">Okunurluk ' + Math.round(skorlar().ilk.genel) + ' → ' + Math.round(skorlar().su.genel) + ' / 100</p>' +
      '<ul class="kaydet-liste">' + satirlar.map((s) => '<li>' + kacis(s) + '</li>').join('') + '</ul>' +
      (notlar.length ? '<p class="kaydet-not">Token karşılığı olmadığı için kaydedilmeyecek:</p><ul class="kaydet-liste">' + notlar.map((s) => '<li>' + kacis(s) + '</li>').join('') + '</ul>' : '') +
      '<p class="kaydet-not">Token kaynağı yazılır, türev dosyalar üretilir, testler ve tarayıcı çalışır; hepsi geçerse sürüm artar, commit, etiket, push ve GitHub sürümü yapılır.</p>' +
      '<div class="tk-installer__actions"><button type="button" class="tk-btn tk-btn-ghost" data-kaydet="vazgec">Vazgeç</button>' +
      '<button type="button" class="tk-btn tk-btn-primary" data-kaydet="onay"' + (satirlar.length ? '' : ' disabled title="Token dosyasından farklı bir ayar yok."') + '>Herkese Açık Yayınla</button></div></div>';
    $('[data-kaydet="vazgec"]', p).addEventListener('click', () => p.close());
    $('[data-kaydet="onay"]', p).addEventListener('click', kaydetGonder);
    if (!p.open) p.showModal();
    $('[data-kaydet="vazgec"]', p).focus();
  }

  function ilerlemeCiz(d, hata) {
    const p = $('#kaydet-pencere');
    const durumu = hata || (d.bitti && !d.basarili) ? 'error' : d.bitti ? 'done' : 'running';
    const yuzde = Math.max(0, Math.min(100, d.yuzde || 0));
    const adim = hata || d.adim || 'Başlıyor';
    const alt = d.surum ? 'Sürüm ' + d.surum : 'Önizlemeden kayıt';
    let dugmeler = '';
    if (durumu === 'done') dugmeler = '<button type="button" class="tk-btn tk-btn-primary" data-kaydet="yenile">Önizlemeyi Yenile</button>';
    else if (durumu === 'error') dugmeler = '<button type="button" class="tk-btn tk-btn-ghost" data-kaydet="kapat">Kapat</button>';
    p.innerHTML =
      '<div class="tk-installer kaydet-kutu" data-status="' + durumu + '">' +
      '<div class="tk-installer__head"><div class="tk-installer__titles"><p class="tk-installer__title" id="kaydet-baslik">Teknesyum<span class="tk-installer__accent">Kaydet</span></p>' +
      '<p class="tk-installer__sub">' + kacis(alt) + '</p></div></div>' +
      '<div><div class="tk-installer__row"><span class="tk-installer__step">' + kacis(adim) + '</span><span class="tk-installer__percent">' + yuzde + '%</span></div>' +
      '<div class="tk-progress__track parca-kur-cubuk" role="progressbar" aria-valuenow="' + Math.round(yuzde) + '" aria-valuemin="0" aria-valuemax="100" aria-label="Kaydet">' +
      '<div class="tk-progress__fill" style="--tk-progress-value: ' + yuzde / 100 + '"></div></div></div>' +
      '<ol class="tk-installer__log">' + (d.gunluk || []).slice(-9).map((s) => '<li>' + kacis(s) + '</li>').join('') + '</ol>' +
      '<div class="tk-installer__actions">' + dugmeler + '</div></div>';
    akit($('.tk-installer', p), yuzde, 'kaydet');
    const y = $('[data-kaydet="yenile"]', p);
    if (y) {
      y.addEventListener('click', () => location.reload());
      y.focus();
    }
    const k = $('[data-kaydet="kapat"]', p);
    if (k) {
      k.addEventListener('click', () => p.close());
      k.focus();
    }
  }

  async function kaydetGonder() {
    kayitSuruyor = true;
    kaydetGuncelle();
    akis.delete('kaydet');
    ilerlemeCiz({ yuzde: 0, gunluk: [] });
    let r;
    try {
      r = await fetch('/kaydet', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-onizleme': '1' }, body: JSON.stringify(tokenDegisimi()) });
    } catch (e) {
      kayitSuruyor = false;
      ilerlemeCiz({ gunluk: [String(e.message || e)] }, 'Sunucuya ulaşılamadı');
      kaydetGuncelle();
      return;
    }
    if (!r.ok) {
      let m = 'HTTP ' + r.status;
      try {
        m = (await r.json()).hata || m;
      } catch {}
      kayitSuruyor = false;
      ilerlemeCiz({ gunluk: [m] }, 'Kayıt başlamadı');
      kaydetGuncelle();
      return;
    }
    const bekle = async () => {
      let d;
      try {
        d = await (await fetch('/kaydet/durum', { cache: 'no-store' })).json();
      } catch {
        setTimeout(bekle, 400);
        return;
      }
      ilerlemeCiz(d);
      if (d.bitti && !d.calisiyor) {
        kayitSuruyor = false;
        kaydetGuncelle();
        durum(d.basarili ? 'Sürüm ' + d.surum + ' yayınlandı.' : 'Kayıt başarısız; dosyalar eski haline döndü.');
        return;
      }
      setTimeout(bekle, 400);
    };
    bekle();
  }

  async function temalarYukle() {
    try {
      const r = await fetch('/temalar.json', { cache: 'no-store' });
      if (r.ok) temalar = await r.json();
    } catch {
      temalar = [];
    }
    const grup = (tur, ad) =>
      '<optgroup label="' + ad + '">' +
      temalar.filter((t) => t.tur === tur).map((t) => '<option value="' + kacis(t.ad) + '">' + kacis(t.baslik) + '</option>').join('') +
      '</optgroup>';
    if (temalar.length) $('#tema-sec').insertAdjacentHTML('beforeend', grup('koyu', 'Koyu Temalar') + grup('acik', 'Açık Temalar'));
  }

  function ozelSecenek() {
    if (!ozelBilgi.ayar) return;
    for (const s of $$('#tema-sec, [data-sihirbaz-tema]')) {
      if (s.querySelector('option[value="ozel"]')) continue;
      s.options[0].insertAdjacentHTML('afterend', '<option value="ozel">Benim Token Dosyam</option>');
    }
  }

  function temaSec(ad) {
    if (ad === 'ozel' && ozelBilgi.ayar) {
      const az = su.hareketAz;
      su = kopya(ilk);
      su.hareketAz = az;
      birlestir(su, ozelBilgi.ayar.fark, ilk);
      for (const k of Object.keys(hslBellek)) delete hslBellek[k];
      formDoldur();
      planla();
      durum('Benim Token Dosyam yüklendi.');
      return;
    }
    const t = temalar.find((x) => x.ad === ad);
    su.renk = kopya(ilk.renk);
    su.koyu = ilk.koyu;
    if (t) {
      for (const [k, v] of Object.entries(t.renk)) if (DUZENLENEN.includes(k)) su.renk[k] = v;
      su.koyu = t.tur === 'koyu';
    }
    for (const k of Object.keys(hslBellek)) delete hslBellek[k];
    formDoldur();
    planla();
    durum(t ? t.baslik + ' yüklendi' + (t.esin ? ' (esin: ' + t.esin + ')' : '') + '. Düzenleyip Kaydet ile standart yapabilirsiniz.' : 'Token dosyasındaki renklere dönüldü.');
  }

  let ozelBilgi = { var: false, tur: 'yerel', ayar: null };

  function duzNesne(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function fark(a, b) {
    const out = {};
    for (const [k, v] of Object.entries(a)) {
      if (k === 'hareketAz' || !(k in b)) continue;
      if (duzNesne(v) && duzNesne(b[k])) {
        const alt = fark(v, b[k]);
        if (Object.keys(alt).length) out[k] = alt;
      } else if (JSON.stringify(v) !== JSON.stringify(b[k])) out[k] = kopya(v);
    }
    return out;
  }

  function birlestir(hedef, f, sablon) {
    for (const [k, v] of Object.entries(f || {})) {
      if (k === 'hareketAz' || !(k in sablon)) continue;
      const s = sablon[k];
      if (duzNesne(s)) {
        if (duzNesne(v)) birlestir(hedef[k], v, s);
      } else if (Array.isArray(s) ? Array.isArray(v) && v.length === s.length : typeof v === typeof s) hedef[k] = kopya(v);
    }
  }

  function yolAl(o, yol) {
    return yol.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
  }

  function yolKoy(o, yol, v) {
    const p = yol.split('.');
    const son = p.pop();
    p.reduce((x, k) => x[k], o)[son] = v;
  }

  function farkSatirlari(f, on = '') {
    const out = [];
    for (const [k, v] of Object.entries(f)) {
      const yol = on + k;
      if (duzNesne(v)) out.push(...farkSatirlari(v, yol + '.'));
      else out.push(yol + ': ' + JSON.stringify(yolAl(ilk, yol)).replace(/"/g, '') + ' → ' + JSON.stringify(v).replace(/"/g, ''));
    }
    return out;
  }

  async function ozelYukle() {
    try {
      const r = await fetch('/ozel-ayar', { cache: 'no-store' });
      if (r.ok) ozelBilgi = await r.json();
    } catch {}
    const a = ozelBilgi.ayar;
    if (!a || !duzNesne(a.fark)) return;
    birlestir(su, a.fark, ilk);
    ozelSecenek();
    $('#tema-sec').value = 'ozel';
  }

  async function ozelKaydet(sihirbazla) {
    const veri = { surum: 1, tarih: new Date().toISOString(), sihirbaz: sihirbazla || !!(ozelBilgi.ayar && ozelBilgi.ayar.sihirbaz), tema: $('#tema-sec').value === 'ozel' ? (ozelBilgi.ayar && ozelBilgi.ayar.tema) || null : $('#tema-sec').value || null, fark: fark(su, ilk) };
    let r;
    try {
      r = await fetch('/ozel-ayar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-onizleme': '1' }, body: JSON.stringify(veri) });
    } catch (e) {
      durum('Özel ayar kaydedilemedi: ' + (e.message || e));
      return false;
    }
    let j = {};
    try {
      j = await r.json();
    } catch {}
    if (!r.ok) {
      durum('Özel ayar kaydedilemedi: ' + (j.hata || 'HTTP ' + r.status));
      return false;
    }
    ozelBilgi = { var: true, tur: j.tur, ayar: veri };
    ozelSecenek();
    for (const s of $$('#tema-sec, [data-sihirbaz-tema]')) s.value = 'ozel';
    if (j.tur !== 'raf' || !j.gonderim) {
      durum(j.tur === 'raf' ? 'Özel ayar özel rafa kaydedildi; git gönderimi kapalı.' : 'Özel ayar yerel dosyaya kaydedildi (.gitignore içinde).');
      return true;
    }
    durum('Özel ayar kaydedildi; özel depoya gönderiliyor…');
    const METIN = { gonderildi: 'Özel ayar kaydedildi ve özel depoya gönderildi.', 'git-yok': 'Özel ayar kaydedildi; özel raf bir git deposu değil, gönderilmedi.', 'add-durdu': 'Özel ayar kaydedildi; git add durdu, gönderilmedi.', 'commit-durdu': 'Özel ayar kaydedildi; commit durdu, gönderilmedi.', 'push-durdu': 'Özel ayar kaydedildi; push durdu, yerelde bekliyor.' };
    const bekle = async (n) => {
      let g = null;
      try {
        g = (await (await fetch('/ozel-ayar/durum', { cache: 'no-store' })).json()).gonderim;
      } catch {}
      if (METIN[g]) return durum(METIN[g]);
      if (n > 0) setTimeout(() => bekle(n - 1), 500);
    };
    bekle(60);
    return true;
  }

  const ADIMLAR = [
    { ad: 'Tema', sayfa: 'renkler', grup: [], yol: ['renk', 'koyu'], tema: true, metin: 'Önce temel seçim: koyu, açık ya da hazır bir tema. Önerilen, token dosyasındaki koyu temadır. Sonraki her renk bu seçimin üstüne kurulur; tema değişince renkler de değişir.' },
    { ad: 'Yüzey', sayfa: 'formlar', grup: ['renk-surface'], yol: ['renk.surface'], metin: 'Panellerin, kutuların ve alanların zemini. Tüm okunurluk ölçümleri bu rengin üstünde yapılır; önce bunu oturt. Koyu temada çok koyu, açık temada çok açık kalmalı.' },
    { ad: 'Metin', sayfa: 'formlar', grup: ['renk-text'], yol: ['renk.text'], metin: 'Gövde yazısının rengi. Yüzey üstünde 7:1 eşiğini geçmeli; kaydırıcıların yanındaki oran bunu gösterir. Etiket ve ipucu tonları bundan türer.' },
    { ad: 'Arka Plan', sayfa: 'arka', grup: ['arka', 'renk-black'], yol: ['arka', 'renk.black'], metin: 'Pencerenin arkası: tasarım, degrade durakları, açı ve salınım. Üst uç Siyah, alt uç Yüzey rengidir; ikisi de bu grupta. Durak sayısı arttıkça geçiş yumuşar.' },
    { ad: 'Cam Tabanı', sayfa: 'ustcubuk', grup: ['renk-glass-base'], yol: ['renk.glass-base'], metin: 'Üst çubuk ve cam yüzeylerin altındaki renk. Bulanıklıkla birlikte çalışır; arka planla fazla benzerse cam kaybolur, fazla farklıysa ağırlaşır.' },
    { ad: 'Ana Renk: Mavi', sayfa: 'dugmeler', grup: ['renk-blue'], yol: ['renk.blue'], metin: 'Birincil düğme, bağlantı, odak ve ilerleme bu renktir. Hedef Okunurluk düğmesi seçtiğin puana uyan beş öneri verir; eğri haritasında bir noktaya tıklamak o rengi uygular.' },
    { ad: 'Pembe', sayfa: 'dugmeler', grup: ['renk-pink'], yol: ['renk.pink'], metin: 'İkincil vurgu ve dolgu. Pembe düğmenin yazısı dolgunun eşiğinden gelir; dolgu çok açılırsa yazı koyuya döner.' },
    { ad: 'Pembe Yazı', sayfa: 'dugmeler', grup: ['renk-pink-text'], yol: ['renk.pink-text'], metin: 'Pembenin yüzey üstünde yazı olarak okunan sürümü: üzerine gelinen sekme ve çiplerin yazısı. Dolgu pembeden bağımsız ayarlanır, 7:1 eşiğini geçmeli.' },
    { ad: 'Mor', sayfa: 'ilerleme', grup: ['renk-purple'], yol: ['renk.purple'], metin: 'Üçüncü vurgu: ilerleme çubuğunun ikinci durağı ve bazı rozetler. Mavi ile pembe arasında ayrı durmalı.' },
    { ad: 'Mor Yazı', sayfa: 'kaydirma', grup: ['renk-purple-text'], yol: ['renk.purple-text'], metin: 'Morun yazı sürümü; kaydırma çubuğu da önerilen olarak bu rengi kullanır. Yüzey üstünde 7:1 eşiğini geçmeli.' },
    { ad: 'Başarı', sayfa: 'bildirimler', grup: ['renk-success'], yol: ['renk.success'], metin: 'Tamamlandı, eşitlendi, kaydedildi. Bildirim, rozet ve kurulumun son adımı bu renktir.' },
    { ad: 'Uyarı', sayfa: 'rozetler', grup: ['renk-warning'], yol: ['renk.warning'], metin: 'Dikkat gerektiren durum. Uyarı yalnız yazı, kenar ve ikonda kullanılır, dolgu olmaz; bu yüzden yüzey üstünde yazı olarak okunmalı.' },
    { ad: 'Pasif', sayfa: 'dugmeler', grup: ['renk-disabled'], yol: ['renk.disabled'], metin: 'Kullanılamayan düğme ve alan. Soluk görünmeli ama yine okunmalı; neden pasif olduğu title ile söylenir.' },
    { ad: 'Yazı', sayfa: 'tipografi', grup: ['yazi'], yol: ['yazi'], metin: 'Yazı ailesi, boyut çarpanı ve üç ağırlık: gövde, başlık/etiket, kahraman. 700 yalnız kahraman içindir. Ölçek satırı çarpanla oluşan boyutları gösterir.' },
    { ad: 'Köşe Yarıçapı', sayfa: 'formlar', grup: ['sekil'], yol: ['sekil'], metin: 'Kutu, düğme ve alan köşeleri ile pencerenin kendi köşesi. Küçük değer keskin ve teknik, büyük değer yumuşak durur.' },
    { ad: 'Yoğunluk Ve Kenar', sayfa: 'formlar', grup: ['yogunluk'], yol: ['yogunluk', 'kenar'], metin: 'Boşluk çarpanı tüm iç ve dış boşlukları birlikte ölçekler; kenar kalınlığı çerçeveleri. Formlar sayfası ikisinin etkisini aynı anda gösterir.' },
    { ad: 'Düğme Boyutu', sayfa: 'dugmeler', grup: ['dugme'], yol: ['dugme'], metin: 'Düğme yüksekliği ve yatay dolgusu. Yükseklik dokunma hedefini, dolgu yazının nefesini belirler.' },
    { ad: 'Pencere Ve Üst Çubuk', sayfa: 'ustcubuk', grup: ['pencere'], yol: ['pencere'], metin: 'Pencere büyütülmemişken çevresindeki 1 px kenarın rengi ve üst çubuğun yüksekliği.' },
    { ad: 'Cam Ve Gölge', sayfa: 'modal', grup: ['yuzey'], yol: ['cam', 'golge'], metin: 'Cam bulanıklığı ve panel gölgesinin gücü. Modal ve üst çubuk en çok bunlardan etkilenir.' },
    { ad: 'Parlama', sayfa: 'dugmeler', grup: ['parlama'], yol: ['parlama', 'parlamaDuzey'], metin: 'Kutu, düğme ve kahraman yazısının halesi: saydamlık ve bulanıklık ayrı ayrı. Düzey üçünü birlikte ölçekler; kaydırma çubuğunda hale yoktur.' },
    { ad: 'Kaydırma Çubuğu', sayfa: 'kaydirma', grup: ['kaydir'], yol: ['kaydir'], metin: 'Kaydırma çubuğunun kalınlığı, rengi, biçimi ve davranışı (anında ya da yumuşak).' },
    { ad: 'Hareket', sayfa: 'akicilik', grup: ['hareket'], yol: ['arayuzEgri', 'sure', 'sureCarpan'], metin: 'Geçişlerin eğrisi ve süreleri; süre çarpanı hepsini birlikte hızlandırır ya da yavaşlatır. Hareketi Azalt bu makineye özeldir, kaydedilmez.' },
    { ad: 'Eğri Düzenleyici', sayfa: 'akicilik', grup: ['egri'], yol: ['egri'], metin: 'Her eğrinin dört denetim noktası. Y değeri 1’i aşarsa hareket hedefi geçip geri döner; Akıcılık sayfası eğriyi canlı çizer.' },
    { ad: 'Okunurluk', sayfa: 'okunur', grup: [], yol: [], puan: true, metin: 'Seçimlerinin okunurluk puanı, panel panel. 70’in altında kalan öğe varsa Geri ile ilgili renge dönüp Hedef Okunurluk önerilerini kullanabilirsin.' },
    { ad: 'Kaydet', sayfa: null, grup: [], yol: [], son: true, metin: 'Seçimlerin yalnız sana ait özel yere kaydedilir; genel depoya hiçbir renk ya da tercih gitmez. Açılışta bu ayarlar yüklenir, sihirbaz yeniden sormaz.' },
  ];
  const NASIL = {
    "Tema": "Bu kartın içindeki kutudan seç. Aynı seçim üst çubuktaki Token Dosyası menüsündedir.",
    "Arka Plan": "Sağ panelin en üstünde, Arka Plan grubunda: Tasarım menüsü, Degrade Durakları ve Açı kaydırıcıları, Salınım kutusu; en altta Üst Uç ve Alt Uç renk kutuları.",
    "Yazı": "Sağ panelin en üstünde, Yazı grubunda: Yazı Ailesi menüsü, Boyut Çarpanı kaydırıcısı ve üç ağırlık menüsü.",
    "Köşe Yarıçapı": "Sağ panelin en üstünde, Köşe Yarıçapı grubunda: Yarıçap ve Pencere Yarıçapı kaydırıcıları. Altlarındaki sayı çipleri tek tıkla değer verir.",
    "Yoğunluk Ve Kenar": "Sağ panelin en üstünde, Yoğunluk Ve Kenar grubunda: Boşluk Çarpanı ve Kenar Kalınlığı kaydırıcıları.",
    "Düğme Boyutu": "Sağ panelin en üstünde, Düğme Boyutu grubunda: Düğme Yüksekliği ve Yatay Dolgu kaydırıcıları.",
    "Pencere Ve Üst Çubuk": "Sağ panelin en üstünde, Pencere Ve Üst Çubuk grubunda: Pencere Kenarı menüsü ve Üst Çubuk Yüksekliği kaydırıcısı.",
    "Cam Ve Gölge": "Sağ panelin en üstünde, Yüzey grubunda: Cam Bulanıklığı ve Gölge Gücü kaydırıcıları.",
    "Parlama": "Sağ panelin en üstünde, Parlama grubunda: Parlama Düzeyi menüsü; kutu, düğme ve kahraman için Saydamlık ve Bulanıklık kaydırıcıları.",
    "Kaydırma Çubuğu": "Sağ panelin en üstünde, Kaydırma grubunda: Çubuk Kalınlığı kaydırıcısı, Çubuk Rengi ve Çubuk Biçimi menüleri, Yumuşak / Anında seçimi.",
    "Hareket": "Sağ panelin en üstünde, Hareket grubunda: Arayüz Eğrisi menüsü, Süre Çarpanı ve her süre için bir kaydırıcı.",
    "Eğri Düzenleyici": "Sağ panelin en üstünde, Eğri Düzenleyici grubunda: Eğri menüsünden birini seç, X1 Y1 X2 Y2 kaydırıcılarıyla biçimlendir. Geri Al önerilene döner.",
    "Okunurluk": "Ortadaki Okunurluk sayfası puanı panel panel gösterir. Soldaki menüde Okunurluk yanındaki sayı canlı puandır.",
    "Kaydet": "Aşağıdaki Özel Kaydet düğmesine bas. Sonra da üst çubuktaki Kaydet ile yeniden kaydedebilirsin."
  };

  function nasil(a) {
    if (NASIL[a.ad]) return NASIL[a.ad];
    const renk = a.grup.find((g) => g.startsWith('renk-'));
    if (renk) return 'Sağ panelin en üstünde, pembe çerçeveli ' + adi(renk.slice(5)) + ' grubunda: renk kutusuna tıklayıp seç ya da hex yaz; Ton, Doygunluk, Açıklık kaydırıcılarıyla ince ayar yap. Hedef Okunurluk düğmesi beş öneri verir.';
    return '';
  }
  let sihirbazAdim = -1;

  function sihirbazBayrak(v) {
    try {
      if (v === undefined) return localStorage.getItem('tk-sihirbaz');
      localStorage.setItem('tk-sihirbaz', v);
    } catch {}
    return null;
  }

  function sihirbazKur() {
    const k = $('#sihirbaz');
    const temaSecenek = $('#tema-sec').innerHTML;
    k.innerHTML =
      '<div class="sihirbaz-bas"><p class="sihirbaz-etiket" id="sihirbaz-baslik">Kurulum Sihirbazı</p>' +
      '<p class="sihirbaz-sayac" data-sihirbaz-sayac></p>' +
      '<button type="button" class="tk-titlebar__control tk-titlebar__control--close" data-sihirbaz="kapat" aria-label="Sihirbazı Kapat" title="Kapat"><span class="tk-titlebar__close" aria-hidden="true"></span></button></div>' +
      '<div class="tk-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="' + ADIMLAR.length + '" aria-label="Sihirbaz İlerlemesi"><div class="tk-progress__fill" data-sihirbaz-dolgu></div></div>' +
      '<div class="sihirbaz-yigin">' +
      ADIMLAR.map(
        (a, i) =>
          '<div class="sihirbaz-metin" data-sihirbaz-adim="' + i + '"><h2 class="tk-h3">' + kacis(a.ad) + '</h2><p>' + kacis(a.metin) + '</p>' +
          (nasil(a) ? '<p class="sihirbaz-nasil"><span class="sihirbaz-nasil-et">Nerede, Nasıl</span>' + kacis(nasil(a)) + '</p>' : '') +
          (a.tema ? '<select class="tk-input" data-sihirbaz-tema aria-label="Tema">' + temaSecenek + '</select>' : '') +
          (a.puan ? '<p class="sihirbaz-puan" data-sihirbaz-puan></p>' : '') +
          (a.yol.length ? '<p class="sihirbaz-fark" data-sihirbaz-fark></p>' : '') +
          '</div>'
      ).join('') +
      '</div>' +
      '<div class="tk-installer__actions"><button type="button" class="tk-btn tk-btn-ghost" data-sihirbaz="geri">Geri</button>' +
      '<button type="button" class="tk-btn tk-btn-ghost" data-sihirbaz="oneri">Önerileni Kullan</button>' +
      '<button type="button" class="tk-btn tk-btn-primary" data-sihirbaz="ileri"><span class="sihirbaz-yigin"><span data-sihirbaz-etiket="ileri">İleri</span><span data-sihirbaz-etiket="kaydet">Özel Kaydet</span></span></button></div>';
    k.addEventListener('change', (e) => {
      if (!e.target.matches('[data-sihirbaz-tema]')) return;
      $('#tema-sec').value = e.target.value;
      temaSec(e.target.value);
      sihirbazFark();
    });
    $('#ayarlar').addEventListener('input', () => requestAnimationFrame(sihirbazFark));
    $('#ayarlar').addEventListener('change', () => requestAnimationFrame(sihirbazFark));
    $('#tema-sec').addEventListener('change', () => requestAnimationFrame(sihirbazFark));
    k.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-sihirbaz]');
      if (!b || !k.contains(b)) return;
      const is = b.dataset.sihirbaz;
      if (is === 'kapat') return sihirbazKapat();
      if (is === 'geri') return sihirbazGit(sihirbazAdim - 1);
      if (is === 'oneri') return sihirbazOneri();
      if (!ADIMLAR[sihirbazAdim].son) return sihirbazGit(sihirbazAdim + 1);
      if (await ozelKaydet(true)) {
        sihirbazBayrak('bitti');
        sihirbazKapat();
      }
    });
    $('#sihirbaz-ac').addEventListener('click', () => (sihirbazAdim >= 0 ? sihirbazKapat() : sihirbazGit(0)));
  }

  function sihirbazFark() {
    if (sihirbazAdim < 0) return;
    const a = ADIMLAR[sihirbazAdim];
    const el = $('.sihirbaz-etkin [data-sihirbaz-fark]');
    if (!el) return;
    const n = a.tema
      ? Number(!!$('#tema-sec').value) + Number(su.koyu !== ilk.koyu)
      : a.yol.filter((y) => JSON.stringify(yolAl(su, y)) !== JSON.stringify(yolAl(ilk, y))).length;
    el.textContent = n ? 'Bu adımda ' + n + ' ayar önerilenden farklı.' : 'Bu adımdaki ayarlar önerilen değerde.';
  }

  function sihirbazOneri() {
    const a = ADIMLAR[sihirbazAdim];
    if (a.tema) {
      const t = temalar.find((x) => x.ad === $('#tema-sec').value);
      for (const k of DUZENLENEN) {
        const temadan = t && t.renk[k] ? t.renk[k] : ilk.renk[k];
        if (t && su.renk[k] === temadan) {
          su.renk[k] = ilk.renk[k];
          delete hslBellek[k];
        }
      }
      su.koyu = ilk.koyu;
      $('#tema-sec').value = '';
      $('[data-sihirbaz-tema]').value = '';
    } else {
      for (const y of a.yol) yolKoy(su, y, kopya(yolAl(ilk, y)));
      for (const y of a.yol) if (y.startsWith('renk.')) delete hslBellek[y.slice(5)];
    }
    formDoldur();
    planla();
    sihirbazFark();
    durum(a.ad + ': önerilen değerlere dönüldü.');
  }

  function sihirbazGit(i) {
    if (i < 0 || i >= ADIMLAR.length) return;
    const k = $('#sihirbaz');
    const a = ADIMLAR[i];
    sihirbazAdim = i;
    k.hidden = false;
    document.body.dataset.sihirbaz = '';
    $('#sihirbaz-ac').setAttribute('aria-pressed', 'true');
    for (const m of $$('[data-sihirbaz-adim]', k)) {
      const bu = Number(m.dataset.sihirbazAdim) === i;
      m.classList.toggle('sihirbaz-etkin', bu);
      if (bu) m.removeAttribute('aria-hidden');
      else m.setAttribute('aria-hidden', 'true');
    }
    for (const s of $$('[data-sihirbaz-etiket]', k)) {
      const bu = (s.dataset.sihirbazEtiket === 'kaydet') === !!a.son;
      if (bu) s.removeAttribute('aria-hidden');
      else s.setAttribute('aria-hidden', 'true');
    }
    $('[data-sihirbaz-sayac]', k).textContent = 'Adım ' + (i + 1) + ' / ' + ADIMLAR.length;
    $('[data-sihirbaz-dolgu]', k).style.setProperty('--tk-progress-value', String((i + 1) / ADIMLAR.length));
    $('.tk-progress__track', k).setAttribute('aria-valuenow', String(i + 1));
    $('[data-sihirbaz="geri"]', k).disabled = i === 0;
    $('[data-sihirbaz="oneri"]', k).disabled = !a.yol.length;
    if (a.tema) $('[data-sihirbaz-tema]', k).value = $('#tema-sec').value;
    if (a.puan) {
      const p = skorlar();
      $('[data-sihirbaz-puan]', k).textContent = 'Genel okunurluk ' + Math.round(p.su.genel) + ' / 100 · önerilen ' + Math.round(p.ilk.genel);
    }
    for (const d of $$('#ayarlar .sihirbaz-odak')) d.classList.remove('sihirbaz-odak');
    if (a.sayfa) sayfaAc(a.sayfa);
    const ayrac = $('[data-ayrac="sihirbaz"]');
    ayrac.hidden = !a.grup.length;
    ayrac.textContent = 'Sihirbaz · Adım ' + (i + 1) + ': ' + a.ad;
    ayrac.style.order = '-2';
    for (const g of a.grup) {
      const d = $('#ayarlar [data-grup="' + g + '"]');
      if (!d) continue;
      d.classList.add('sihirbaz-odak');
      d.style.order = '-1';
    }
    if (a.grup.length) ayarAc(a.grup);
    const sag = $('.sag');
    if (sag && a.grup.length) sag.scrollTop = 0;
    sihirbazFark();
    document.body.style.setProperty('--sihirbaz-y', k.offsetHeight + 'px');
  }

  function sihirbazKapat() {
    const k = $('#sihirbaz');
    k.hidden = true;
    sihirbazAdim = -1;
    delete document.body.dataset.sihirbaz;
    $('#sihirbaz-ac').setAttribute('aria-pressed', 'false');
    for (const d of $$('#ayarlar .sihirbaz-odak')) d.classList.remove('sihirbaz-odak');
    $('[data-ayrac="sihirbaz"]').hidden = true;
    grupSirala();
    if (!sihirbazBayrak()) sihirbazBayrak('kapandi');
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
    await temalarYukle();
    await ozelYukle();
    const baglanti = new URLSearchParams(location.hash.slice(1));
    let bolum = null;
    const varMi = (id) => SAYFALAR.some((x) => x[0] === id);
    for (const [k, v] of baglanti) {
      if (DUZENLENEN.includes(k) && /^[0-9a-fA-F]{6}$/.test(v)) su.renk[k] = '#' + v.toLocaleLowerCase('tr');
      else if (k === 'kip' && (v === 'tek' || v === 'karsi')) kip = v;
      else if (k === 'sayfa' && varMi(ESKI[v] || v)) sayfa = ESKI[v] || v;
      else if (k === 'arka' && ARKALAR.some((a) => a[0] === v)) su.arka.tur = v;
      else if (k === 'bolum' && /^[a-z]+$/.test(v)) bolum = v;
    }
    if (bolum && sayfa !== 'okunur') {
      if (varMi(bolum)) sayfa = bolum;
      else if (ESKI[bolum]) sayfa = ESKI[bolum];
      bolum = null;
    }
    kipIsaretle();
    uygula(document.documentElement, ilk, false);
    navKur();
    formKur();
    formDoldur();
    oneriKur();
    olaylar();
    kombiOlaylar();
    navGuncelle();
    grupSirala();
    hashYaz();
    ciz();
    const hedef = bolum && document.getElementById('o-' + bolum);
    if (hedef) hedef.scrollIntoView({ behavior: 'instant' });
    window.Onizleme = { durum: () => su, ilk: () => ilk, disaAktar, T: () => T, sonCizim: () => sonCizim, sayfa: () => sayfa, sayfaAc, sihirbaz: sihirbazGit, sihirbazAdim: () => sihirbazAdim, ozel: () => ozelBilgi, fark: () => fark(su, ilk) };
    sihirbazKur();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla);
  else basla();
})();
