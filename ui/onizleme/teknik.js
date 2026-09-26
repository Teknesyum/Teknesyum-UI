'use strict';

(function () {
  const BOY = 300;
  const $ = (s, kok) => (kok || document).querySelector(s);

  let kok = null;
  let kare = 0;
  let onceki = 0;
  let son = 0;
  let yaz = 0;
  let aralik = 1000 / 60;
  let gozlem = null;
  let uzun = { sayi: 0, toplam: 0 };
  let dusen = 0;
  const YUK_UYARI = 1500;
  const YUK_TEHLIKE = 2000;
  const yukYuzde = (n) => Math.round(((n - 50) / (3000 - 50)) * 1000) / 10;
  const yukBolge = (n) => (n >= YUK_TEHLIKE ? 'tehlike' : n >= YUK_UYARI ? 'uyari' : 'rahat');
  const yukNot = (n) =>
    n >= YUK_TEHLIKE
      ? 'Uyarı: ' + YUK_TEHLIKE + ' ve üstü bu makinede 60 fps altına iniyor; arayüz takılabilir.'
      : n >= YUK_UYARI
        ? 'Dikkat: ' + YUK_UYARI + ' ve üstü bu makinede 60 fps sınırında.'
        : YUK_UYARI + ' altı rahat; ' + YUK_UYARI + ' dikkat, ' + YUK_TEHLIKE + ' üstü uyarı bölgesi.';
  let toplamKare = 0;
  let zamanlar = [];
  const halka = new Float64Array(BOY);
  let n = 0;
  let yuk = { calisiyor: false, animler: [], sayi: 500 };
  let renkler = null;

  function kacis(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function olcu(id, ad, birim) {
    return '<div class="olcu"><span class="olcu-ad">' + ad + '</span><span class="olcu-deger"><output data-olcu="' + id + '">—</output>' + (birim ? '<span class="olcu-birim">' + birim + '</span>' : '') + '</span></div>';
  }

  function satir(ad, id) {
    return '<tr><th scope="row">' + ad + '</th><td><output data-ortam="' + id + '">—</output></td></tr>';
  }

  function sayfa() {
    return (
      '<div class="teknik">' +
      '<header class="sayfa-bas"><h2>Teknik</h2><p>Ölçüm yalnız bu panel açıkken çalışır; başka bir bileşene geçince durur. Kare süresi requestAnimationFrame aralığıdır, düşen kare yenileme aralığının 1,5 katını aşan her karede sayılır.</p></header>' +
      '<section class="bolum"><h3>Kare Hızı</h3>' +
      '<div class="olcu-izgara">' +
      olcu('fps', 'Kare Hızı', 'FPS') +
      olcu('ort', 'Ortalama Kare', 'ms') +
      olcu('p95', 'P95 Kare', 'ms') +
      olcu('kotu', 'En Kötü Kare', 'ms') +
      olcu('dusen', 'Düşen Kare', '') +
      olcu('uzun', 'Uzun Görev', '') +
      olcu('hz', 'Yenileme Hızı', 'Hz') +
      olcu('cizim', 'Son Sayfa Çizimi', 'ms') +
      '</div>' +
      '<div class="kare-grafik-kap"><canvas class="kare-grafik" data-kare-grafik aria-label="Son 300 karenin süresi" role="img"></canvas>' +
      '<p class="kare-grafik-not">Son ' + BOY + ' kare · çizgi bir yenileme aralığı · yüksek sütun düşen kare</p></div>' +
      '<div class="satir"><button type="button" class="tk-btn tk-btn-ghost" data-teknik="sifirla">Ölçümü Sıfırla</button></div>' +
      '</section>' +
      '<section class="bolum"><h3>Yük Testi</h3>' +
      '<p>Seçilen sayıda öğe yalnız transform ve opacity ile sürekli canlanır; kare hızı yukarıda izlenir. Öğeler kompozitörde koşar, will-change yalnız test sürerken açıktır.</p>' +
      '<div class="yuk-arac">' +
      '<label class="alan yuk-sayi"><span class="alan-ust">Öğe Sayısı <output data-yuk-cikti data-yuk-bolge="' + yukBolge(yuk.sayi) + '">' + yuk.sayi + '</output></span>' +
      '<input type="range" min="50" max="3000" step="50" value="' + yuk.sayi + '" data-yuk-sayi aria-label="Öğe Sayısı" aria-describedby="yuk-not">' +
      '<span class="yuk-serit" aria-hidden="true"><span style="width:' + yukYuzde(YUK_UYARI) + '%"></span><span data-yuk-bolge="uyari" style="width:' + (yukYuzde(YUK_TEHLIKE) - yukYuzde(YUK_UYARI)) + '%"></span><span data-yuk-bolge="tehlike"></span></span>' +
      '<span class="yuk-not" id="yuk-not" data-yuk-bolge="' + yukBolge(yuk.sayi) + '">' + yukNot(yuk.sayi) + '</span></label>' +
      '<button type="button" class="tk-btn tk-btn-primary" data-teknik="yuk">Testi Başlat</button>' +
      '</div>' +
      '<div class="yuk-sahne" data-yuk-sahne aria-hidden="true"></div>' +
      '</section>' +
      '<section class="bolum"><h3>Ortam</h3><div class="tablo-kap"><table><tbody>' +
      satir('Chrome Sürümü', 'chrome') +
      satir('Electron Sürümü', 'electron') +
      satir('Grafik İşlemcisi', 'gpu') +
      satir('Piksel Oranı', 'dpr') +
      satir('Ekran', 'ekran') +
      satir('Pencere', 'pencere') +
      satir('JS Belleği', 'bellek') +
      satir('Mantıksal Çekirdek', 'cekirdek') +
      satir('Sistem Hareketi Azalt', 'azalt') +
      satir('Uzun Görev Ölçümü', 'longtask') +
      '</tbody></table></div></section>' +
      '</div>'
    );
  }

  function gpu() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'WebGL yok';
      const u = gl.getExtension('WEBGL_debug_renderer_info');
      const ad = u ? gl.getParameter(u.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const k = gl.getExtension('WEBGL_lose_context');
      if (k) k.loseContext();
      return ad;
    } catch {
      return 'Okunamadı';
    }
  }

  function ortam() {
    const ua = navigator.userAgent;
    const ch = /Chrome\/([\d.]+)/.exec(ua);
    const el = /Electron\/([\d.]+)/.exec(ua);
    const yazO = (id, v) => {
      const o = $('[data-ortam="' + id + '"]', kok);
      if (o) o.textContent = v;
    };
    yazO('chrome', ch ? ch[1] : 'Chromium değil');
    yazO('electron', el ? el[1] : 'Tarayıcı kipi');
    yazO('gpu', gpu());
    yazO('dpr', String(window.devicePixelRatio));
    yazO('ekran', screen.width + ' × ' + screen.height);
    yazO('pencere', window.innerWidth + ' × ' + window.innerHeight);
    yazO('cekirdek', String(navigator.hardwareConcurrency || '—'));
    yazO('azalt', matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Açık' : 'Kapalı');
    yazO('longtask', gozlem ? 'Açık' : 'Desteklenmiyor');
  }

  function bellek() {
    const m = performance.memory;
    const o = $('[data-ortam="bellek"]', kok);
    if (!o) return;
    if (!m) {
      o.textContent = 'Desteklenmiyor';
      return;
    }
    const mb = (b) => (b / 1048576).toFixed(1);
    o.textContent = mb(m.usedJSHeapSize) + ' / ' + mb(m.totalJSHeapSize) + ' MB · sınır ' + mb(m.jsHeapSizeLimit) + ' MB';
  }

  function sifirla() {
    n = 0;
    dusen = 0;
    toplamKare = 0;
    zamanlar = [];
    uzun = { sayi: 0, toplam: 0 };
    onceki = 0;
  }

  function sirali() {
    const m = Math.min(n, BOY);
    const a = new Array(m);
    for (let i = 0; i < m; i++) a[i] = halka[i];
    return a.sort((x, y) => x - y);
  }

  function renkOku() {
    const cs = getComputedStyle(kok);
    const v = (ad) => cs.getPropertyValue(ad).trim();
    renkler = { cubuk: v('--tk-blue'), kotu: v('--tk-danger-text'), cizgi: v('--tk-warning'), zemin: v('--tk-border-decorative') };
  }

  function ciz() {
    const c = $('[data-kare-grafik]', kok);
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!renkler) renkOku();
    const tavan = Math.max(aralik * 3, 50);
    const m = Math.min(n, BOY);
    const gen = w / BOY;
    g.fillStyle = renkler.zemin;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < m; i++) {
      const idx = (n - m + i) % BOY;
      const d = halka[idx];
      const y = Math.min(h, (d / tavan) * h);
      g.fillStyle = d > aralik * 1.5 ? renkler.kotu : renkler.cubuk;
      g.fillRect((BOY - m + i) * gen, h - y, Math.max(1, gen - 0.5), y);
    }
    const cy = h - (aralik / tavan) * h;
    g.fillStyle = renkler.cizgi;
    g.fillRect(0, Math.round(cy), w, 1);
  }

  function metin(id, v, not) {
    const o = $('[data-olcu="' + id + '"]', kok);
    if (!o) return;
    o.textContent = v;
    if (not) o.dataset.not = not;
    else delete o.dataset.not;
  }

  function rapor(simdi) {
    const s = sirali();
    if (!s.length) return;
    const ort = s.reduce((t, x) => t + x, 0) / s.length;
    const p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
    const kotu = s[s.length - 1];
    const alt = s[Math.floor(s.length * 0.2)];
    if (s.length >= 30) aralik = alt;
    const hz = Math.round(1000 / aralik);
    while (zamanlar.length && simdi - zamanlar[0] > 1000) zamanlar.shift();
    const fps = zamanlar.length;
    const fpsNot = fps >= hz * 0.95 ? 'mukemmel' : fps >= 55 ? 'iyi' : fps >= 30 ? 'zayif' : 'kotu';
    metin('fps', String(fps), fpsNot);
    metin('ort', ort.toFixed(2));
    metin('p95', p95.toFixed(2), p95 > aralik * 1.5 ? 'zayif' : null);
    metin('kotu', kotu.toFixed(1), kotu > aralik * 3 ? 'kotu' : kotu > aralik * 1.5 ? 'zayif' : null);
    metin('dusen', dusen + ' / ' + toplamKare, dusen ? 'zayif' : null);
    metin('uzun', gozlem ? uzun.sayi + ' · ' + Math.round(uzun.toplam) + ' ms' : '—', uzun.sayi ? 'zayif' : null);
    metin('hz', String(hz));
    const c = window.Onizleme && window.Onizleme.sonCizim ? window.Onizleme.sonCizim() : null;
    metin('cizim', c == null ? '—' : c.toFixed(1), c > aralik ? 'zayif' : null);
    bellek();
  }

  function dongu(simdi) {
    if (!kok) return;
    if (onceki) {
      const d = simdi - onceki;
      if (d < 1000) {
        halka[n % BOY] = d;
        n++;
        toplamKare++;
        if (n > 30 && d > aralik * 1.5) dusen += Math.max(1, Math.round(d / aralik) - 1);
      }
    }
    onceki = simdi;
    zamanlar.push(simdi);
    ciz();
    if (simdi - yaz > 250) {
      yaz = simdi;
      rapor(simdi);
    }
    kare = requestAnimationFrame(dongu);
  }

  function yukDurdur() {
    for (const a of yuk.animler) a.cancel();
    yuk.animler = [];
    yuk.calisiyor = false;
    if (!kok) return;
    const s = $('[data-yuk-sahne]', kok);
    if (s) s.replaceChildren();
    const b = $('[data-teknik="yuk"]', kok);
    if (b) b.textContent = 'Testi Başlat';
  }

  function yukBaslat() {
    const s = $('[data-yuk-sahne]', kok);
    if (!s) return;
    yukDurdur();
    const parca = document.createDocumentFragment();
    const ogeler = [];
    for (let i = 0; i < yuk.sayi; i++) {
      const e = document.createElement('span');
      e.className = 'yuk-oge yuk-renk-' + (i % 3);
      e.style.left = ((i * 37) % 97) + '%';
      e.style.top = ((i * 53) % 89) + '%';
      parca.appendChild(e);
      ogeler.push(e);
    }
    s.appendChild(parca);
    const sure = Number.parseFloat(getComputedStyle(kok).getPropertyValue('--tk-t-slow')) || 360;
    ogeler.forEach((e, i) => {
      e.style.willChange = 'transform, opacity';
      const a = e.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: 'translate(' + (((i % 7) - 3) * 12) + 'px, ' + (((i % 5) - 2) * 12) + 'px) rotate(180deg) scale(0.6)', opacity: 0.4 },
        ],
        { duration: sure * (4 + (i % 4)), iterations: Infinity, direction: 'alternate', delay: -(i * 17) % 1000 }
      );
      yuk.animler.push(a);
    });
    yuk.calisiyor = true;
    const b = $('[data-teknik="yuk"]', kok);
    if (b) b.textContent = 'Testi Durdur';
  }

  function tik(e) {
    const t = e.target.closest('[data-teknik]');
    if (!t) return;
    if (t.dataset.teknik === 'sifirla') sifirla();
    else if (t.dataset.teknik === 'yuk') {
      if (yuk.calisiyor) yukDurdur();
      else yukBaslat();
    }
  }

  function girdi(e) {
    if (!e.target.matches('[data-yuk-sayi]')) return;
    yuk.sayi = Number(e.target.value);
    const o = $('[data-yuk-cikti]', kok);
    const n = $('#yuk-not', kok);
    o.textContent = yuk.sayi;
    o.dataset.yukBolge = n.dataset.yukBolge = yukBolge(yuk.sayi);
    n.textContent = yukNot(yuk.sayi);
  }

  function degisim(e) {
    if (e.target.matches('[data-yuk-sayi]') && yuk.calisiyor) yukBaslat();
  }

  function baslat(el) {
    durdur();
    kok = el;
    renkler = null;
    sifirla();
    try {
      if (PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        gozlem = new PerformanceObserver((l) => {
          for (const g of l.getEntries()) {
            uzun.sayi++;
            uzun.toplam += g.duration;
          }
        });
        gozlem.observe({ type: 'longtask' });
      }
    } catch {
      gozlem = null;
    }
    ortam();
    kok.addEventListener('click', tik);
    kok.addEventListener('input', girdi);
    kok.addEventListener('change', degisim);
    kare = requestAnimationFrame(dongu);
  }

  function durdur() {
    cancelAnimationFrame(kare);
    kare = 0;
    if (gozlem) gozlem.disconnect();
    gozlem = null;
    yukDurdur();
    if (kok) {
      kok.removeEventListener('click', tik);
      kok.removeEventListener('input', girdi);
      kok.removeEventListener('change', degisim);
    }
    kok = null;
  }

  function renkYenile() {
    renkler = null;
  }

  window.Teknik = { sayfa, baslat, durdur, renkYenile, calisiyor: () => !!kok, kacis };
})();
