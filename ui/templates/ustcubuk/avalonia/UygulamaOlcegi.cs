// teknesyum-ui template ustcubuk/avalonia/UygulamaOlcegi.cs
#nullable enable
using System;
using System.IO;
using System.Text.Json;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;

namespace {{AD}}.Kabuk
{
    public static class UygulamaOlcegi
    {
        public const double Adim = 0.125;
        public const double En = 1.0;
        public const double Cok = 2.0;

        static readonly string Yol = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "{{AD}}", "olcek.json");

        static double deger = 1.0;
        static double ilk = 1.0;
        static bool kancali;

        public static double Deger => deger;
        public static event Action<double>? Degisti;

        public static double Varsayilan(double mantiksalYukseklik) =>
            mantiksalYukseklik >= 2000 ? 1.5 : mantiksalYukseklik >= 1300 ? 1.25 : 1.0;

        public static void Bagla(Window pencere)
        {
            if (pencere.Content is LayoutTransformControl) return;
            var ekran = pencere.Screens.ScreenFromWindow(pencere) ?? pencere.Screens.Primary;
            var yukseklik = ekran is null ? 0 : ekran.Bounds.Height / ekran.Scaling;
            ilk = Varsayilan(yukseklik);
            deger = Oku() ?? ilk;
            var ic = pencere.Content as Control;
            pencere.Content = null;
            var sarmal = new LayoutTransformControl { Child = ic };
            pencere.Content = sarmal;
            Degisti += d => sarmal.LayoutTransform = new ScaleTransform(d, d);
            sarmal.LayoutTransform = new ScaleTransform(deger, deger);
            pencere.AddHandler(InputElement.KeyDownEvent, AnahtarBasildi, RoutingStrategies.Tunnel);
            PopupKanca();
        }

        public static void Ayarla(double yeni)
        {
            yeni = Math.Clamp(Math.Round(yeni / Adim) * Adim, En, Cok);
            if (yeni == deger) return;
            deger = yeni;
            Yaz();
            Degisti?.Invoke(deger);
        }

        static void AnahtarBasildi(object? gonderen, KeyEventArgs e)
        {
            if (!e.KeyModifiers.HasFlag(KeyModifiers.Control)) return;
            if (e.Key == Key.OemPlus || e.Key == Key.Add) Ayarla(deger + Adim);
            else if (e.Key == Key.OemMinus || e.Key == Key.Subtract) Ayarla(deger - Adim);
            else if (e.Key == Key.D0 || e.Key == Key.NumPad0) Ayarla(ilk);
            else return;
            e.Handled = true;
        }

        static void PopupKanca()
        {
            if (kancali) return;
            kancali = true;
            Control.LoadedEvent.AddClassHandler<PopupRoot>((kok, _) =>
            {
                if (kok.Content is LayoutTransformControl || kok.Content is not Control ic) return;
                var sarmal = new LayoutTransformControl();
                kok.Content = null;
                sarmal.Child = ic;
                kok.Content = sarmal;
                sarmal.LayoutTransform = new ScaleTransform(deger, deger);
                Action<double> uygula = d => sarmal.LayoutTransform = new ScaleTransform(d, d);
                Degisti += uygula;
                kok.Closed += (_, _) => Degisti -= uygula;
            });
        }

        static double? Oku()
        {
            try
            {
                if (!File.Exists(Yol)) return null;
                using var belge = JsonDocument.Parse(File.ReadAllText(Yol));
                return Math.Clamp(belge.RootElement.GetProperty("olcek").GetDouble(), En, Cok);
            }
            catch { return null; }
        }

        static void Yaz()
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Yol)!);
                File.WriteAllText(Yol, JsonSerializer.Serialize(new { olcek = deger }));
            }
            catch { }
        }
    }
}
