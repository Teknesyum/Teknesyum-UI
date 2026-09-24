#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Windows.Threading;
using Xunit;
using IOPath = System.IO.Path;

namespace {{AD}}.Kontrast
{
    public class KontrastTests
    {
        const double Esik = {{ESIK}};
        static readonly double[] Olcekler = { 1.0, 1.25, 1.5 };
        static readonly string[] Durumlar = { "hover", "basili", "odak" };

        sealed record Olcum(string Durum, string Tur, string Yol, string Metin, string On, string Zemin, double Oran, bool Edilgen, bool Kesin);

        [Fact]
        public void EveryTextClearsTheThreshold()
        {
            var olcumler = new List<Olcum>();
            Sta(() =>
            {
                var pencere = Ac();
                Yuru(pencere, "dinlenik", olcumler);
                foreach (var dugme in Altlar(pencere).OfType<ButtonBase>().Where(b => b.IsVisible).ToList())
                {
                    foreach (var durum in Durumlar)
                    {
                        if (!Uygula(dugme, durum, true))
                        {
                            olcumler.Add(new Olcum(durum + " " + Ad(dugme), "durum", Yol(dugme), "", "-", "-", 0, true, false));
                            continue;
                        }
                        Bekle(pencere);
                        Yuru(dugme, durum + " " + Ad(dugme), olcumler);
                        Uygula(dugme, durum, false);
                        Bekle(pencere);
                    }
                    var etkin = dugme.IsEnabled;
                    dugme.IsEnabled = false;
                    Bekle(pencere);
                    Yuru(dugme, "edilgen " + Ad(dugme), olcumler);
                    dugme.IsEnabled = etkin;
                    Bekle(pencere);
                }
                pencere.Close();
            });
            Yaz(olcumler);
            var hatalar = olcumler.Where(o => !o.Edilgen && (!o.Kesin || o.Oran < Esik)).ToList();
            Assert.True(hatalar.Count == 0, hatalar.Count + " pair(s) below " + Esik + ":1\n" + string.Join("\n", hatalar.Select(Satir)));
        }

        [Fact]
        public void CapturesTheWindowAtEveryScale()
        {
            var etiket = Environment.GetEnvironmentVariable("UC_ETIKET") ?? "anlik";
            var klasor = Cikti();
            Sta(() =>
            {
                var pencere = Ac();
                foreach (var olcek in Olcekler)
                {
                    var yuzde = ((int)Math.Round(olcek * 100)).ToString(CultureInfo.InvariantCulture);
                    Kaydet(pencere, olcek, IOPath.Combine(klasor, "ana-" + yuzde + "-" + etiket + ".png"));
                }
                pencere.Close();
            });
        }

        static void Sta(Action is_)
        {
            Exception? hata = null;
            var t = new Thread(() =>
            {
                try
                {
                    if (Application.Current == null)
                    {
                        var app = new global::{{AD}}.App();
                        app.InitializeComponent();
                    }
                    is_();
                }
                catch (Exception e)
                {
                    hata = e;
                }
            });
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
            t.Join();
            if (hata != null) throw hata;
        }

        static Window Ac()
        {
            var pencere = new global::{{AD}}.{{PENCERE}}();
            pencere.ShowInTaskbar = false;
            pencere.ShowActivated = false;
            pencere.Show();
            Bekle(pencere);
            return pencere;
        }

        static void Bekle(Window pencere)
        {
            pencere.UpdateLayout();
            Dispatcher.CurrentDispatcher.Invoke(() => { }, DispatcherPriority.ApplicationIdle);
        }

        static void Kaydet(Window pencere, double olcek, string yol)
        {
            if (!(pencere.Content is FrameworkElement icerik) || icerik.ActualWidth <= 0 || icerik.ActualHeight <= 0) return;
            var kare = new RenderTargetBitmap(
                (int)Math.Ceiling(icerik.ActualWidth * olcek), (int)Math.Ceiling(icerik.ActualHeight * olcek),
                96 * olcek, 96 * olcek, PixelFormats.Pbgra32);
            kare.Render(icerik);
            var kodlayici = new PngBitmapEncoder();
            kodlayici.Frames.Add(BitmapFrame.Create(kare));
            using var akis = File.Create(yol);
            kodlayici.Save(akis);
        }

        static DependencyPropertyKey? Anahtar(string ad) =>
            typeof(UIElement).GetField(ad, BindingFlags.NonPublic | BindingFlags.Static)?.GetValue(null) as DependencyPropertyKey;

        static bool Kur(UIElement oge, string ad, bool acik)
        {
            var anahtar = Anahtar(ad);
            if (anahtar == null) return false;
            if (acik) oge.SetValue(anahtar, true);
            else oge.ClearValue(anahtar);
            return true;
        }

        static bool Uygula(ButtonBase dugme, string durum, bool acik)
        {
            switch (durum)
            {
                case "hover":
                    return Kur(dugme, "IsMouseOverPropertyKey", acik);
                case "basili":
                    var bas = typeof(ButtonBase).GetMethod("SetIsPressed", BindingFlags.NonPublic | BindingFlags.Instance);
                    if (bas == null) return false;
                    Kur(dugme, "IsMouseOverPropertyKey", acik);
                    bas.Invoke(dugme, new object[] { acik });
                    return true;
                case "odak":
                    return Kur(dugme, "IsKeyboardFocusedPropertyKey", acik) & Kur(dugme, "IsFocusedPropertyKey", acik);
            }
            return false;
        }

        static string Ad(FrameworkElement c)
        {
            if (!string.IsNullOrEmpty(c.Name)) return "#" + c.Name;
            if (c is ContentControl cc && cc.Content is string s) return "\"" + Kisalt(s) + "\"";
            return c.GetType().Name;
        }

        static IEnumerable<DependencyObject> Altlar(DependencyObject kok)
        {
            for (var i = 0; i < VisualTreeHelper.GetChildrenCount(kok); i++)
            {
                var cocuk = VisualTreeHelper.GetChild(kok, i);
                yield return cocuk;
                foreach (var torun in Altlar(cocuk)) yield return torun;
            }
        }

        static void Yuru(DependencyObject kok, string durum, List<Olcum> olcumler)
        {
            foreach (var dugum in new[] { kok }.Concat(Altlar(kok)))
                Olc(dugum, durum, olcumler);
        }

        static void Olc(DependencyObject dugum, string durum, List<Olcum> olcumler)
        {
            if (!(dugum is UIElement oge) || !oge.IsVisible) return;
            var edilgen = !oge.IsEnabled;
            var parcalar = new List<(string tur, string metin, Brush? on)>();
            if (dugum is TextBlock tb)
            {
                var runlar = tb.Inlines.OfType<Run>().ToList();
                if (runlar.Count > 0)
                {
                    foreach (var run in runlar)
                        parcalar.Add(("yazi", run.Text ?? "", run.Foreground));
                }
                else
                    parcalar.Add(("yazi", tb.Text ?? "", tb.Foreground));
            }
            else if (dugum is AccessText at)
                parcalar.Add(("yazi", at.Text ?? "", at.Foreground));
            else if (dugum is Shape sekil && sekil.ActualWidth > 0 && sekil.ActualHeight > 0)
                parcalar.Add(("simge", "simge", sekil.Fill ?? sekil.Stroke));
            foreach (var (tur, metin, on) in parcalar)
            {
                if (tur == "yazi" && string.IsNullOrWhiteSpace(metin)) continue;
                if (on == null) continue;
                var onlar = Boyalar(on, on.Opacity * Saydamlik(dugum));
                if (onlar == null)
                {
                    olcumler.Add(new Olcum(durum, tur, Yol(dugum), Kisalt(metin), on.GetType().Name, "-", 0, edilgen, false));
                    continue;
                }
                onlar = onlar.Where(r => r[3] > 0).ToList();
                if (onlar.Count == 0) continue;
                var zeminler = Zeminler(dugum, out var kesin);
                var enKotu = double.MaxValue;
                var enKotuOn = onlar[0];
                var enKotuZemin = zeminler[0];
                foreach (var onRenk in onlar)
                    foreach (var zemin in zeminler)
                    {
                        var oran = Oran(Ustune(onRenk, zemin), zemin);
                        if (oran < enKotu)
                        {
                            enKotu = oran;
                            enKotuOn = onRenk;
                            enKotuZemin = zemin;
                        }
                    }
                olcumler.Add(new Olcum(durum, tur, Yol(dugum), Kisalt(metin), Hex(enKotuOn), Hex(enKotuZemin), enKotu, edilgen, kesin));
            }
        }

        static List<double[]>? Boyalar(Brush b, double opaklik)
        {
            if (b is SolidColorBrush sb) return new List<double[]> { Renk(sb.Color, opaklik) };
            if (b is GradientBrush gb && gb.GradientStops.Count > 0) return gb.GradientStops.Select(s => Renk(s.Color, opaklik)).ToList();
            return null;
        }

        static Brush? Dolgu(DependencyObject n)
        {
            if (n is Panel p) return p.Background;
            if (n is Border b) return b.Background;
            if (n is Control c) return c.Background;
            if (n is TextBlock t) return t.Background;
            return null;
        }

        static List<double[]>? Katman(DependencyObject n)
        {
            var b = Dolgu(n);
            return b == null ? null : Boyalar(b, b.Opacity * Saydamlik(n));
        }

        static List<double[]> Zeminler(DependencyObject dugum, out bool kesin)
        {
            var katmanlar = new List<List<double[]>>();
            var opak = false;
            DependencyObject? n = dugum;
            while (n != null && !opak)
            {
                opak = Ekle(n, katmanlar);
                var ata = VisualTreeHelper.GetParent(n);
                if (!opak && ata is Panel panel && n is UIElement c)
                {
                    var sira = panel.Children.IndexOf(c);
                    for (var i = sira - 1; i >= 0 && !opak; i--)
                    {
                        var kardes = panel.Children[i];
                        if (!kardes.IsVisible || !Kapsar(Sinir(kardes), Sinir(c))) continue;
                        opak = Ekle(kardes, katmanlar);
                    }
                }
                n = ata;
            }
            kesin = opak;
            var sonuc = new List<double[]> { new double[] { 255, 255, 255, 1 } };
            for (var i = katmanlar.Count - 1; i >= 0; i--)
            {
                var katman = katmanlar[i];
                sonuc = sonuc.SelectMany(alt => katman.Select(ust => Ustune(ust, alt))).ToList();
            }
            foreach (var z in sonuc) z[3] = 1;
            return sonuc;
        }

        static bool Ekle(DependencyObject n, List<List<double[]>> katmanlar)
        {
            var k = Katman(n);
            if (k == null) return false;
            k = k.Where(r => r[3] > 0).ToList();
            if (k.Count == 0) return false;
            katmanlar.Add(k);
            return k.All(r => r[3] >= 1);
        }

        static Rect Sinir(UIElement oge) => new Rect((Point)VisualTreeHelper.GetOffset(oge), oge.RenderSize);

        static bool Kapsar(Rect dis, Rect ic) =>
            dis.Width > 0 && dis.Height > 0 && dis.X <= ic.X + 0.5 && dis.Y <= ic.Y + 0.5 && dis.Right >= ic.Right - 0.5 && dis.Bottom >= ic.Bottom - 0.5;

        static double Saydamlik(DependencyObject dugum)
        {
            var toplam = 1.0;
            for (DependencyObject? n = dugum; n != null; n = n is Visual ? VisualTreeHelper.GetParent(n) : null)
                if (n is UIElement u) toplam *= u.Opacity;
            return toplam;
        }

        static double[] Renk(Color c, double opaklik) => new double[] { c.R, c.G, c.B, c.A / 255.0 * opaklik };

        static double[] Ustune(double[] ust, double[] alt)
        {
            var a = ust[3] + alt[3] * (1 - ust[3]);
            if (a <= 0) return new double[] { 0, 0, 0, 0 };
            double Karis(int i) => (ust[i] * ust[3] + alt[i] * alt[3] * (1 - ust[3])) / a;
            return new[] { Karis(0), Karis(1), Karis(2), a };
        }

        static double Kanal(double v)
        {
            var s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.Pow((s + 0.055) / 1.055, 2.4);
        }

        static double Parlaklik(double[] c) => 0.2126 * Kanal(c[0]) + 0.7152 * Kanal(c[1]) + 0.0722 * Kanal(c[2]);

        static double Oran(double[] x, double[] y)
        {
            var a = Parlaklik(x);
            var b = Parlaklik(y);
            return (Math.Max(a, b) + 0.05) / (Math.Min(a, b) + 0.05);
        }

        static string Hex(double[] c) =>
            "#" + (c[3] < 1 ? ((int)Math.Round(c[3] * 255)).ToString("X2") : "") + ((int)Math.Round(c[0])).ToString("X2") + ((int)Math.Round(c[1])).ToString("X2") + ((int)Math.Round(c[2])).ToString("X2");

        static string Kisalt(string s)
        {
            var t = s.Replace("\r", " ").Replace("\n", " ").Trim();
            return t.Length > 40 ? t.Substring(0, 40) + "…" : t;
        }

        static string Yol(DependencyObject dugum)
        {
            var parcalar = new List<string>();
            for (DependencyObject? n = dugum; n != null && parcalar.Count < 4; n = VisualTreeHelper.GetParent(n))
            {
                var ad = n is FrameworkElement fe && !string.IsNullOrEmpty(fe.Name) ? "#" + fe.Name : "";
                parcalar.Insert(0, n.GetType().Name + ad);
            }
            return string.Join(" > ", parcalar);
        }

        static string Satir(Olcum o) =>
            string.Join(" | ", o.Durum, o.Tur, o.Yol, "\"" + o.Metin + "\"", "on " + o.On, "zemin " + o.Zemin,
                o.Tur == "durum" ? "durum kurulamadi" : o.Kesin ? o.Oran.ToString("0.00", CultureInfo.InvariantCulture) + ":1" : "zemin belirsiz",
                o.Edilgen ? (o.Tur == "durum" ? "olculmedi" : "edilgen") : (o.Kesin && o.Oran >= Esik ? "gecer" : "KALIR"));

        static string Cikti()
        {
            var yol = Environment.GetEnvironmentVariable("UC_CIKTI");
            if (string.IsNullOrEmpty(yol))
            {
                var d = new DirectoryInfo(AppContext.BaseDirectory);
                while (d != null && !d.EnumerateFiles("*.sln*").Any()) d = d.Parent;
                yol = IOPath.Combine(d?.FullName ?? AppContext.BaseDirectory, "tmp", "uc");
            }
            Directory.CreateDirectory(yol);
            return yol;
        }

        static void Yaz(List<Olcum> olcumler)
        {
            var etiket = Environment.GetEnvironmentVariable("UC_ETIKET") ?? "anlik";
            var sb = new StringBuilder();
            sb.AppendLine("durum | tur | yol | metin | on | zemin | oran | sonuc");
            foreach (var o in olcumler) sb.AppendLine(Satir(o));
            File.WriteAllText(IOPath.Combine(Cikti(), "kontrast-" + etiket + ".txt"), sb.ToString(), new UTF8Encoding(false));
        }
    }
}
