#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Presenters;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Shapes;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Xunit;
using IOPath = System.IO.Path;

[assembly: AvaloniaTestApplication(typeof({{AD}}.Kontrast.KontrastUygulamasi))]

namespace {{AD}}.Kontrast
{
    public class KontrastUygulamasi
    {
        public static AppBuilder BuildAvaloniaApp() =>
            AppBuilder.Configure<global::{{AD}}.App>()
                .UseSkia()
                .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false });
    }

    public class KontrastTests
    {
        const double Esik = {{ESIK}};
        static readonly double[] Olcekler = { 1.0, 1.25, 1.5 };
        static readonly string[] Durumlar = { "hover", "basili", "odak" };

        sealed record Olcum(string Durum, string Tur, string Yol, string Metin, string On, string Zemin, double Oran, bool Edilgen, bool Kesin);

        [AvaloniaFact]
        public void EveryTextClearsTheThreshold()
        {
            var pencere = Ac(1.0);
            var olcumler = new List<Olcum>();
            Yuru(pencere, "dinlenik", olcumler);
            foreach (var dugme in pencere.GetVisualDescendants().OfType<Button>().Where(b => b.IsEffectivelyVisible).ToList())
            {
                foreach (var durum in Durumlar)
                {
                    Uygula(dugme, durum, true);
                    Bekle();
                    Yuru(dugme, durum + " " + Ad(dugme), olcumler);
                    Uygula(dugme, durum, false);
                    Bekle();
                }
                var etkin = dugme.IsEnabled;
                dugme.IsEnabled = false;
                Bekle();
                Yuru(dugme, "edilgen " + Ad(dugme), olcumler);
                dugme.IsEnabled = etkin;
                Bekle();
            }
            pencere.Close();
            Yaz(olcumler);
            var hatalar = olcumler.Where(o => !o.Edilgen && (!o.Kesin || o.Oran < Esik)).ToList();
            Assert.True(hatalar.Count == 0, hatalar.Count + " pair(s) below " + Esik + ":1\n" + string.Join("\n", hatalar.Select(Satir)));
        }

        [AvaloniaFact]
        public void CapturesTheWindowAtEveryScale()
        {
            var etiket = Environment.GetEnvironmentVariable("UC_ETIKET") ?? "anlik";
            var klasor = Cikti();
            foreach (var olcek in Olcekler)
            {
                var yuzde = ((int)Math.Round(olcek * 100)).ToString(CultureInfo.InvariantCulture);
                var pencere = Ac(olcek);
                Kaydet(pencere, IOPath.Combine(klasor, "ana-" + yuzde + "-" + etiket + ".png"));
                pencere.Close();
            }
        }

        static Window Ac(double olcek)
        {
            var pencere = new global::{{AD}}.{{PENCERE}}();
            pencere.Show();
            pencere.SetRenderScaling(olcek);
            Bekle();
            return pencere;
        }

        static void Bekle()
        {
            for (var i = 0; i < 30; i++)
            {
                Dispatcher.UIThread.RunJobs();
                AvaloniaHeadlessPlatform.ForceRenderTimerTick(2);
            }
            Dispatcher.UIThread.RunJobs();
        }

        static void Kaydet(Window pencere, string yol)
        {
            var kare = pencere.CaptureRenderedFrame();
            kare?.Save(yol);
        }

        static void Uygula(Button dugme, string durum, bool acik)
        {
            var pc = (IPseudoClasses)dugme.Classes;
            switch (durum)
            {
                case "hover":
                    pc.Set(":pointerover", acik);
                    break;
                case "basili":
                    pc.Set(":pointerover", acik);
                    pc.Set(":pressed", acik);
                    break;
                case "odak":
                    pc.Set(":focus", acik);
                    pc.Set(":focus-visible", acik);
                    break;
            }
        }

        static string Ad(Control c)
        {
            if (!string.IsNullOrEmpty(c.Name)) return "#" + c.Name;
            if (c is ContentControl cc && cc.Content is string s) return "\"" + Kisalt(s) + "\"";
            return c.GetType().Name;
        }

        static void Yuru(Visual kok, string durum, List<Olcum> olcumler)
        {
            foreach (var dugum in new[] { kok }.Concat(kok.GetVisualDescendants()))
                Olc(dugum, durum, olcumler);
        }

        static void Olc(Visual dugum, string durum, List<Olcum> olcumler)
        {
            if (!dugum.IsEffectivelyVisible) return;
            var edilgen = dugum is InputElement ie && !ie.IsEffectivelyEnabled;
            var parcalar = new List<(string tur, string metin, IBrush? on)>();
            if (dugum is TextBlock tb)
            {
                if (tb.Inlines is { Count: > 0 } satirlar)
                {
                    foreach (var run in satirlar.OfType<Run>())
                        parcalar.Add(("yazi", run.Text ?? "", run.Foreground ?? tb.Foreground));
                }
                else
                    parcalar.Add(("yazi", tb.Text ?? "", tb.Foreground));
            }
            else if (dugum is Shape sekil && sekil.Bounds.Width > 0 && sekil.Bounds.Height > 0)
            {
                parcalar.Add(("simge", "simge", sekil.Fill ?? sekil.Stroke));
            }
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

        static List<double[]>? Boyalar(IBrush b, double opaklik)
        {
            if (b is ISolidColorBrush sb) return new List<double[]> { Renk(sb.Color, opaklik) };
            if (b is IGradientBrush gb && gb.GradientStops.Count > 0) return gb.GradientStops.Select(s => Renk(s.Color, opaklik)).ToList();
            return null;
        }

        static IBrush? Dolgu(Visual n)
        {
            if (n is Panel p) return p.Background;
            if (n is Border b) return b.Background;
            if (n is ContentPresenter cp) return cp.Background;
            if (n is TemplatedControl tc) return tc.Background;
            if (n is TextBlock t) return t.Background;
            return null;
        }

        static List<double[]>? Katman(Visual n)
        {
            var b = Dolgu(n);
            return b == null ? null : Boyalar(b, b.Opacity * Saydamlik(n));
        }

        static List<double[]> Zeminler(Visual dugum, out bool kesin)
        {
            var katmanlar = new List<List<double[]>>();
            var opak = false;
            Visual? n = dugum;
            while (n != null && !opak)
            {
                opak = Ekle(n, katmanlar);
                var ata = n.GetVisualParent();
                if (!opak && ata is Panel panel && n is Control c)
                {
                    var sira = panel.Children.IndexOf(c);
                    for (var i = sira - 1; i >= 0 && !opak; i--)
                    {
                        var kardes = panel.Children[i];
                        if (!kardes.IsEffectivelyVisible || !Kapsar(kardes.Bounds, c.Bounds)) continue;
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

        static bool Ekle(Visual n, List<List<double[]>> katmanlar)
        {
            var k = Katman(n);
            if (k == null) return false;
            k = k.Where(r => r[3] > 0).ToList();
            if (k.Count == 0) return false;
            katmanlar.Add(k);
            return k.All(r => r[3] >= 1);
        }

        static bool Kapsar(Rect dis, Rect ic) =>
            dis.Width > 0 && dis.Height > 0 && dis.X <= ic.X + 0.5 && dis.Y <= ic.Y + 0.5 && dis.Right >= ic.Right - 0.5 && dis.Bottom >= ic.Bottom - 0.5;

        static double Saydamlik(Visual dugum)
        {
            var toplam = 1.0;
            for (Visual? n = dugum; n != null; n = n.GetVisualParent()) toplam *= n.Opacity;
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

        static string Yol(Visual dugum)
        {
            var parcalar = new List<string>();
            for (Visual? n = dugum; n != null && parcalar.Count < 4; n = n.GetVisualParent())
            {
                var ad = n is Control c && !string.IsNullOrEmpty(c.Name) ? "#" + c.Name : "";
                parcalar.Insert(0, n.GetType().Name + ad);
            }
            return string.Join(" > ", parcalar);
        }

        static string Satir(Olcum o) =>
            string.Join(" | ", o.Durum, o.Tur, o.Yol, "\"" + o.Metin + "\"", "on " + o.On, "zemin " + o.Zemin,
                o.Kesin ? o.Oran.ToString("0.00", CultureInfo.InvariantCulture) + ":1" : "zemin belirsiz",
                o.Edilgen ? "edilgen" : (o.Kesin && o.Oran >= Esik ? "gecer" : "KALIR"));

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
