// teknesyum-ui template temalar/avalonia/Temalar.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Avalonia;
using Avalonia.Media;
using Avalonia.Styling;

namespace {{AD}}.Kabuk
{
    public static class Temalar
    {
        static readonly string Yol = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "{{AD}}", "tema.json");

        static IReadOnlyList<Tema>? liste;
        static readonly Dictionary<string, Color> ilkRenk = new();
        static readonly Dictionary<string, Color[]> ilkGecis = new();
        static ThemeVariant? ilkGorunum;
        static bool ilkAlindi;

        public static event Action<Tema>? Degisti;

        public static IReadOnlyList<Tema> Liste
        {
            get => liste ??= TemaHesap.Yukle();
            set => liste = value;
        }

        public static string Secili { get; private set; } = "";

        public static Tema? Bul(string? id) => Liste.FirstOrDefault(t => t.Id == id) ?? Liste.FirstOrDefault();

        public static Tema? Baslat() => Uygula(Kayitli(), false);

        public static Tema? Uygula(string? id, bool kaydet = true)
        {
            var app = Application.Current;
            var tema = Bul(id);
            if (app is null || tema is null) return null;
            var standart = tema.Id == Liste[0].Id;
            var hedef = TemaHesap.Kaynaklar(tema);

            if (!ilkAlindi)
            {
                ilkGorunum = app.RequestedThemeVariant;
                ilkAlindi = true;
            }

            foreach (var (ad, renk) in hedef)
            {
                if (!app.TryGetResource(ad, app.ActualThemeVariant, out var kaynak)) continue;
                var c = Color.FromArgb(renk.Alfa, renk.R, renk.G, renk.B);
                switch (kaynak)
                {
                    case SolidColorBrush firca:
                        ilkRenk.TryAdd(ad, firca.Color);
                        firca.Color = standart ? ilkRenk[ad] : c;
                        break;
                    case GradientBrush gecis:
                        if (!ilkGecis.ContainsKey(ad)) ilkGecis[ad] = gecis.GradientStops.Select(d => d.Color).ToArray();
                        for (var i = 0; i < gecis.GradientStops.Count && i < ilkGecis[ad].Length; i++)
                            gecis.GradientStops[i].Color = standart ? ilkGecis[ad][i] : c;
                        break;
                    case DropShadowEffect golge:
                        ilkRenk.TryAdd(ad, golge.Color);
                        golge.Color = standart ? ilkRenk[ad] : c;
                        break;
                }
            }

            app.RequestedThemeVariant = standart ? ilkGorunum : TemaHesap.AcikMi(tema) ? ThemeVariant.Light : ThemeVariant.Dark;
            Secili = tema.Id;
            if (kaydet) Kaydet(tema.Id);
            Degisti?.Invoke(tema);
            return tema;
        }

        public static string? Kayitli()
        {
            try
            {
                if (!File.Exists(Yol)) return null;
                using var belge = JsonDocument.Parse(File.ReadAllText(Yol));
                return belge.RootElement.TryGetProperty("tema", out var v) ? v.GetString() : null;
            }
            catch { return null; }
        }

        static void Kaydet(string id)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Yol)!);
                File.WriteAllText(Yol, JsonSerializer.Serialize(new { tema = id }));
            }
            catch { }
        }
    }
}
