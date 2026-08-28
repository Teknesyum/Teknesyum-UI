# R — ajan dilini İngilizceye çevir

status: submitted
repo: C:/Users/Administrator/Desktop/Projeler/Teknesyum-Core

Commit atma, push etme.

## Karar

**T0 hariç tüm ajan iletişimi İngilizce.** Türkçe kalan tek kanal: T0 → kullanıcı.

| Metin türü | Dil | Değişiyor mu |
|---|---|---|
| Sözleşme frontmatter, `owns:`, `verify:` | İngilizce | hayır |
| Sözleşme gövdesi (Goal, Acceptance, İş) | **İngilizce** | **evet** |
| Ajan promptu | İngilizce | hayır |
| Ajan raporu, checkpoint | **İngilizce** | **evet** |
| `_sorun.log` | **İngilizce** | **evet** |
| `map.md`, `live/`, `tiers.json` | İngilizce | hayır |
| T0 → kullanıcı sohbeti ve sözleşme özeti | **Türkçe** | hayır |

## Zorunlu şart — onay sadakati

Kullanıcı artık sözleşmenin kendisini değil T0'ın Türkçe özetini onaylıyor. Özet bir kabul
kriterini atlarsa kullanıcı farkında olmadan başka bir şeye onay vermiş olur.

**Kural: T0'ın Türkçe özeti, sözleşmenin Acceptance maddelerini bire bir, kısaltmadan
listeler.** Goal ve İş bölümleri özetlenebilir; Acceptance özetlenemez.

## Şart — `_sorun.log` biçimi

Satırlar kısa ve şablonlu kalacak: `<contract> | <role> | <what was sought> | <what was
missing> | <what was done>`. Edebiyat yok. Kullanıcı bu dosyayı T0 olmadan da açıyor.

## İş

- `core/skills/relay/SKILL.md`: dil kuralı **en fazla 3 satır**. Dosya 150 satırı geçmeyecek.
  Sözleşme şablonu ve rol dosyaları zaten İngilizce — değişen şey T0'ın yazma alışkanlığı.
- `core/roles/*.md`: rapor ve checkpoint dilinin İngilizce olduğu her rol dosyasında tek
  cümleyle geçsin — ya da tek yerde toplanabiliyorsa SKILL.md'de kalsın, rol dosyalarını
  şişirme. Hangisini seçtiğini raporunda söyle.
- `docs/DECISIONS.md`: yeni karar `D9 — Agent language`. İçinde: karar, bedel hesabı
  (gövde ~2.500→~1.700 çıktı token, çıktı 5× fiyat, ~4k girdi-eşdeğeri kazanç/sözleşme;
  rapor ~%40 küçük ve T0 bağlamında kalıcı), onay sadakati şartı, ve "rakamlar ölçülmemiş
  tahmin, ilk gerçek relay'de doğrulanacak" notu.
- `core/scripts/contract.js`: sözleşme iskeleti üreten yer varsa başlıkları İngilizceye
  çevir. Yoksa dokunma.
- `test/all.js`: SKILL.md'nin dil kuralını taşıdığını ve 150 satırı geçmediğini iddia et.
  Acceptance-bire-bir kuralının SKILL.md'de yazılı olduğunu iddia et.

## Kabul

- `node test/all.js` geçer, enjeksiyon testi bozulmadan.
- `SKILL.md` 150 satırın altında ve dil kuralı 3 satırı geçmiyor.
- `docs/DECISIONS.md` içinde D9 var.
- Rol dosyalarının toplam satır sayısı bu iş yüzünden %10'dan fazla büyümedi.

Rapor kısa: değişen dosyalar, dil kuralını nereye koyduğun, dört kabul maddesinin sonucu.

## Rapor

Değişen dosyalar (hepsi Teknesyum-Core):
- `core/skills/relay/SKILL.md` — yeni `## Language` bölümü. 141 satır.
- `core/roles/*.md` (6 dosya) — sonlarına tek satır.
- `docs/DECISIONS.md` — `## D9 — Agent language`.
- `test/all.js` — 9 yeni iddia.
- `core/scripts/contract.js` — dokunulmadı; sözleşme iskeleti üreten yer yok, başlıklar
  yalnız hata metinlerinde geçiyor ve zaten İngilizce.

Dil kuralını nereye koydum: ikisi de. Kural metni SKILL.md'de (3 satır, T0'ı bağlar);
rol dosyalarına yalnız tek satırlık hatırlatma girdi ("Reports, checkpoints and
`_sorun.log` lines are English."), çünkü ajanlar SKILL.md'yi açmıyor, rol dosyasını
okuyor. `_sorun.log` şablonu SKILL.md'de ayrı bir satır ve D9 içinde.

Kabul:
1. `node test/all.js` — 2197 geçti, 0 kaldı. Enjeksiyon testleri dahil bozulmadı.
2. SKILL.md 141 satır (<150); dil kuralı paragrafı 3 satır, test bunu ölçüyor.
3. `docs/DECISIONS.md:274` — D9 var; karar, bedel hesabı, onay sadakati şartı,
   `_sorun.log` biçimi ve "ölçülmemiş tahmin" notu içinde.
4. Rol dosyaları toplamı 213 → 225 satır, %5,6 büyüme (<%10).

Kapsam dışı not: Core deposunda `_sorun.log` yazan/okuyan bir mekanizma yok — kavram
yalnız eski Teknesyum-Base deposunda geçiyor. Şablonu doktrine yazdım, mekanizma kurmadım.
