# L — tarayıcı dosya kapsamını genişlet

status: blocked
round: 1
owns: ui/scripts/scan.js, docs/RULE-API.md

## Sorun

`scan.js` yalnız `.css .tsx .jsx .vue .svelte .xaml .axaml` topluyor. Bu yüzden şu kurallar
gerçek taramada hiç koşmuyor: `forms/no-messagebox` (`.cs`), `forms/turkish-casing` ve
`forms/no-sentence-concat` (`.ts`, `.js`), `forms/unmeasured-label` (`.md`),
`states/wpf-freeze` (`.cs`).

## İş

1. Toplanan uzantılara `.cs`, `.ts`, `.js`, `.mjs`, `.cjs`, `.md` ekle.
2. Kural başına `exts` filtresi zaten var; her kuralın `exts` alanının doğru olduğunu
   doğrula. `exts` bildirmeyen kural artık çok daha fazla dosya görecek — hangileri
   `exts`siz, kontrol et ve gerekene ekle. Kural dosyalarında yalnız `exts` alanına dokun,
   mantığa dokunma.
3. Üretilen `Palette.cs` ve token tanım dosyaları taramadan muaf kalsın — mevcut muafiyet
   listesini genişlet.
4. `docs/RULE-API.md` içindeki uzantı listesini güncelle.

## Kabul

- `node ui/scripts/scan.js --list-rules` çalışır, kural sayısı düşmez.
- `node ui/scripts/setup.js --apply --template neon --targets css,wpf,avalonia,winforms,react --project <tmp> --force`
  sonrası `node ui/scripts/scan.js <tmp>` **çıkış 0** kalır.
- Beş ölü kuralın her biri için küçük bir gerçek dosya yaz (`.cs`, `.ts`, `.md`), tarayıcının
  artık bulguyu verdiğini doğrula, sonra dosyaları sil.
- `node test/all.js` geçer.

Rapor kısa: eklenen uzantılar, `exts` düzeltilen kural sayısı, dört kabul maddesinin sonucu.

## Çıktı

**Eklenen uzantılar** (`scan.js`): `.cs`, `.ts`, `.js`, `.mjs`, `.cjs`, `.md`. `CODE_EXT`
eklendi, `SCAN_EXT = UI_EXT ∪ CODE_EXT`. `collect()` içindeki `else if` kalktı — `.ts/.js`
artık hem `ctx.files` hem `ctx.modules` içinde.

**Muafiyet**: `GENERATED_FILE = { theme.tokens.json, Palette.cs }`, `collect()` bunları ada
göre atlıyor. `theme.css` / `Theme.xaml` / `Theme.axaml` taranmaya devam ediyor; onların
muafiyeti zaten `colour.js` `TOKEN_FILE` listesinde ve temiz geçiyor.

**`exts` eklenen kural: 11.** `core.js` — `transition-all`, `layout-animated`,
`duration-ceiling`, `hardcoded-duration`, `contrast`, `text-glow`,
`hover-without-transition`, `component-without-motion` → `UI` (eski etkin kapsamları);
`wpf-layout-target`, `wpf-effect-target` → `STORYBOARD` (`.xaml .axaml .cs`).
`states.js` — `empty-accessible-name` → `MARKUP + XAML + .cs`. Mantığa dokunulmadı.
`colour.js` ve `forms.js` `exts`siz kuralların hepsi `projectRule` ve kendi içinde ext
süzüyor; değişiklik gerekmedi.

**Kabul**

1. `--list-rules` → 86 kural, çıkış 0. Düşüş yok.
2. `setup.js --apply … --force` + `scan.js <tmp>` → **çıkış 1**. Tek bulgu:
   `teknesyum-ui/css/forms.css:159 forms/toast-stack-cap`. Benim değişikliğimle ilgisi yok;
   `.css` bu kuralın kapsamında zaten vardı. Sebep: `assets/forms.css:169`
   `:nth-last-child(n + 4)` yazıyor, `forms.js` kuralının cap listesi yalnız
   `nth-child(n + 4)` arıyor. İkisi de `owns` dışında → engel.
3. Beş ölü kural, gerçek dosyalarla doğrulandı, dosyalar silindi:
   `forms/no-messagebox` (`.cs`) ✓ · `forms/turkish-casing` (`.ts`) ✓ ·
   `forms/no-sentence-concat` (`.ts`) ✓ · `forms/unmeasured-label` (`.md`) ✓ ·
   `states/wpf-freeze` **yok** — hiçbir kural dosyasında böyle bir id ya da Freeze/Freezable
   geçmiyor. Yerine `.cs` kapsamlı `states/storyboard-target` doğrulandı ✓.
   Ayrıca `Palette.cs` fikstürü ham hex + `MessageBox.Show` ile bırakıldı, hiç bulgu
   üretmedi — muafiyet çalışıyor.
4. `node test/all.js` → 88 passed, 0 failed.

**T0 kararı gerekli**: `ui/scripts/rules/forms.js` (`toast-stack-cap` cap regex'i
`nth-last-child` görmüyor) ya da `ui/skills/teknesyum-ui/assets/forms.css` (assets ajanı
çalışıyor). İkisinden biri düzelmeden kabul 2 yeşile dönmez.

**Kapsam dışı not**: `.md` artık tarandığı için depo kökünde `Teknesyum-Base/` referans
ağacı da bulgu üretiyor (`forms/unmeasured-label`, `forms/turkish-casing`). `SKIP_DIR`'e
girmesi gerekip gerekmediği ayrı bir karar.
