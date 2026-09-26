'use strict';

(function () {
  const EGRILER = [
    ['out', 'Yumuşak Varış', [0.2, 0, 0, 1]],
    ['in', 'Çıkış', [0.4, 0, 1, 1]],
    ['spring', 'Yaylı', [0.34, 1.36, 0.64, 1]],
    ['in-out', 'Yavaş-Hızlı-Yavaş', [0.4, 0, 0.2, 1]],
    ['fast-slow-fast', 'Hızlı Başla-Yavaşla-Hızlı Bitir', [0.15, 0.85, 0.85, 0.15]],
    ['emphasized', 'Vurgulu Varış', [0.05, 0.7, 0.1, 1]],
    ['sharp', 'Keskin', [0.4, 0, 0.6, 1]],
    ['linear', 'Doğrusal', [0, 0, 1, 1]],
  ];

  const AD = Object.fromEntries(EGRILER.map(([k, a]) => [k, a]));
  const LISTE = 4;

  const yerel = { sure: 800, a: 'out', b: 'fast-slow-fast', dongu: false, zaman: 0, bitis: 0, dongusu: 0 };

  const $ = (s, kok) => (kok || document).querySelector(s);
  const $$ = (s, kok) => Array.from((kok || document).querySelectorAll(s));
  const yuvarla = (n) => Math.round(n * 100) / 100;

  function adi(ad) {
    return AD[ad] || ad;
  }

  function dizi(b) {
    return '[' + b.map(yuvarla).join(', ') + ']';
  }

  function yol(b) {
    const y = (v) => yuvarla(100 - v * 100);
    return 'M0,100 C' + yuvarla(b[0] * 100) + ',' + y(b[1]) + ' ' + yuvarla(b[2] * 100) + ',' + y(b[3]) + ' 100,0';
  }

  function egriYaz(el, ad, b) {
    el.style.setProperty('--tk-e-' + ad, 'cubic-bezier(' + b.map(yuvarla).join(', ') + ')');
  }

  function grafik(b, ek) {
    return (
      '<div class="egri-alan">' +
      '<svg class="egri-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="egri-izgara" d="M0,0 H100 M0,50 H100 M0,100 H100 M0,0 V100 M50,0 V100 M100,0 V100"/>' +
      '<path class="egri-dogru" d="M0,100 L100,0"/>' +
      (ek || '') +
      '<path class="egri-yol" data-yol="a" d="' + yol(b) + '"/>' +
      '</svg>' +
      '<div class="iz-x akis-hedef"><div class="iz-y akis-hedef"><span class="iz-nokta"></span></div></div>' +
      '</div>'
    );
  }

  function demolar() {
    let li = '';
    for (let i = 0; i < LISTE; i++) li += '<li class="akis-hedef liste-oge" style="--tk-sira: ' + i + '">Satır ' + (i + 1) + '</li>';
    return (
      '<div class="akis-demolar">' +
      '<div class="demo"><span class="demo-ad">Kutu Kayması</span><div class="demo-ray"><span class="akis-hedef kay-kutu"></span></div></div>' +
      '<div class="demo"><span class="demo-ad">Ölçek</span><div class="demo-sahne"><span class="akis-hedef olcek-kutu"></span></div></div>' +
      '<div class="demo"><span class="demo-ad">Panel Açılışı</span><div class="demo-sahne"><div class="akis-hedef panel-kutu"><span></span><span></span></div></div></div>' +
      '<div class="demo"><span class="demo-ad">Liste Kademeli Giriş</span><ul class="demo-liste">' + li + '</ul></div>' +
      '</div>'
    );
  }

  function kart(ad, b, ilk) {
    const degisti = ilk && dizi(ilk) !== dizi(b);
    return (
      '<article class="akis-kart" data-egri="' + ad + '" style="--tk-e-demo: cubic-bezier(' + b.map(yuvarla).join(', ') + ')">' +
      '<header class="akis-kart-ust"><div><h3>' + adi(ad) + '</h3><code>--tk-e-' + ad + '</code></div>' +
      '<button type="button" class="arac-dugme" data-akis-duzenle="' + ad + '" title="Sağdaki eğri düzenleyicide aç">Düzenle</button></header>' +
      grafik(b) +
      '<p class="egri-deger"><code data-deger>' + dizi(b) + '</code><span class="egri-degisti" data-degisti' + (degisti ? '' : ' hidden') + '>Değişti</span></p>' +
      demolar() +
      '</article>'
    );
  }

  function secenekler(secili, egri) {
    return Object.keys(egri)
      .map((ad) => '<option value="' + ad + '"' + (ad === secili ? ' selected' : '') + '>' + adi(ad) + '</option>')
      .join('');
  }

  function serit(ad, etiket, sureVar, egriVar) {
    return (
      '<div class="serit-satir" style="--tk-demo-sure: ' + sureVar + '; --tk-e-demo: ' + egriVar + '">' +
      '<span class="serit-ad">' + etiket + '</span>' +
      '<div class="demo-ray"><span class="akis-hedef kay-kutu' + (ad ? ' kay-' + ad : '') + '"></span></div>' +
      '</div>'
    );
  }

  function karsilastirma(ctx) {
    const A = ctx.egri[yerel.a];
    const B = ctx.egri[yerel.b];
    return (
      '<section class="bolum akis-karsi" data-akis-grup>' +
      '<h3>İki Eğriyi Karşılaştır</h3>' +
      '<div class="akis-sec">' +
      '<label class="alan"><span class="alan-ust"><span><span class="renk-imi imi-a"></span>A Eğrisi</span></span><select class="giris" data-akis="a">' + secenekler(yerel.a, ctx.egri) + '</select></label>' +
      '<label class="alan"><span class="alan-ust"><span><span class="renk-imi imi-b"></span>B Eğrisi</span></span><select class="giris" data-akis="b">' + secenekler(yerel.b, ctx.egri) + '</select></label>' +
      '</div>' +
      '<div class="akis-karsi-ic">' +
      '<div class="akis-grafik akis-grafik-buyuk" data-karsi-grafik>' +
      '<div class="egri-alan">' +
      '<svg class="egri-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="egri-izgara" d="M0,0 H100 M0,25 H100 M0,50 H100 M0,75 H100 M0,100 H100 M0,0 V100 M25,0 V100 M50,0 V100 M75,0 V100 M100,0 V100"/>' +
      '<path class="egri-dogru" d="M0,100 L100,0"/>' +
      '<path class="egri-yol egri-b" data-yol="b" d="' + yol(B) + '"/>' +
      '<path class="egri-yol" data-yol="a" d="' + yol(A) + '"/>' +
      '</svg>' +
      '<div class="iz-x akis-hedef" data-iz="a"><div class="iz-y akis-hedef"><span class="iz-nokta"></span></div></div>' +
      '<div class="iz-x akis-hedef" data-iz="b"><div class="iz-y akis-hedef"><span class="iz-nokta iz-nokta-b"></span></div></div>' +
      '</div></div>' +
      '<div class="akis-seritler">' +
      '<div class="akis-kulvar" data-kulvar="a" style="--tk-e-demo: cubic-bezier(' + A.map(yuvarla).join(', ') + ')">' +
      '<span class="serit-ad"><span class="renk-imi imi-a"></span><span data-kulvar-ad>' + adi(yerel.a) + '</span></span>' + demolar() + '</div>' +
      '<div class="akis-kulvar akis-kulvar-b" data-kulvar="b" style="--tk-e-demo: cubic-bezier(' + B.map(yuvarla).join(', ') + ')">' +
      '<span class="serit-ad"><span class="renk-imi imi-b"></span><span data-kulvar-ad>' + adi(yerel.b) + '</span></span>' + demolar() + '</div>' +
      '</div></div></section>'
    );
  }

  function sureler(ctx) {
    const s = ctx.sure;
    return (
      '<section class="bolum" data-akis-grup><h3>Süre Karşılaştırması</h3>' +
      '<p>Dört süre jetonu A eğrisiyle aynı anda koşar. Anında basma tepkisi, hızlı üzerine gelme, temel varsayılan geçiş, yavaş panel ve sahne geçişi içindir.</p>' +
      '<div class="akis-seritler-sure" data-sure-seritleri>' +
      serit('', 'Anında · <output data-sure-cikti="instant">' + s.instant + ' ms</output>', 'var(--tk-t-instant)', 'var(--tk-e-demo-a)') +
      serit('', 'Hızlı · <output data-sure-cikti="fast">' + s.fast + ' ms</output>', 'var(--tk-t-fast)', 'var(--tk-e-demo-a)') +
      serit('', 'Temel · <output data-sure-cikti="base">' + s.base + ' ms</output>', 'var(--tk-t-base)', 'var(--tk-e-demo-a)') +
      serit('', 'Yavaş · <output data-sure-cikti="slow">' + s.slow + ' ms</output>', 'var(--tk-t-slow)', 'var(--tk-e-demo-a)') +
      '</div></section>'
    );
  }

  function sayfa(ctx) {
    const kartlar = Object.keys(ctx.egri)
      .map((ad) => kart(ad, ctx.egri[ad], ctx.ilkEgri[ad]))
      .join('');
    const sistem = ctx.sistemAz
      ? '<p class="akis-not">Sistemde hareketi azalt açık: arayüz geçişleri kısalır, bu sayfadaki demolar yine oynar.</p>'
      : '';
    return (
      '<div class="akis" data-akis style="--tk-demo-sure: ' + yerel.sure + 'ms">' +
      '<header class="sayfa-bas"><h2>Akıcılık</h2>' +
      '<p>Her eğri kendi grafiği ve dört canlı demoyla aynı anda koşar. Yalnız transform ve opacity canlanır; will-change yalnız oynarken açıktır. Eğriyi sağdaki Eğri Düzenleyici ile değiştirin, Kaydet ile token dosyasına yazın.</p>' +
      sistem + '</header>' +
      '<div class="akis-arac">' +
      '<button type="button" class="tk-btn tk-btn-primary" data-akis-oynat>Tekrar Oynat</button>' +
      '<label class="alan akis-sure"><span class="alan-ust">Demo Süresi <output data-akis-sure-cikti>' + yerel.sure + ' ms</output></span>' +
      '<input type="range" min="100" max="2000" step="10" value="' + yerel.sure + '" data-akis="sure" aria-label="Demo Süresi"></label>' +
      '<div class="akis-hazir" role="group" aria-label="Hazır Süreler">' +
      ['instant', 'fast', 'base', 'slow']
        .map((k, i) => '<button type="button" class="arac-dugme" data-akis-hazir="' + k + '">' + ['Anında', 'Hızlı', 'Temel', 'Yavaş'][i] + '</button>')
        .join('') +
      '</div>' +
      '<label class="secim"><input type="checkbox" data-akis="dongu"' + (yerel.dongu ? ' checked' : '') + '> Sürekli Oynat</label>' +
      '</div>' +
      karsilastirma(ctx) +
      sureler(ctx) +
      '<section class="bolum" data-akis-grup><h3>Tüm Eğriler</h3><div class="akis-kartlar">' + kartlar + '</div></section>' +
      '</div>'
    );
  }

  function kokBul(kok) {
    return $('[data-akis]', kok);
  }

  function birak(kok) {
    const k = kokBul(kok);
    if (k) k.classList.remove('hazir');
  }

  function oynat(kok) {
    const k = kokBul(kok);
    if (!k) return;
    clearTimeout(yerel.bitis);
    k.classList.remove('oynuyor', 'bitti');
    k.classList.add('hazir');
    void k.offsetWidth;
    requestAnimationFrame(() => {
      k.classList.add('oynuyor', 'bitti');
      const kademe = Number.parseFloat(getComputedStyle(k).getPropertyValue('--tk-stagger')) || 0;
      yerel.bitis = setTimeout(() => {
        k.classList.remove('hazir');
        if (yerel.dongu && document.body.contains(k)) yerel.dongusu = setTimeout(() => oynat(kok), Math.max(400, yerel.sure / 2));
      }, Math.max(yerel.sure, 2000) + kademe * LISTE + 100);
    });
  }

  function durdur() {
    clearTimeout(yerel.bitis);
    clearTimeout(yerel.dongusu);
  }

  function karsiGuncelle(kok, ctx) {
    const k = kokBul(kok);
    for (const h of ['a', 'b']) {
      const b = ctx.egri[yerel[h]];
      const p = $('[data-karsi-grafik] [data-yol="' + h + '"]', k);
      if (p) p.setAttribute('d', yol(b));
      const iz = $('[data-iz="' + h + '"]', k);
      if (iz) egriYaz(iz.firstElementChild, 'demo', b);
      const kul = $('[data-kulvar="' + h + '"]', k);
      if (kul) {
        egriYaz(kul, 'demo', b);
        $('[data-kulvar-ad]', kul).textContent = adi(yerel[h]);
      }
    }
    egriYaz(k, 'demo-a', ctx.egri[yerel.a]);
  }

  function guncelle(kok, ctx) {
    const k = kokBul(kok);
    if (!k) return;
    for (const kart of $$('.akis-kart', k)) {
      const ad = kart.dataset.egri;
      const b = ctx.egri[ad];
      if (!b) continue;
      egriYaz(kart, 'demo', b);
      $('.egri-yol', kart).setAttribute('d', yol(b));
      $('[data-deger]', kart).textContent = dizi(b);
      $('[data-degisti]', kart).hidden = !ctx.ilkEgri[ad] || dizi(ctx.ilkEgri[ad]) === dizi(b);
    }
    for (const [ad, ms] of Object.entries(ctx.sure)) {
      const o = $('[data-sure-cikti="' + ad + '"]', k);
      if (o) o.textContent = ms + ' ms';
    }
    karsiGuncelle(kok, ctx);
  }

  function bagla(kok, ctx) {
    const k = kokBul(kok);
    if (!k) return;
    karsiGuncelle(kok, ctx);
    for (const iz of $$('.akis-kart .iz-y', k)) egriYaz(iz, 'demo', ctx.egri[iz.closest('.akis-kart').dataset.egri]);
    k.classList.add('bitti');
    k.addEventListener('input', (e) => {
      const a = e.target.dataset.akis;
      if (a === 'sure') {
        yerel.sure = Number(e.target.value);
        k.style.setProperty('--tk-demo-sure', yerel.sure + 'ms');
        $('[data-akis-sure-cikti]', k).textContent = yerel.sure + ' ms';
      }
    });
    k.addEventListener('change', (e) => {
      const a = e.target.dataset.akis;
      if (a === 'a' || a === 'b') {
        yerel[a] = e.target.value;
        karsiGuncelle(kok, ctx.guncel());
        oynat(kok);
      } else if (a === 'sure') oynat(kok);
      else if (a === 'dongu') {
        yerel.dongu = e.target.checked;
        clearTimeout(yerel.dongusu);
        if (yerel.dongu) oynat(kok);
      }
    });
    k.addEventListener('click', (e) => {
      if (e.target.closest('[data-akis-oynat]')) oynat(kok);
      const h = e.target.closest('[data-akis-hazir]');
      if (h) {
        yerel.sure = ctx.guncel().sure[h.dataset.akisHazir];
        k.style.setProperty('--tk-demo-sure', yerel.sure + 'ms');
        $('[data-akis="sure"]', k).value = yerel.sure;
        $('[data-akis-sure-cikti]', k).textContent = yerel.sure + ' ms';
        oynat(kok);
      }
      const d = e.target.closest('[data-akis-duzenle]');
      if (d && ctx.duzenle) ctx.duzenle(d.dataset.akisDuzenle);
    });
    requestAnimationFrame(() => oynat(kok));
  }

  window.Akicilik = { EGRILER, adi, dizi, yol, egriYaz, sayfa, bagla, guncelle, oynat, durdur, birak };
})();
