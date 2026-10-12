// teknesyum-ui template bildirim/ortak/Bildirim.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace {{AD}}.Kabuk
{
    public enum BildirimHatasi { Yok, Ag, Anahtar, Reddedildi, Sunucu }

    public sealed record BildirimGirdisi(
        string Uygulama, string Surum, string Platform, string Dil, string Not, string? Iletisim = null, byte[]? Goruntu = null);

    public sealed record BildirimSonucu(bool Tamam, int No, bool GoruntuEklenemedi, BildirimHatasi Hata);

    public static class Bildirim
    {
        public const int GoruntuEnCokBayt = 150 * 1024;
        public const int GoruntuEnCokKenar = 1600;
        public const int GoruntuEnAzKenar = 320;
        public static readonly int[] GoruntuKaliteleri = { 85, 70, 55, 40 };

        const string Adres = "https://api.github.com/repos/{{DEPO}}/issues";

        public static HttpMessageHandler? Isleyici { get; set; }

        public static string Baslik(string uygulama, string not)
        {
            var tek = Regex.Replace(not, @"\s+", " ").Trim();
            return uygulama + ": " + (tek.Length > 70 ? tek.Substring(0, 70) : tek);
        }

        public static string Govde(BildirimGirdisi g)
        {
            var satirlar = new List<string>
            {
                g.Not.Trim(),
                "",
                "- Sürüm: " + g.Surum,
                "- Platform: " + g.Platform,
                "- Dil: " + g.Dil,
            };
            var iletisim = (g.Iletisim ?? "").Trim();
            if (iletisim.Length > 0) satirlar.Add("- İletişim: " + iletisim);
            return string.Join("\n", satirlar);
        }

        public static string GoruntuYorumu(byte[] jpeg) => string.Join("\n",
            "<details><summary>Görüntü</summary>", "", "```teknesyum-goruntu image/jpeg", Convert.ToBase64String(jpeg), "```", "", "</details>");

        public static async Task<BildirimSonucu> Gonder(BildirimGirdisi g, CancellationToken iptal = default)
        {
            using var istemci = Isleyici is null ? new HttpClient() : new HttpClient(Isleyici, false);
            istemci.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", string.Concat(BildirimAnahtar.Parcalar));
            istemci.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
            istemci.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue(Regex.Replace(g.Uygulama, @"[^A-Za-z0-9._-]", "-"), g.Surum));

            int no;
            try
            {
                var istek = JsonSerializer.Serialize(new
                {
                    title = Baslik(g.Uygulama, g.Not),
                    body = Govde(g),
                    labels = new[] { "bildirim", "app:" + g.Uygulama.ToLowerInvariant() },
                });
                using var yanit = await istemci.PostAsync(Adres, Icerik(istek), iptal).ConfigureAwait(false);
                if (!yanit.IsSuccessStatusCode) return new BildirimSonucu(false, 0, false, Hata(yanit.StatusCode));
                using var belge = JsonDocument.Parse(await yanit.Content.ReadAsStringAsync().ConfigureAwait(false));
                no = belge.RootElement.GetProperty("number").GetInt32();
            }
            catch (OperationCanceledException) when (iptal.IsCancellationRequested) { throw; }
            catch (Exception e) when (e is HttpRequestException or OperationCanceledException or JsonException or KeyNotFoundException)
            {
                return new BildirimSonucu(false, 0, false, BildirimHatasi.Ag);
            }

            if (g.Goruntu is null) return new BildirimSonucu(true, no, false, BildirimHatasi.Yok);
            try
            {
                var yorum = JsonSerializer.Serialize(new { body = GoruntuYorumu(g.Goruntu) });
                using var yanit = await istemci.PostAsync(Adres + "/" + no + "/comments", Icerik(yorum), iptal).ConfigureAwait(false);
                return new BildirimSonucu(true, no, !yanit.IsSuccessStatusCode, BildirimHatasi.Yok);
            }
            catch (Exception e) when (e is HttpRequestException or OperationCanceledException)
            {
                return new BildirimSonucu(true, no, true, BildirimHatasi.Yok);
            }
        }

        static StringContent Icerik(string json) => new(json, Encoding.UTF8, "application/json");

        static BildirimHatasi Hata(HttpStatusCode kod) => (int)kod switch
        {
            401 => BildirimHatasi.Anahtar,
            403 or 404 or 422 or 429 => BildirimHatasi.Reddedildi,
            _ => BildirimHatasi.Sunucu,
        };
    }

    public sealed class BildirimMetinleri
    {
        public string Baslik { get; set; } = "Bize ulaşın";
        public string Not { get; set; } = "Notun";
        public string NotIpucu { get; set; } = "Ne oldu, ne bekliyordun?";
        public string Iletisim { get; set; } = "Sana nasıl ulaşalım?";
        public string IletisimIpucu { get; set; } = "İsteğe bağlı. Yazmazsan yanıt veremeyiz.";
        public string GoruntuEkle { get; set; } = "Görüntü ekle";
        public string GoruntuKaldir { get; set; } = "Görüntüyü kaldır";
        public string GoruntuHazir { get; set; } = "Eklenecek: {0}";
        public string GoruntuOlmadi { get; set; } = "Bu görüntü küçültülemedi, eklenmedi.";
        public string Gonder { get; set; } = "Gönder";
        public string YenidenDene { get; set; } = "Yeniden dene";
        public string Gonderiliyor { get; set; } = "Gönderiliyor…";
        public string NotGerekli { get; set; } = "Göndermek için önce notunu yaz.";
        public string Ulasti { get; set; } = "Bildirimin ulaştı, teşekkürler.";
        public string UlastiGoruntusuz { get; set; } = "Bildirimin ulaştı; görüntü eklenemedi.";
        public string HataAg { get; set; } = "Gönderilemedi: internet bağlantısı kurulamadı. Notun duruyor, yeniden deneyebilirsin.";
        public string HataAnahtar { get; set; } = "Gönderilemedi: bu sürümün bildirim anahtarı geçersiz. Uygulamayı güncelle, sonra yeniden dene.";
        public string HataReddedildi { get; set; } = "Gönderilemedi: GitHub isteği geri çevirdi. Notun duruyor, biraz sonra yeniden dene.";
        public string HataSunucu { get; set; } = "Gönderilemedi: GitHub şu an yanıt vermiyor. Notun duruyor, biraz sonra yeniden dene.";

        public string Hata(BildirimHatasi hata) => hata switch
        {
            BildirimHatasi.Ag => HataAg,
            BildirimHatasi.Anahtar => HataAnahtar,
            BildirimHatasi.Reddedildi => HataReddedildi,
            _ => HataSunucu,
        };
    }
}
