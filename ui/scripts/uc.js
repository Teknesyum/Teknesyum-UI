#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const raf = require('./raf');

const SCRIPTS = __dirname;

function js(ad) {
  return 'node "' + path.join(SCRIPTS, ad) + '"';
}

function gitKok(from) {
  let d = path.resolve(from || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

function metin(secenek) {
  const s = secenek || {};
  const kok = gitKok(s.cwd) || path.resolve(s.cwd || process.cwd());
  const satirlar = [];
  if (raf.var()) {
    satirlar.push(
      'UI denetimi (uc), teknesyum-ui yönetir. Önce yordamı oku: `' + js('raf.js') + ' ui-denetim`; ölçülen kurallar: `' + js('raf.js') + ' ui-duzeni`. Yordamı sırayla uygula; raf ile eklenti çelişirse eklenti kazanır.'
    );
  } else {
    satirlar.push('UI denetimi (uc), teknesyum-ui yönetir. Bu makinede özel raf yok: yalnız tarayıcının kuralları geçerli, bunu bir kez söyle ve kural uydurma.');
  }
  satirlar.push(
    'Amaç yalnız ölçmek değil: sahibin düzeni (`ui-duzeni` ve benim.tokens.json) programın her penceresine, paneline, sekmesine, iletişim kutusuna ve boş, hata, yükleme hâline eksiksiz uygulanır. Önce ekran envanterini çıkar ve rapora yaz; envanterde düzene geçmemiş ya da denetlenmemiş tek ekran kalırsa iş bitmez. Projenin kendi renk ya da tema sistemi varsa düzenin token\'larına bağlanır, kendi değerini taşımaz.'
  );
  if (!fs.existsSync(path.join(kok, '.claude', 'teknesyum-ui.json')))
    satirlar.push('Proje standarda bağlı değil: önce `' + js('setup.js') + ' --check --project "' + kok + '"`, sonra `--apply --template benim`.');
  satirlar.push(
    'Tarama: `' + js('scan.js') + ' "' + kok + '"`. Web kontrastı: `' + js('denetim.js') + ' --snippet` çıktısını sayfada koş. Avalonia/WPF: `' + js('scaffold.js') + ' denetim <Ad>`. Her yazıyı her durumda gerçek zeminine karşı ölç.'
  );
  const bekleyen = raf.bekleyen(kok);
  if (bekleyen.length) satirlar.push('Bekleyen raf kitapları: ' + bekleyen.map((b) => b.ad).join(', ') + '. Denetimle birlikte uydur, `' + js('raf.js') + ' --uydu <ad> --project "' + kok + '"` ile kaydet.');
  satirlar.push('Rapor: `docs/ui-denetim/YYYY-MM-DD.md`. Bitiş: sıfır kontrast hatası, sıfır tarayıcı hatası; "çalışıyor" başsız testle, "kullanılabilir" görüntüyle, ayrı kanıt.');
  const kapsam = String(s.kapsam || '').trim();
  if (kapsam) satirlar.push('Kapsam: ' + kapsam);
  return satirlar.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node uc.js [--project root] [scope...]\n\nPrints the UI check instruction that the `uc` mark puts into the turn.\n');
    return 0;
  }
  const i = args.indexOf('--project');
  const cwd = i >= 0 ? args[i + 1] : process.cwd();
  const kapsam = args.filter((a, n) => i < 0 || (n !== i && n !== i + 1)).join(' ');
  process.stdout.write(metin({ cwd, kapsam }) + '\n');
  return 0;
}

module.exports = { metin };

if (require.main === module) process.exitCode = main(process.argv);
