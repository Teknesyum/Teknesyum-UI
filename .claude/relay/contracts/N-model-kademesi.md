# N — model kademesi ve görünürlük

status: submitted
repo: C:/Users/Administrator/Desktop/Projeler/Teknesyum-Core
owns: core/roles/*.md, core/skills/relay/SKILL.md, core/scripts/statusline.js, core/scripts/contract.js, docs/DECISIONS.md, test/all.js

Bu iş **Core deposunda** yapılır, UI deposunda değil. Commit atma, push etme.

## Karar (uygulanacak, tartışılmayacak)

Bugün her ajan opus açılıyor. Angarya işte bu israf, karar taşıyan işte gerekli.

1. **Taban rol dosyasında.** Her `core/roles/*.md` frontmatter'ına `model:` ve `effort:` ekle.
   - `planner`, `auditor`, `advisor` → `model: opus`
   - `builder`, `scout` → `model: sonnet`
   - `effort`: opus tabanlarında `medium`, `advisor`'da `high`, sonnet tabanlarında `low`.
2. **Sinyal yükseltir, model düşürmez.** Sözleşmenin `risk:` alanı `high` ise builder opusa
   çıkar. Çağıran tabanı yükseltebilir; **hiçbir yol tabanın altına inemez**. Gerekçe: bedeli
   kısan taraf kaliteyi seçen taraf olmamalı — D1'in aynı kuralı.
   Risk `contract.js` tarafından hesaplanır, modelin beyanı değildir; oradan oku.
3. **Profil tavandır.** `~/.claude/teknesyum.json` profili `eco` ise opus tabanları sonnete
   iner; `premium` her şeyi açar; `normal` tabanları aynen bırakır. Tavan tabanı ezer.
4. **D3 duruyor.** Tek jenerik ajan kalır. Model per-spawn parametresiyle geçilir —
   `Agent` aracının `model` alanı agent tanımındaki frontmatter'ı ezer, doğrulandı.
   Kabuk ajan (`worker-lite` gibi) **açma**.

## Görünürlük

Kullanıcı hangi ajanın hangi model ve eforla açıldığını görecek. Bedel kuralı:
banner bastırmak yasak (C×5), hook `additionalContext` yasak.

- Ajan açılışını yazan taraf, ajanın `live/` kaydına `model` ve `effort` alanlarını yazsın.
- `statusline.js` bunu okusun ve açık ajanların yanında göstersin — kısa biçim, örneğin
  `builder·sonnet/low`. Statusline Z sınıfıdır, terminale yazar, modele hiç ulaşmaz.
- `SKILL.md`'ye tek satır: çağıran, rol dosyasının yolunu yazarken modeli ve eforu da
  geçirir. Uzun anlatım yok.

## Kabul

- Beş rol dosyasının frontmatter'ında `model` ve `effort` var.
- `SKILL.md` 150 satırı geçmiyor ve kademe kuralı en fazla 6 satır tutuyor.
- `docs/DECISIONS.md` içine `## D7 — Model tiering` başlığı: karar, bedel sınıfı, gerekçe,
  ve Fable'ın "Task model geçiremeyebilir" çekincesinin neden geçersiz olduğu.
- `test/all.js`: her rol dosyasının `model` ve `effort` alanı olduğunu, değerlerin izinli
  kümede olduğunu, ve hiçbir kod yolunun tabanın altına inmediğini iddia eden testler.
- `node test/all.js` geçer.
- Tur başına enjeksiyon hâlâ 0 — mevcut bedel testi bozulmadan geçmeli.

Rapor kısa: değişen dosyalar, statusline'ın nasıl gösterdiği, altı kabul maddesinin sonucu.

## Rapor

round: 1

Değişen dosyalar (hepsi `owns` içinde, Teknesyum-Core deposunda, commit atılmadı):

- `core/roles/*.md` — beşine de `role:`, `model:`, `effort:` frontmatter'ı eklendi.
- `core/scripts/contract.js` — `roleBase()`, `tier()` ve `tier` alt komutu; export edildi.
- `core/scripts/statusline.js` — `label()`, ajanın `live/` kaydındaki `model`/`effort`'u basar.
- `core/skills/relay/SKILL.md` — Agents bölümüne 4 satır kademe kuralı (dosya 128 satır).
- `docs/DECISIONS.md` — `## D8 — Model tiering`.
- `test/all.js` — `testTier()` ve `testTierVisible()`.

Statusline: çalışan ajanın `live/<id>.json` kaydında `model` varsa rol etiketi
`builder·sonnet/low` biçiminde basılır; yoksa eskisi gibi sadece rol adı. Terminale yazar,
modele ulaşmaz — sınıf Z, bedel değişmedi.

Kademe çözümü tek yerde: `node core/scripts/contract.js tier --role builder --id T7`.
Sıra: rol dosyasındaki taban → risk `high` ise yükseltme (risk `contract.js`'ten okunur,
beyandan değil) → çağıranın yükseltmesi → profil tavanı. Tavan dışında hiçbir yol tabanın
altına inmez; `--model haiku` isteği reddedilir ve gerekçesi basılır.

Kabul maddeleri:

1. Beş rol dosyasında `model` ve `effort` — geçti.
2. `SKILL.md` 128 satır, kademe kuralı 4 satır — geçti.
3. `docs/DECISIONS.md` başlığı — **sapma**: `D7` numarası "Constants are written by a
   script" kararı tarafından kullanılıyordu. Karar `## D8 — Model tiering` olarak yazıldı,
   içerik sözleşmedeki dört maddeyi (karar, bedel sınıfı, gerekçe, Fable çekincesinin neden
   geçersiz olduğu) karşılıyor. Mevcut D7'yi yeniden numaralamadım.
4. Rol alanları + izinli küme + "taban altına inilmiyor" testleri — geçti; sonuncusu beş
   rol × üç model × üç efor × üç risk kombinasyonunu tarıyor.
5. `node test/all.js` → 266 passed, 0 failed.
6. Tur başına enjeksiyon 0 — `testNoContextWrites` bozulmadan geçti.

Kapsam dışı not: `core/hooks/watch.js` ajan `live/` kaydını yazan taraf; `model`/`effort`
alanlarını oraya kimin yazacağı bu sözleşmenin `owns` listesinde değil. Statusline alan
varsa gösteriyor, yoksa sessiz. Bu boşluğu doldurmak ayrı bir sözleşme.

status: submitted
