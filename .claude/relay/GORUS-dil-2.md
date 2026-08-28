# Dil sorusu — ikinci tur

Az önce "ajanlar arası metni İngilizceye çevirme" dedin. Gerekçen iki kalemliydi:
kazanç relay başına %1-3, kayıp ise kullanıcının kendi iş akışını okuyamaması.

Kullanıcı **ikinci kalemi ortadan kaldıran** bir öneri getirdi. Cevabını bu yeni
bilgiyle revize et — eski cevabını savunman gerekmiyor, doğruysa değiştir.

## Kullanıcının önerisi

- T0 hariç **tüm ajan iletişimi İngilizce**: sözleşme gövdesi de İngilizce verilir,
  ajandan dönen rapor da İngilizce döner, kayıt noktası ve `_sorun.log` da İngilizce.
- **T0 kullanıcıya Türkçe sunar.** Sözleşmenin önemli kısımlarını T0 çevirir.
- Kullanıcının kendi sözleri: "ben zaten İngilizcede çok kötü değilim, anlamadığım
  yeri de sorarım."

Yani senin "kullanıcı kendi akışını okuyamaz" itirazın büyük ölçüde düşüyor:
kullanıcı İngilizce okuyabiliyor ve zaten T0'dan Türkçe özet alıyor.

## Cevaplaman gereken — sırayla

1. **İkinci kalem düştüğüne göre karar değişiyor mu?** %1-3'lük kazanç, kaybı sıfıra
   inince yeterli bir gerekçe mi? "Küçük ama bedava" mı, yoksa "küçük ve hâlâ riskli" mi?

2. **Yeni maliyet kalemi: T0'ın çeviri yükü.** Bugün T0 sözleşmeyi Türkçe yazıyor ve
   kullanıcıya Türkçe konuşuyor — tek üretim. Önerilen düzende T0 sözleşmeyi İngilizce
   yazıyor **ve ayrıca** kullanıcıya Türkçe özet üretiyor — iki üretim. Çıktı tokenı
   girdinin ~5 katı fiyatta. Bu kalem, kazanılan %1-3'ü yer mi, yoksa özet zaten
   yazılacak olduğu için sıfır mı? Kabaca hesapla, hesabını göster.

3. **Ajan raporları İngilizce dönerse T0 ne yapar?** Rapor T0'ın bağlamına İngilizce
   girer (ucuz), ama kullanıcıya Türkçe çıkar (pahalı). Bugün rapor Türkçe girip Türkçe
   çıkıyor. Net etki artı mı eksi mi?

4. **Kayıp kanal var mı?** `_sorun.log` ve kayıt noktaları kullanıcının doğrudan açıp
   okuduğu dosyalar — T0 aracılığı olmadan. Bunlar İngilizceye geçerse kullanıcı ile
   sistem arasında T0'sız bir kanal kalmıyor. Bu bir sorun mu, yoksa T0 zaten her zaman
   arada mı?

5. **Kesme yeri.** Karar "hepsi İngilizce" ya da "hiçbiri" olmak zorunda değil. Yeni
   bilgiyle metin türü × dil tablonu yeniden kur. Değişen satırları işaretle.

## Çıktı

`## 1` … `## 5` başlıkları, her biri kısa. Sonda **Karar** (tek cümle) ve
**Nerede yanılabilirim**. Prose duvarı yok, hesabı rakamla göster.

Kendi çıkarına göre değil kullanıcının işine göre cevap ver.
