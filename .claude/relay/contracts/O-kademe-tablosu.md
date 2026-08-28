# O — onaylanmış kademe tablosunu kur

status: submitted
repo: C:/Users/Administrator/Desktop/Projeler/Teknesyum-Core (asıl iş)
       C:/Users/Administrator/Desktop/Projeler/Teknesyum-UI (yalnız ui-builder rol dosyası)

Commit atma, push etme.

## Onaylanmış tablo

Hücre `model/effort`. Kalın olanlar profil tavanını deler.

| Rol | eco | normal | premium |
|---|---|---|---|
| T0 (yalnız öneri, zorlayıcı değil) | sonnet | opus | opus |
| planner | sonnet/medium | opus/medium | opus/high |
| builder | sonnet/low | sonnet/medium | opus/medium |
| ui-builder | sonnet/low | sonnet/medium | opus/medium |
| scribe | haiku/low | haiku/low | sonnet/low |
| scout | haiku/low | sonnet/low | sonnet/medium |
| auditor | **opus/medium** | opus/medium | opus/high |
| advisor | **opus/high** | opus/high | opus/high + fable/high |

Alt arama ajanları rol değildir: her profilde `haiku/low`, sabit.

Plan konseyi üye sayısı profile bağlı: eco 1, normal 2, premium 2 + fable geçişi.

## Kurallar

1. **Yükselt serbest, düşür yasak.** D8'in mevcut yasası aynen kalır.
2. **Tavan-delme.** Risk kapısının açtığı her rol profil tavanından muaftır: `auditor`,
   `advisor`, ve risk'le yükselmiş `builder`/`ui-builder`. Kullanıcı kararı: eco'da risk'le
   yükselen builder **opusa çıkar**, `sonnet/high`ta kalmaz.
3. **Yükseltme sinyalleri** — mevcut `risk: high` kapısına ek dört sinyal:
   - Aynı verify adımı iki kez aynı imzayla düştü → önce `effort` +1, hâlâ düşerse `model` +1.
   - `round >= 3` → builder `model` +1.
   - `round >= 4` → yeni denemeden **önce** advisor açılması zorunlu.
   - Geri alınamaz işlem (migration, release, history rewrite; yol ve komut deseninden
     `contract.js` hesaplar) → auditor açılır, profil ne olursa olsun.
4. **Advisor tavana tabi değil.** Eco'da da opus açılır. Soran taraf zaten opus ise advisor
   `fable/high`a döner — aynı model kendine ikinci görüş veremez.
5. **Eco danışma kotası.** Sözleşme başına en fazla 1, relay başına en fazla 3 advisor
   açılışı. `contract.js` `live/` kayıtlarından sayar, aşımı bloklar. Normal ve premium'da
   kota yok.
6. **xhigh ve max efor otomatik verilmez** — yalnız kullanıcının açık talebiyle.

## İş

1. Tabloyu **veri** olarak yaz: `core/tiers.json`. Prose'da tekrarlanmasın. Kademe tek
   yerden çözülür — `contract.js tier` bu dosyayı ve sinyalleri okur.
2. Eksik rol dosyalarını aç: `core/roles/scribe.md`. Mevcut beşinin frontmatter'ını yeni
   tabloya göre güncelle — `model`/`effort` artık profile bağlı olduğu için rol dosyası
   tek değer değil, tablodaki satırın kimliğini taşısın (örneğin `tier: builder`).
3. UI deposundaki `ui/roles/ui-builder.md` frontmatter'ına aynı biçimde `tier: ui-builder`
   ekle. UI deposunda başka hiçbir şeye dokunma.
4. `contract.js tier` çıktısı hangi hücreden geldiğini, hangi sinyalin yükselttiğini ve
   tavanın delinip delinmediğini tek ekranda göstersin.
5. `statusline.js` zaten `model/effort` okuyor; profil de görünsün.
6. `core/skills/relay/SKILL.md`: kademe kuralı **en fazla 6 satır**. Tabloyu oraya kopyalama,
   çözücü komutu göster. SKILL.md 150 satırı geçmeyecek.
7. `docs/DECISIONS.md` içindeki D8'i yeniden yaz: tam tablo, dört sinyal, tavan-delme
   gerekçesi, advisor muafiyeti ve üç yapısal kilidi (araç seti, çıktı tavanı, kota).
   Fable'ın işaretlediği iki belirsizliği de kaydet: eco tavan-delme kullanıcı kararıyla
   çözüldü, maliyet oranları ilk gerçek relay'de doğrulanacak.

## Kabul

- `node core/scripts/contract.js tier --role builder --profile eco` → `sonnet/low`.
- Aynı komut `--risk high` ile → `opus/medium`, tavan delindi notuyla.
- `--role advisor --profile eco` → `opus/high`, tavan muafiyeti notuyla.
- `--role scribe --profile normal` → `haiku/low`.
- Eco'da dördüncü advisor açılışı bloklanır, üçüncü geçer.
- `test/all.js`: tablodaki 24 hücrenin tamamı, dört sinyal, tavan-delme, kota, ve hiçbir
  yolun tabanın altına inmediği iddia edilir. Mevcut enjeksiyon testi bozulmadan geçer.
- `node test/all.js` geçer.

Rapor kısa: değişen dosyalar, `tier` çıktısının biçimi, yedi kabul maddesinin sonucu.

## Kayıt noktası

Yedi iş maddesi de bitti. `node test/all.js` -> 2163 passed, 0 failed.

## Rapor

### Değişen dosyalar

Teknesyum-Core:
- `core/tiers.json` (yeni) — 8 satır x 3 profil, tavan, muafiyet listeleri, sinyal eşikleri,
  kota, konsey sayısı, alt ajan sabiti. Tablo yalnız burada.
- `core/scripts/contract.js` — `tier` çözücüsü yeniden yazıldı: `roleRow`, `roleBase`,
  `tier`, `advisorQuota`, `tiers`. Rol dosyası artık satır adını taşıyor, hücre
  tiers.json'dan geliyor.
- `core/scripts/risk.js` — `irreversible(owns, steps)` eklendi; yol ve komut deseni.
- `core/scripts/statusline.js` — profil her zaman basılıyor, yazılı değilse `normal`.
- `core/roles/{advisor,auditor,builder,planner,scout}.md` — `model:`/`effort:` yerine `tier:`.
- `core/roles/scribe.md` (yeni).
- `core/skills/relay/SKILL.md` — kademe kuralı 6 satır, tablo yok, çözücü komut var. 134 satır.
- `docs/DECISIONS.md` — D8 yeniden yazıldı.
- `test/all.js` — `testTier` yeniden yazıldı, `testQuota` eklendi, `testTierVisible` genişletildi.

Teknesyum-UI:
- `ui/roles/ui-builder.md` — frontmatter eklendi (`role: ui-builder`, `tier: ui-builder`).
  Gövdeye dokunulmadı.

### `tier` çıktısının biçimi

```
builder opus/medium
  cell     builder x eco = sonnet/low
  profile  eco (ceiling sonnet)
  risk     high
  signals  risk high
  ceiling  pierced
  reason   risk high raises the model to opus
  reason   risk high lifts the effort to medium
  reason   a signal raised builder, and a signal-raised role is exempt from the ceiling
```

Hangi hücre, hangi sinyal, tavan delindi mi — hepsi tek ekranda. Kota satırı yalnız
advisor'da çıkar; kota dolduysa çıkış kodu 2.

### Kabul

1. `tier --role builder --profile eco` -> `builder sonnet/low`. GEÇTİ
2. `... --risk high` -> `builder opus/medium`, `ceiling pierced`. GEÇTİ
3. `tier --role advisor --profile eco` -> `advisor opus/high`, muafiyet gerekçesiyle. GEÇTİ
4. `tier --role scribe --profile normal` -> `scribe haiku/low`. GEÇTİ
5. Eco'da üçüncü advisor açılışı geçiyor, dördüncü çıkış kodu 2 ile bloklanıyor. GEÇTİ
6. `test/all.js`: 24 hücrenin tamamı, dört sinyal, tavan-delme, kota, taban altına inmeme
   (8 satır x 3 profil x 3 model x 3 efor x 3 risk x 3 round). Enjeksiyon testi bozulmadı. GEÇTİ
7. `node test/all.js` -> 2163 passed, 0 failed. GEÇTİ

### Kapsam dışı notlar

- Sözleşmede `owns:` ve `verify:` alanı yok; İş bölümündeki yedi dosya owns kabul edildi.
  `_sorun.log`'a yazıldı.
- `Teknesyum-Core/Teknesyum-Base/` altında eski bir kopya duruyor; dokunulmadı.
- Commit ve push atılmadı.
