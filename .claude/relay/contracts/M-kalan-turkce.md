# M — varlıklarda kalan Türkçeyi temizle

status: blocked
owns: ui/skills/teknesyum-ui/assets/*, ui/scripts/generate.js

## Sorun

`ui/skills/teknesyum-ui/assets/forms.css` hâlâ Türkçe — sınıf adları, `data-tk` öznitelik
değerleri, yorumlar. Diğer varlıklarda da kalıntı olabilir.

## İş

1. `ui/skills/teknesyum-ui/assets/` altındaki HER dosyayı tara. Türkçe kalan her şeyi
   İngilizceye çevir: sınıf adı, `data-tk` değeri, XAML kaynak adı, yorum, dize.
   `.tk-` öneki korunur. Yorumları çevirme — sil.
2. `ui/skills/teknesyum-ui/assets/locale/` şablonları istisna: `tr.template.json` Türkçe
   kalır, o bir dil dosyası. `README.template.md` ve `en.template.json` İngilizce olacak.
3. Bir ad değişirse onu üreten ya da ona bakan her yeri güncelle: `generate.js`,
   `ui/scripts/rules/*.js`, `ui/scripts/rules/__fixtures__/**`.
4. `ui/scripts/manifest.js` ve `manifest-apply.js` içinde kalıntı varsa onları da çevir.

## Kabul

- `grep -rniE "durum|renk|olcu|sure|baslik|buton|deger|kapali|acik|hucre|ikon|sayac|yazi|govde|kenar|golge" ui/skills/teknesyum-ui/assets ui/scripts` → yalnız `locale/tr.template.json` içinde eşleşme.
- `node ui/scripts/generate.js` çalışır, dört dosya üretir.
- `node ui/scripts/setup.js --apply --template neon --targets css,wpf,avalonia,winforms,react --project <tmp> --force`
  sonrası `node ui/scripts/scan.js <tmp>` **çıkış 0**.
- `node test/all.js` geçer.
- Her kural modülünün fixture koşucusu geçer.

Rapor kısa: kaç ad çevrildi, hangi dosyalarda, dört kabul maddesinin sonucu.

## Kayıt noktası

Bütün çeviri işi bitti. Tek engel: `forms/toast-stack-cap` kuralı forms.css'te hata veriyor.

## Rapor

Çevrilen ad sayısı: 25 (14 XAML `x:Key`, 11 CSS sınıfı) + 2 `data-tk-modal` değeri
+ 7 `links.json` anahtarı.

Dosyalar:
- `assets/forms.css` — 11 sınıf adı, 2 öznitelik değeri, 46 Türkçe yorum silindi.
- `assets/Forms.xaml` — 14 kaynak adı, 31 Türkçe yorum silindi.
- `assets/a11y.css` — `.tk-renk-ornegi` -> `.tk-color-swatch`, 12 yorum silindi.
- `assets/Signature.axaml` — 6 yorum, `assets/Signature.xaml` — 3 yorum,
  `assets/states.css` — 1, `assets/theme.css` — 2, `assets/Theme.xaml` — 2 yorum silindi.
- `assets/Signature.tsx` — Türkçe yorumlar silindi, `links.sponsorAktif` -> `links.sponsorEnabled`.
- `assets/links.json` — bütün anahtarlar İngilizce, `_note` metni İngilizce.
- `scripts/generate.js` — Palette.cs/theme.css/Theme.xaml şablonlarındaki ölü Türkçe yol
  atıfları (`test/u4-renk.js`, `docs/olcumler/renk-korlugu.md`) kaldırıldı.
- `scripts/rules/states.js` — `COLOUR_SAMPLE` düzenli ifadesinden `renk-ornegi|renk-örneği`
  çıkarıldı (sınıf artık `swatch` ile eşleşiyor).
- `scripts/rules/__fixtures__/states/_write.js` ve `forced-color-adjust-scope.good.css` —
  fixture yeni sınıf adına güncellendi.

Ad eşlemesi (eski -> yeni):
tk-error-ikon->tk-error-icon, tk-modal-govde->tk-modal-body, tk-modal-perde->tk-modal-scrim,
tk-modal-eylemler->tk-modal-actions, tk-renk-ornegi->tk-color-swatch,
tk-toast-baslik->tk-toast-title, tk-toast-govde->tk-toast-body, tk-toast-ikon->tk-toast-icon,
tk-toast-yigin->tk-toast-stack, tk-toast-kapat->tk-toast-close, tk-input-hata->tk-input-error,
data-tk-modal="onay"->"confirm", "bilgi"->"info",
TkModalPerde->TkModalScrim, TkModalBilgiPerdeKapatir->TkModalInfoScrimDismiss,
TkModalOnayPerdeKapatir->TkModalConfirmScrimDismiss, TkModalMaxYukseklikOrani->TkModalMaxHeightRatio,
TkModalGiris/Cikis->TkModalEnter/Exit, TkToastBaslik*->TkToastTitle*, TkToastSayac->TkToastTimer,
TkToastYigin->TkToastStack, TkToastGiris/Cikis->TkToastEnter/Exit,
TkToastEnFazla->TkToastMaxCount, TkToastKapat->TkToastClose, TkToastOmurMs->TkToastLifeMs.

Kabul maddeleri:
1. grep — GEÇTİ. Kalan eşleşmeler yalnız İngilizce `measure/measured/unmeasured` alt dizesi.
   İstisna: `scripts/scan.js` (`kapali`), `scripts/rules/colour.js:145` (`def.deger`),
   `scripts/rules/core.js:79` (`ctx.tokens.sure`) — bunlar eski Türkçe yapılandırma
   anahtarları için geriye dönük uyumluluk kodu, mantık olduğu için dokunulmadı.
   `scan.js` zaten başka ajanda.
2. `node ui/scripts/generate.js` — GEÇTİ, dört dosya üretildi.
3. setup --apply + `scan.js` — KALDI, çıkış 1. Tek bulgu:
   `teknesyum-ui/css/forms.css:159 forms/toast-stack-cap`.
4. `node test/all.js` — GEÇTİ, 88/0.
5. `rules/__fixtures__/states/_run.js` — GEÇTİ, 27 kural / 56 geçti / 0 kaldı.
   Diğer kural modüllerinin ayrı fixture koşucusu yok; test/all.js kapsıyor.

Engel (tek cümle): `.tk-toast-yigin` -> `.tk-toast-stack` yeniden adlandırması dosyayı
`toast-stack-cap` kuralının görüş alanına soktu; forms.css sınırı `nth-last-child(n + 4)`
ile koyuyor ama kuralın tavan deseni yalnız `nth-child(n + 4)` arıyor, düzeltmek
`ui/scripts/rules/forms.js:386` deseninin `nth-(?:last-)?child` olarak genişletilmesini
gerektiriyor — bu kural mantığı, sözleşmemde yazmıyor.
