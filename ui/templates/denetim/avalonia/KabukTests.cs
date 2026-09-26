// teknesyum-ui template denetim/avalonia/KabukTests.cs
#nullable enable
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
using Avalonia.Styling;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Xunit;

namespace {{AD}}.Kontrast
{
    public class KabukTests
    {
        const string SansAdi = "Atkinson Hyperlegible Next";
        static readonly string[] Durumlar = { "", ":pointerover", ":pressed", ":focus-visible" };

        [AvaloniaFact]
        public void SansFontGercektenYuklenir()
        {
            var pencere = Ac();
            try
            {
                Assert.True(pencere.TryFindResource("FontSans", out var kaynak), "FontSans kaynağı yok");
                var aile = Assert.IsType<FontFamily>(kaynak);
                foreach (var agirlik in new[] { FontWeight.Normal, FontWeight.SemiBold, FontWeight.Bold })
                {
                    Assert.True(FontManager.Current.TryGetGlyphTypeface(new Typeface(aile, FontStyle.Normal, agirlik), out var yuz),
                        "FontSans için yazı yüzü alınamadı: " + aile);
                    Assert.StartsWith(SansAdi, yuz!.FamilyName);
                }
            }
            finally
            {
                pencere.Close();
            }
        }

        [AvaloniaFact]
        public void HicbirYaziFs2AltindaDegil()
        {
            var pencere = Ac();
            var hatalar = new List<string>();
            try
            {
                var fs2 = Assert.IsType<double>(Kaynak(pencere, "FontSize2"));
                var muafTemalar = new[] { Kaynak(pencere, "Label"), Kaynak(pencere, "Hint") }.OfType<ControlTheme>().ToList();
                foreach (var dugum in pencere.GetVisualDescendants().Where(v => v.IsEffectivelyVisible))
                {
                    switch (dugum)
                    {
                        case TextBlock tb when !string.IsNullOrWhiteSpace(Metin(tb)):
                            if (Muaf(tb, muafTemalar))
                                break;
                            if (tb.FontSize < fs2 - 0.01)
                                hatalar.Add($"{Yol(tb)} \"{Metin(tb)}\" {tb.FontSize} < {fs2}");
                            break;
                        case TextPresenter tp when !string.IsNullOrWhiteSpace(tp.Text):
                            if (tp.FontSize < fs2 - 0.01)
                                hatalar.Add($"{Yol(tp)} \"{tp.Text}\" {tp.FontSize} < {fs2}");
                            break;
                        case Button b when b.Content is string s && !string.IsNullOrWhiteSpace(s):
                            if (b.FontSize < fs2 - 0.01)
                                hatalar.Add($"{Yol(b)} \"{s}\" {b.FontSize} < {fs2}");
                            break;
                    }
                }
            }
            finally
            {
                pencere.Close();
            }
            Assert.True(hatalar.Count == 0, hatalar.Count + " yazı fs-2 altında:\n" + string.Join("\n", hatalar.Distinct()));
        }

        [AvaloniaFact]
        public void HerDugmeDurumuKendiKirpmasinaSigar()
        {
            var pencere = Ac();
            var hatalar = new List<string>();
            try
            {
                var dugmeler = pencere.GetVisualDescendants().OfType<Button>()
                    .Where(b => b.IsEffectivelyVisible && !b.GetVisualAncestors().OfType<ScrollBar>().Any())
                    .ToList();
                foreach (var dugme in dugmeler)
                    foreach (var durum in Durumlar)
                        hatalar.AddRange(Tasmalar(dugme, durum));
            }
            finally
            {
                pencere.Close();
            }
            Assert.True(hatalar.Count == 0, string.Join(Environment.NewLine, hatalar.Distinct()));
        }

        public static IEnumerable<string> Tasmalar(Button dugme, string durum)
        {
            var sozde = (IPseudoClasses)dugme.Classes;
            if (durum.Length > 0)
                sozde.Add(durum);
            if (durum == ":focus-visible")
                sozde.Add(":focus");
            if (durum == ":pressed")
                sozde.Add(":pointerover");
            Bekle();
            var bulunan = new List<string>();
            foreach (var parca in dugme.GetSelfAndVisualDescendants().Where(v => v.IsEffectivelyVisible))
            {
                if (parca.GetTransformedBounds() is not { } tb)
                    continue;
                var kalan = new Rect(tb.Bounds.Size).TransformToAABB(tb.Transform);
                if (!tb.Clip.Inflate(0.5).Contains(kalan.Deflate(Math.Max(kalan.Width, kalan.Height) * 0.02 + 1)))
                    continue;
                var cizilen = tb.Bounds.TransformToAABB(tb.Transform);
                if (parca is Border { BoxShadow.Count: > 0 } golgeli)
                    cizilen = Sisir(cizilen, golgeli.BoxShadow);
                if (!tb.Clip.Inflate(0.5).Contains(cizilen))
                    bulunan.Add($"{Ad(dugme)}{durum} {parca.GetType().Name}: {cizilen} kırpılıyor, kırpma {tb.Clip} [{string.Join(",", parca.GetVisualAncestors().Where(v => v.ClipToBounds).Select(v => v.GetType().Name + "#" + (v as Control)?.Name))}]");
            }
            if (durum.Length > 0)
                sozde.Remove(durum);
            sozde.Remove(":focus");
            if (durum == ":pressed")
                sozde.Remove(":pointerover");
            Bekle();
            return bulunan;
        }

        static Rect Sisir(Rect dikdortgen, BoxShadows golgeler)
        {
            var sonuc = dikdortgen;
            foreach (var golge in golgeler)
                sonuc = sonuc.Union(dikdortgen.Translate(new Vector(golge.OffsetX, golge.OffsetY)).Inflate(golge.Blur + golge.Spread));
            return sonuc;
        }

        static bool Muaf(TextBlock tb, List<ControlTheme> muafTemalar)
        {
            if (tb.Classes.Contains("etiket") || tb.Classes.Contains("ipucu"))
                return true;
            for (var t = tb.Theme; t is not null; t = t.BasedOn)
                if (muafTemalar.Contains(t))
                    return true;
            return false;
        }

        static string Metin(TextBlock tb) =>
            tb.Inlines is { Count: > 0 } satirlar ? string.Concat(satirlar.OfType<Avalonia.Controls.Documents.Run>().Select(r => r.Text)) : tb.Text ?? "";

        static object? Kaynak(Control c, string ad) => c.TryFindResource(ad, out var d) ? d : null;

        static string Ad(Control c)
        {
            if (!string.IsNullOrEmpty(c.Name)) return "#" + c.Name;
            if (c is ContentControl cc && cc.Content is string s) return "\"" + s + "\"";
            return c.GetType().Name;
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

        static Window Ac()
        {
            var pencere = new global::{{AD}}.{{PENCERE}}();
            pencere.Show();
            Bekle();
            return pencere;
        }

        public static void Bekle()
        {
            for (var i = 0; i < 30; i++)
            {
                Dispatcher.UIThread.RunJobs();
                AvaloniaHeadlessPlatform.ForceRenderTimerTick(2);
            }
            Dispatcher.UIThread.RunJobs();
        }
    }
}
