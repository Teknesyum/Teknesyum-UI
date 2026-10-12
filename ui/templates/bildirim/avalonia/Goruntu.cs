// teknesyum-ui template bildirim/avalonia/Goruntu.cs
#nullable enable
#pragma warning disable CS0618
using System;
using SkiaSharp;

namespace {{AD}}.Kabuk
{
    public static class Goruntu
    {
        public static byte[]? Kucult(byte[] kaynak)
        {
            SKBitmap? asil;
            try { asil = SKBitmap.Decode(kaynak); }
            catch (ArgumentException) { return null; }
            if (asil is null) return null;
            using (asil)
            {
                var uzun = Math.Max(asil.Width, asil.Height);
                var taban = Math.Min(Bildirim.GoruntuEnAzKenar, uzun);
                for (var kenar = Math.Min(Bildirim.GoruntuEnCokKenar, uzun); kenar >= taban && kenar > 0; kenar = kenar * 3 / 4)
                {
                    var oran = (double)kenar / uzun;
                    var olcu = new SKImageInfo(
                        Math.Max(1, (int)Math.Round(asil.Width * oran)),
                        Math.Max(1, (int)Math.Round(asil.Height * oran)),
                        SKImageInfo.PlatformColorType, SKAlphaType.Opaque);
                    using var kucuk = new SKBitmap(olcu);
                    using (var tuval = new SKCanvas(kucuk))
                    using (var boya = new SKPaint { FilterQuality = SKFilterQuality.Medium })
                    {
                        tuval.Clear(SKColors.White);
                        tuval.DrawBitmap(asil, new SKRect(0, 0, olcu.Width, olcu.Height), boya);
                    }
                    foreach (var kalite in Bildirim.GoruntuKaliteleri)
                    {
                        using var veri = kucuk.Encode(SKEncodedImageFormat.Jpeg, kalite);
                        if (veri is not null && veri.Size <= Bildirim.GoruntuEnCokBayt) return veri.ToArray();
                    }
                }
            }
            return null;
        }
    }
}
