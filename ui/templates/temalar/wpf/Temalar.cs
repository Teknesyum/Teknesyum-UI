// teknesyum-ui template temalar/wpf/Temalar.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace {{AD}}.Kabuk
{
    public static class Temalar
    {
        static readonly string Yol = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "{{AD}}", "tema.json");

        static IReadOnlyList<Tema>? liste;
        static readonly Dictionary<string, object?> yazilan = new();

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
            var kaynak = app.Resources;

            foreach (var (ad, ilk) in yazilan)
            {
                if (ilk is null) kaynak.Remove(ad);
                else kaynak[ad] = ilk;
            }
            yazilan.Clear();

            if (tema.Id != Liste[0].Id)
            {
                var kendi = new HashSet<object>(kaynak.Keys.Cast<object>());
                foreach (var (ad, renk) in TemaHesap.Kaynaklar(tema))
                {
                    var yeni = Yeni(app.TryFindResource(ad), renk);
                    if (yeni is null) continue;
                    yazilan[ad] = kendi.Contains(ad) ? kaynak[ad] : null;
                    kaynak[ad] = yeni;
                }
            }

            Secili = tema.Id;
            if (kaydet) Kaydet(tema.Id);
            Degisti?.Invoke(tema);
            return tema;
        }

        static object? Yeni(object? eski, TemaRengi renk)
        {
            switch (eski)
            {
                case Brush:
                    var firca = new SolidColorBrush(Color.FromArgb(renk.Alfa, renk.R, renk.G, renk.B));
                    firca.Freeze();
                    return firca;
                case DropShadowEffect golge:
                    var kopya = golge.Clone();
                    kopya.Color = Color.FromRgb(renk.R, renk.G, renk.B);
                    kopya.Freeze();
                    return kopya;
                default:
                    return null;
            }
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
