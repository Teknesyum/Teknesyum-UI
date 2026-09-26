# Danışma 004: Danışma 003 Girdisi: On Tema Tasarımı

claude-fable-5-1, 15.870 çıktı token, 267 sn. Girdi: [004-fable-on-tema-girdi.md](004-fable-on-tema-girdi.md). Cevap olduğu gibi:

---

## Danışma 004 Cevabı: On Tema

Ölçüm yöntemi: her aday `ui/scripts/tema.js` `denetle` ile geçirildi (generate.js 7:1 kapısı + `skor.js`). Deneme betiği ve girdi: scratchpad `temalar-dene.js`, `temalar.json`. Tümü 7:1 kapısını geçti, tümü ≥85.

### Koyu Temalar

| Ad | Başlık | Esin | Skor | text | blue | pink-text | purple-text | success | warning | on-blue |
|---|---|---|---|---|---|---|---|---|---|---|
| gece | Gece Mavisi | Primer Dark + Tokyo Night'ın mavimsi lacivert zemini | 86.4 | 16.02 | 8.55 | 11.11 | 11.22 | 11.05 | 12.19 | 9.04 |
| grafit | Grafit | VS Code Dark Modern + Fluent 2 Dark'ın nötr grisi | 85.6 | 15.09 | 8.88 | 10.76 | 11.18 | 10.75 | 11.48 | 9.66 |
| kadife | Kadife | Catppuccin Mocha + Rosé Pine'ın morumsu pasteli | 86.5 | 14.92 | 9.34 | 10.94 | 11.48 | 11.44 | 12.07 | 10.06 |
| karbon | Karbon | Linear + macOS Dark'ın siyaha yakın yüksek kontrastı | 91.8 | 20.27 | 10.46 | 13.78 | 13.97 | 13.99 | 14.07 | 10.84 |
| kor | Kor | Gruvbox Dark + Discord Dark'ın sıcak kahve-grisi | 86.2 | 15.52 | 8.95 | 10.91 | 11.90 | 11.02 | 11.64 | 9.67 |

### Açık Temalar

| Ad | Başlık | Esin | Skor | text | blue | pink-text | purple-text | success | warning | on-blue |
|---|---|---|---|---|---|---|---|---|---|---|
| kar | Kar Beyazı | Primer Light + Fluent 2 Light'ın saf beyazı | 86.3 | 17.79 | 9.88 | 9.21 | 10.75 | 9.11 | 9.73 | 9.88 |
| kirik | Kırık Beyaz | One Light + VS Code Light Modern'in yumuşak beyazı | 87.0 | 15.40 | 10.23 | 9.89 | 11.22 | 10.49 | 10.53 | 11.07 |
| kagit | Sıcak Kâğıt | Solarized Light + Gruvbox Light'ın krem kâğıdı | 87.1 | 14.81 | 10.30 | 10.23 | 11.12 | 10.48 | 10.68 | 10.93 |
| buz | Buz Grisi | Catppuccin Latte + JetBrains Islands Light'ın soğuk grisi | 87.3 | 14.94 | 10.74 | 10.20 | 11.21 | 10.42 | 10.73 | 11.83 |
| keskin | Keskin Beyaz | macOS/Fluent artırılmış kontrast: beyaz üstünde siyah | 87.4 | 21.00 | 9.58 | 10.49 | 11.90 | 9.99 | 10.19 | 9.58 |

Açık temada 7:1 kolay geçiliyor ama 85 puan için vurgular ≈10:1'e inmek zorunda kaldı (L* ≈ 25–30); ilk turda #1a45b8 gibi "piyasa mavisi" değerler 7–8:1 verip 75–81 puanda kaldı, o yüzden hepsi bir kademe koyulaştırıldı. Açık temalarda `black` = geçişin açık ucu (kar #f3f6fb, kirik/kagit #fff… ), dolgu üstü yazı otomatik olarak `text`e düşüyor.

### Neon Revizyonu

Var, küçük: **blue #5aa8ff → #66b0ff** ve **disabled #7c7f88 → #868993**. Gerekçe: blue Neon'un en düşük vurgusu (7.62:1, kapıya en yakın; başlık ve sekme yazısının taşıyıcısı), yeni değerle 8.28:1 / on-blue 8.64:1 ve ton hâlâ Primer'in #4493f8 ailesinde. Disabled 4.72 → 5.40, en zayıf panel Kurulum 75 → 77. Toplam skor 85.0 → 86.3. Öteki 10 renk yerinde kalır; pink/purple dolgu ve text kesimleri araştırmadaki mor/fuşya ikincil vurgu deseniyle zaten örtüşüyor.

### JSON

```json
[
{"ad":"gece","baslik":"Gece Mavisi","tur":"koyu","esin":"GitHub Primer Dark ve Tokyo Night'ın mavimsi lacivert zemini.","renk":{"blue":"#6cb4ff","pink":"#d63de6","pink-text":"#f3b1fb","purple":"#9b6cf5","purple-text":"#d7bdff","surface":"#0d1220","black":"#070a14","glass-base":"#111827","text":"#e8eef8","disabled":"#7f8798","success":"#56e08a","warning":"#ffc94a"}},
{"ad":"grafit","baslik":"Grafit","tur":"koyu","esin":"VS Code Dark Modern ve Fluent 2 Dark'ın nötr, ılık gri zemini.","renk":{"blue":"#82bfff","pink":"#d848e6","pink-text":"#f5b8fc","purple":"#a883f3","purple-text":"#dcc7ff","surface":"#1b1b1d","black":"#121214","glass-base":"#202022","text":"#f0f0f0","disabled":"#858790","success":"#6fe39a","warning":"#ffcc55"}},
{"ad":"kadife","baslik":"Kadife","tur":"koyu","esin":"Catppuccin Mocha ve Rosé Pine'ın morumsu, yumuşak pastel karanlığı.","renk":{"blue":"#98c2ff","pink":"#d24bd8","pink-text":"#f6bcf8","purple":"#a67ef2","purple-text":"#dfcbff","surface":"#1b1a2c","black":"#14131f","glass-base":"#201f33","text":"#f1eefb","disabled":"#8b87a6","success":"#94e6a0","warning":"#f9d580"}},
{"ad":"karbon","baslik":"Karbon","tur":"koyu","esin":"Linear ve macOS Dark'ın siyaha yakın, yüksek kontrastlı zemini.","renk":{"blue":"#7cc0ff","pink":"#e04ff0","pink-text":"#f9c3ff","purple":"#ac7eff","purple-text":"#e1ceff","surface":"#050608","black":"#000000","glass-base":"#0b0c10","text":"#ffffff","disabled":"#8a8f9a","success":"#66f09a","warning":"#ffd24d"}},
{"ad":"kor","baslik":"Kor","tur":"koyu","esin":"Gruvbox Dark ve Discord Dark'ın sıcak, kahve-gri zemini.","renk":{"blue":"#8abeff","pink":"#d94ac9","pink-text":"#f8baf0","purple":"#ab82ef","purple-text":"#e1ceff","surface":"#1e1a18","black":"#151210","glass-base":"#241f1c","text":"#f8f2ea","disabled":"#8f867f","success":"#9be087","warning":"#ffcd62"}},
{"ad":"kar","baslik":"Kar Beyazı","tur":"acik","esin":"GitHub Primer Light ve Fluent 2 Light'ın saf beyaz zemini.","renk":{"blue":"#123a9e","pink":"#c026d3","pink-text":"#7a1685","purple":"#7c3aed","purple-text":"#521a97","surface":"#ffffff","black":"#f3f6fb","glass-base":"#f7f9fc","text":"#14181f","disabled":"#6b7280","success":"#14532d","warning":"#633b05"}},
{"ad":"kirik","baslik":"Kırık Beyaz","tur":"acik","esin":"One Light ve VS Code Light Modern'in hafif kirli, yumuşak beyazı.","renk":{"blue":"#0f3390","pink":"#bd2ccc","pink-text":"#6a1079","purple":"#7a3be6","purple-text":"#48128a","surface":"#f6f6f4","black":"#ffffff","glass-base":"#fbfbfa","text":"#1c1e24","disabled":"#61656d","success":"#0e4326","warning":"#553203"}},
{"ad":"kagit","baslik":"Sıcak Kâğıt","tur":"acik","esin":"Solarized Light ve Gruvbox Light'ın krem kâğıt sıcaklığı.","renk":{"blue":"#0d3388","pink":"#b83aa2","pink-text":"#64146c","purple":"#7443c9","purple-text":"#431984","surface":"#fbf3e2","black":"#fffaf0","glass-base":"#fdf7ea","text":"#241f18","disabled":"#675e52","success":"#0b4221","warning":"#503103"}},
{"ad":"buz","baslik":"Buz Grisi","tur":"acik","esin":"Catppuccin Latte ve JetBrains Islands Light'ın soğuk, mavimsi grisi.","renk":{"blue":"#0b2c82","pink":"#bd2fd0","pink-text":"#600f6d","purple":"#7638e8","purple-text":"#3f1283","surface":"#eceff4","black":"#f8fafc","glass-base":"#f1f4f8","text":"#171b25","disabled":"#5c6371","success":"#0b3f22","warning":"#4c2e00"}},
{"ad":"keskin","baslik":"Keskin Beyaz","tur":"acik","esin":"macOS ve Fluent'in artırılmış kontrast kipi: saf beyaz üstünde saf siyah.","renk":{"blue":"#0f3aa8","pink":"#a80fa8","pink-text":"#6e0f78","purple":"#5a1fc0","purple-text":"#46158f","surface":"#ffffff","black":"#ffffff","glass-base":"#fafafa","text":"#000000","disabled":"#6b7280","success":"#0b4d24","warning":"#5c3a00"}}
]
```

Kanıt dosyaları: `C:\Users\ADMINI~1\AppData\Local\Temp\claude\C--Users-Administrator-Desktop-Projeler-Teknesyum-UI\9e21b996-94b4-4304-9150-f9d9c4252969\scratchpad\temalar.json` (son girdi), `temalar-dene.js` (ölçüm betiği), `neon-rev.json` (Neon iki varyant).
