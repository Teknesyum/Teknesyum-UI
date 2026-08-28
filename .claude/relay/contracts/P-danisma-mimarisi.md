# P — danışma mimarisi

status: submitted
repo: C:/Users/Administrator/Desktop/Projeler/Teknesyum-Core

Commit atma, push etme.

## Tek ilke

**Advisor, sorandan farklı model çalıştırmak zorundadır.** Profilde farklı model yoksa
advisor **açılmaz** — soru kullanıcıya gider ya da profil yükseltilir. Sahte ikinci görüş
satın alınmaz.

## Kararlar

1. `advisorModelGap: true`. Advisor modeli soranın modeline eşitse açılış bloklanır.
2. Advisor hücreleri: eco `opus/high`, normal `opus/high`, premium `fable/high`.
   Premium'daki çift hücre (`opus/high + fable/high`) **kalkar**. Opus'un bakışı zaten
   masada: karar veren T0 opus, geri alınamaz işte açılan auditor opus.
3. Normal profilde soran opus T0 ise advisor açılmaz. Normal'de advisor'ın asıl müşterisi
   takılmış sonnet builder'dır — sonnet→opus gerçek yükseltmedir.
4. Konsey: `councilFablePass` **silinir** (planları fable'a göstermek körleme kuralıyla
   çelişiyor). Yerine premium konseyi **3 üye**: iki opus planner + bir fable planner,
   üçü de bağımsız ve birbirinden habersiz. eco 1, normal 2 üye.
5. **Sıklık — şimdi yürürlükte.** Premium'da `builder` veya `ui-builder` sözleşmesi
   açılırken advisor da açılır. `scribe` ve `scout` sözleşmeleri muaf. Sözleşme başına
   varsayılan 1 açılış; sinyaller ayrıca açabilir.
6. **Küçük iş deliği kapanır.** T0 sözleşme açmadan kendi yaptığı iş `risk.js` sinyalini
   tetikliyorsa (geri alınamaz işlem, korumalı yol, yeni bağımlılık) advisor yine açılır.
   Hesaplanır, beyan edilmez.
7. **Körleme.** Advisor'a taslak karar ve önceki deneme geçmişi verilmez — yalnız sözleşmenin
   Goal ve Acceptance bölümleri, ham kanıt, dosya yolları.
8. **Gecikme şartı.** Sözleşme açılışına bağlı advisor, sözleşmenin ajanıyla **aynı mesajda
   paralel** açılır. Seri adım eklenmeyecek.
9. Çaprazlama ikinci tur **kurulmaz**. D8'in açık noktalarına yazılır: ayrışma hakemsiz
   kullanıcıya sunulur; olgusal ve test edilebilir ayrışmada çözüm ikinci tur değil
   doğrulamadır (komut koş, exit code'a bak).

## İş

- `core/tiers.json`: advisor hücreleri, `advisorModelGap`, `council` üye sayıları,
  `councilMemberOverride` (premium üçüncü üye fable/high), `advisorDefault`
  (premium, `onContractOpen: [builder, ui-builder]`, `perContract: 1`).
  `councilFablePass` ve `secondOpinion` blokları kaldırılır.
- `core/scripts/contract.js`: `tier` çözücüsü `advisorModelGap`'i uygular ve advisor
  açılamıyorsa **sebebiyle birlikte** bunu söyler. Eco kotası (1/sözleşme, 3/relay) durur.
- `core/roles/advisor.md`: körleme kuralı tek cümleyle girer.
- `core/skills/relay/SKILL.md`: kademe + danışma bölümü **en fazla 10 satır**. Tabloyu
  kopyalama, çözücü komutu göster. Dosya 150 satırı geçmeyecek.
- `docs/DECISIONS.md`: D8 güncellenir, açık noktalar bölümü eklenir.
- `test/all.js`: yeni iddialar.

## Kabul

- `contract.js tier --role advisor --profile normal --asker opus` → advisor açılmaz,
  sebep yazılı.
- `--role advisor --profile normal --asker sonnet` → `opus/high`.
- `--role advisor --profile premium --asker opus` → `fable/high`.
- `--role advisor --profile eco --asker sonnet` → `opus/high`, tavan muafiyeti notuyla.
- Premium konseyi 3 üye döner, üçüncüsü `fable/high`.
- `tiers.json` içinde `councilFablePass` ve `secondOpinion` yok.
- Eco'da dördüncü advisor açılışı bloklanır.
- `node test/all.js` geçer, enjeksiyon testi bozulmadan.

Rapor kısa: değişen dosyalar, `tier` çıktısının yeni biçimi, sekiz kabul maddesinin sonucu.

## Rapor

round: 1

Degisen dosyalar (hepsi Teknesyum-Core):

- `core/tiers.json` — advisor premium hucresi `fable/high`, `advisorModelGap: true`,
  `advisorDefault` (premium / builder + ui-builder / 1), `council` premium 3,
  `councilMemberOverride` premium 3 = `fable/high`, `signals.selfRiskOpensAdvisor`.
  `secondOpinion` ve `councilFablePass` silindi.
- `core/scripts/contract.js` — `secondOpinion` yeniden yazimi kalkti, yerine model bosluk
  kurali: advisor hucresi soranin modeline esitse `blocked` doner, CLI cikis 2 verir ve
  sebebi yazar. `advisorDefault` builder/ui-builder icin not uretir. Yeni `council(profile)`
  cozucusu ve `contract.js council --profile P` komutu.
- `core/roles/advisor.md` — korleme kurali iki satir.
- `core/skills/relay/SKILL.md` — kademe + danisma bolumu 10 satir (5 kademe, 4 danisma),
  dosya 134 satir. Tablo kopyalanmadi.
- `docs/DECISIONS.md` — D8: tablo advisor satiri, konsey 3 uye, model bosluk kurali,
  korleme, siklik, ucuncu acik nokta (hakemsiz ayrisma, cozum dogrulama).
- `test/all.js` — 26 yeni iddia; toplam 2189 gecti, 0 kaldi.

`tier` ciktisinin yeni bicimi: `--asker` verildiginde `asker <model>` satiri eklenir;
bloklandiginda ilk satir `advisor does not open` olur, sona `Blocked - <sebep>.` ve
`The advisor does not open. Ask the user, or raise the profile...` satirlari gelir, cikis 2.

Kabul:

1. `--profile normal --asker opus` → acilmaz, sebep yazili, exit 2. GECTI
2. `--profile normal --asker sonnet` → `opus/high`. GECTI
3. `--profile premium --asker opus` → `fable/high`. GECTI
4. `--profile eco --asker sonnet` → `opus/high`, tavan muafiyeti notu. GECTI
5. Premium konseyi 3 uye, ucuncusu `fable/high`. GECTI
6. `tiers.json` icinde `councilFablePass` ve `secondOpinion` yok. GECTI
7. Eco'da dorduncu advisor acilisi bloklanir (mevcut kota testi korundu). GECTI
8. `node test/all.js` 2189/2189; enjeksiyon testi (`testNoContextWrites`) bozulmadi. GECTI

Commit atilmadi, push edilmedi.

Kapsam disi not: `docs/COST-MODEL.md` olcum tablosu D8 oncesi rakamlari tasiyor,
guncellenmedi.
