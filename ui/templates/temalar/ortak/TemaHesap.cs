// teknesyum-ui template temalar/ortak/TemaHesap.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace {{AD}}.Kabuk
{
    public readonly record struct TemaRengi(byte R, byte G, byte B, double A = 1)
    {
        public byte Alfa => (byte)Math.Round(A * 255);

        public TemaRengi Saydam(double a) => this with { A = a };

        public static TemaRengi Hex(string hex)
        {
            var n = Convert.ToInt32(hex.TrimStart('#').Substring(0, 6), 16);
            return new TemaRengi((byte)(n >> 16), (byte)(n >> 8), (byte)n);
        }
    }

    public sealed class Tema
    {
        public Tema(string id, string ad, IReadOnlyDictionary<string, string> renk)
        {
            Id = id;
            Ad = ad;
            Renk = renk;
        }

        public string Id { get; }
        public string Ad { get; }
        public IReadOnlyDictionary<string, string> Renk { get; }

        public TemaRengi Al(string ad) => TemaRengi.Hex(Renk[ad]);

        public TemaRengi Al(string ad, string yedek) => TemaRengi.Hex(Renk.TryGetValue(ad, out var v) ? v : Renk[yedek]);
    }

    public static class TemaHesap
    {
        public const double EnAzOran = 4.5;
        public const string Zemin = "AppBackground";
        public const string Parilti = "HeroGlow";
        const int Adim = 24;
        static readonly int[] Tonlar = { 10, 20, 30, 50, 60 };
        static readonly TemaRengi Koyu = new(0, 0, 0);
        static readonly TemaRengi Acik = new(255, 255, 255);

        public static IReadOnlyList<Tema> Oku(string json)
        {
            var liste = new List<Tema>();
            using var belge = JsonDocument.Parse(json);
            foreach (var o in belge.RootElement.EnumerateArray())
            {
                var renk = new Dictionary<string, string>();
                foreach (var p in o.EnumerateObject())
                    if (p.Value.ValueKind == JsonValueKind.String)
                        renk[p.Name] = p.Value.GetString() ?? "";
                liste.Add(new Tema(renk["id"], renk["ad"], renk));
            }
            return liste;
        }

        public static IReadOnlyList<Tema> Yukle()
        {
            var derleme = typeof(TemaHesap).Assembly;
            var ad = derleme.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith("themes.json", StringComparison.OrdinalIgnoreCase));
            if (ad is null) return Array.Empty<Tema>();
            using var akis = derleme.GetManifestResourceStream(ad);
            if (akis is null) return Array.Empty<Tema>();
            using var okur = new StreamReader(akis);
            return Oku(okur.ReadToEnd());
        }

        static double Isik(TemaRengi c)
        {
            static double F(byte v)
            {
                var s = v / 255.0;
                return s <= 0.03928 ? s / 12.92 : Math.Pow((s + 0.055) / 1.055, 2.4);
            }
            return 0.2126 * F(c.R) + 0.7152 * F(c.G) + 0.0722 * F(c.B);
        }

        public static double Oran(TemaRengi a, TemaRengi b)
        {
            var x = Isik(a);
            var y = Isik(b);
            return (Math.Max(x, y) + 0.05) / (Math.Min(x, y) + 0.05);
        }

        static TemaRengi Kar(TemaRengi a, TemaRengi b, double pay)
        {
            byte F(byte x, byte y) => (byte)Math.Floor(x * pay + y * (1 - pay) + 0.5);
            return new TemaRengi(F(a.R, b.R), F(a.G, b.G), F(a.B, b.B));
        }

        static TemaRengi Ustu(TemaRengi c)
        {
            var l = Isik(c);
            return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? Koyu : Acik;
        }

        public static TemaRengi Okunur(TemaRengi c, Tema t)
        {
            var metin = t.Al("text");
            var zeminler = new[] { t.Al("black"), t.Al("surface") };
            for (var i = 0; i < Adim; i++)
            {
                if (zeminler.All(z => Oran(c, z) >= EnAzOran)) break;
                c = Kar(c, metin, 0.85);
            }
            return c;
        }

        public static bool AcikMi(Tema t) => Isik(t.Al("black")) > 0.5;

        public static IReadOnlyDictionary<string, TemaRengi> Kaynaklar(Tema t)
        {
            var renk1 = t.Al("renk-1");
            var metin = t.Al("text");
            var siyah = t.Al("black");
            var uyari = t.Al("warning");
            var renk2Metin = Okunur(t.Al("renk-2-text"), t);
            var renk3Metin = Okunur(t.Al("renk-3-text"), t);
            var tehlikeMetin = Okunur(t.Al("danger", "renk-2-text"), t);
            var etiket = Okunur(renk1, t);
            var soluk = Okunur(Kar(metin, siyah, 0.65), t);
            var k = new Dictionary<string, TemaRengi>
            {
                ["Renk1"] = renk1,
                ["Renk2"] = t.Al("renk-2"),
                ["Renk3"] = t.Al("renk-3"),
                ["Renk2Text"] = renk2Metin,
                ["Renk3Text"] = renk3Metin,
                ["Renk2Text50"] = renk2Metin.Saydam(0.5),
                ["Renk3Text50"] = renk3Metin.Saydam(0.5),
                ["Success"] = t.Al("success"),
                ["Surface"] = t.Al("surface"),
                ["AppBg"] = siyah,
                [Zemin] = siyah,
                [Parilti] = renk1,
                ["TkModalScrim"] = siyah.Saydam(0.6),
                ["WindowEdge"] = renk1.Saydam(0.7),
                ["ScrollbarThumb"] = t.Al("renk-3-text"),
                ["ScrollbarThumbHover"] = t.Al("renk-2-text"),
                ["ScrollbarTrack"] = metin.Saydam(0.12),
                ["Danger"] = t.Al("danger", "renk-2"),
                ["DangerText"] = tehlikeMetin,
                ["Warning"] = uyari,
                ["Warning50"] = uyari.Saydam(0.5),
                ["TextBody"] = metin,
                ["TextLabel"] = etiket,
                ["TextMuted"] = soluk,
                ["Disabled"] = t.Al("disabled"),
                ["OnRenk1"] = Ustu(renk1),
                ["OnSuccess"] = Ustu(t.Al("success")),
                ["OnDangerText"] = Ustu(tehlikeMetin),
                ["OnPanel"] = metin,
                ["OnGlass"] = metin,
                ["BorderDefault"] = renk1.Saydam(0.55),
                ["BorderStrong"] = renk1.Saydam(0.7),
                ["BorderDecorative"] = renk1.Saydam(0.2),
                ["LabelBrandBrush"] = etiket,
                ["LabelSupportBrush"] = renk3Metin,
                ["LabelUpdateBrush"] = metin,
                ["LabelVersionBrush"] = soluk,
                ["LabelSyncBrush"] = metin,
                ["LabelTitleBrush"] = metin,
                ["LabelTitleAccentBrush"] = renk2Metin,
            };
            for (var n = 1; n <= 3; n++)
                foreach (var s in Tonlar)
                {
                    k["Renk" + n + "x" + s] = t.Al("renk-" + n).Saydam(s / 100.0);
                    k["OnRenk" + n + "x" + s] = metin;
                }
            return k;
        }
    }
}
