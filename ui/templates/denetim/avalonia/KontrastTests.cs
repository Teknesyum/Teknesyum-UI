using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Presenters;
using Avalonia.Controls.Primitives;
using Avalonia.Headless;
using Avalonia.Headless.XUnit;
using Avalonia.Media;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Xunit;

[assembly: AvaloniaTestApplication(typeof({{AD}}.Kontrast.KontrastUygulamasi))]

namespace {{AD}}.Kontrast
{
    public class KontrastUygulamasi
    {
        public static AppBuilder BuildAvaloniaApp() =>
            AppBuilder.Configure<global::{{AD}}.App>().UseHeadless(new AvaloniaHeadlessPlatformOptions());
    }

    public class KontrastTests
    {
        const double Esik = {{ESIK}};

        [AvaloniaFact]
        public void EveryTextClearsTheThreshold()
        {
            var pencere = new global::{{AD}}.{{PENCERE}}();
            pencere.Show();
            Dispatcher.UIThread.RunJobs();
            var bulgular = new List<string>();
            foreach (var dugum in new Visual[] { pencere }.Concat(pencere.GetVisualDescendants()))
                Olc(dugum, pencere, bulgular);
            pencere.Close();
            Assert.True(bulgular.Count == 0, bulgular.Count + " pair(s) below " + Esik + ":1\n" + string.Join("\n", bulgular));
        }

        static void Olc(Visual dugum, Window pencere, List<string> bulgular)
        {
            if (!dugum.IsEffectivelyVisible) return;
            if (dugum is InputElement ie && !ie.IsEffectivelyEnabled) return;
            IBrush yazi = null;
            string metin = null;
            if (dugum is TextBlock tb)
            {
                yazi = tb.Foreground;
                metin = tb.Text;
            }
            else if (dugum is ContentPresenter cp && cp.Content is string s)
            {
                yazi = cp.Foreground;
                metin = s;
            }
            if (string.IsNullOrWhiteSpace(metin)) return;
            if (!(yazi is ISolidColorBrush fg)) return;
            var zemin = Zemin(dugum, pencere, out var kesin);
            if (!kesin) return;
            var on = Ustune(Renk(fg.Color, fg.Opacity * Saydamlik(dugum)), zemin);
            var oran = Oran(on, zemin);
            if (oran < Esik)
                bulgular.Add(Yol(dugum) + " \"" + Kisalt(metin) + "\": bg " + Hex(zemin) + " on fg " + Hex(fg.Color) + " — " + oran.ToString("0.0", System.Globalization.CultureInfo.InvariantCulture) + ":1, below " + Esik + ":1");
        }

        static IBrush Dolgu(Visual n)
        {
            if (n is Panel p) return p.Background;
            if (n is Border b) return b.Background;
            if (n is ContentPresenter cp) return cp.Background;
            if (n is TemplatedControl tc) return tc.Background;
            if (n is TextBlock t) return t.Background;
            return null;
        }

        static double[] Zemin(Visual dugum, Window pencere, out bool kesin)
        {
            kesin = true;
            var katmanlar = new List<double[]>();
            for (var n = dugum; n != null; n = n.GetVisualParent())
            {
                var b = Dolgu(n);
                if (b == null) continue;
                if (!(b is ISolidColorBrush sb))
                {
                    kesin = false;
                    return null;
                }
                var katman = Renk(sb.Color, sb.Opacity * Saydamlik(n));
                if (katman[3] <= 0) continue;
                katmanlar.Add(katman);
                if (katman[3] >= 1) break;
            }
            var zemin = new double[] { 255, 255, 255, 1 };
            for (var i = katmanlar.Count - 1; i >= 0; i--) zemin = Ustune(katmanlar[i], zemin);
            zemin[3] = 1;
            return zemin;
        }

        static double Saydamlik(Visual dugum)
        {
            var toplam = 1.0;
            for (var n = dugum; n != null; n = n.GetVisualParent()) toplam *= n.Opacity;
            return toplam;
        }

        static double[] Renk(Color c, double opaklik) => new double[] { c.R, c.G, c.B, c.A / 255.0 * opaklik };

        static double[] Ustune(double[] ust, double[] alt)
        {
            var a = ust[3] + alt[3] * (1 - ust[3]);
            if (a <= 0) return new double[] { 0, 0, 0, 0 };
            Func<int, double> karis = i => (ust[i] * ust[3] + alt[i] * alt[3] * (1 - ust[3])) / a;
            return new[] { karis(0), karis(1), karis(2), a };
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

        static string Hex(double[] c) => "#" + ((int)Math.Round(c[0])).ToString("X2") + ((int)Math.Round(c[1])).ToString("X2") + ((int)Math.Round(c[2])).ToString("X2");

        static string Hex(Color c) => "#" + (c.A < 255 ? c.A.ToString("X2") : "") + c.R.ToString("X2") + c.G.ToString("X2") + c.B.ToString("X2");

        static string Kisalt(string s)
        {
            var t = s.Replace("\r", " ").Replace("\n", " ").Trim();
            return t.Length > 40 ? t.Substring(0, 40) + "…" : t;
        }

        static string Yol(Visual dugum)
        {
            var parcalar = new List<string>();
            for (var n = dugum; n != null && parcalar.Count < 4; n = n.GetVisualParent())
            {
                var ad = n is Control c && !string.IsNullOrEmpty(c.Name) ? "#" + c.Name : "";
                parcalar.Insert(0, n.GetType().Name + ad);
            }
            return string.Join(" > ", parcalar);
        }
    }
}
