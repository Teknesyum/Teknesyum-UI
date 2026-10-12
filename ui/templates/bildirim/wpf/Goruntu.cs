// teknesyum-ui template bildirim/wpf/Goruntu.cs
#nullable enable
using System;
using System.IO;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace {{AD}}.Kabuk
{
    public static class Goruntu
    {
        public static byte[]? Kucult(byte[] kaynak)
        {
            BitmapSource asil;
            try
            {
                using var akis = new MemoryStream(kaynak);
                var cozucu = BitmapDecoder.Create(akis, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
                asil = new FormatConvertedBitmap(cozucu.Frames[0], PixelFormats.Bgr24, null, 0);
                asil.Freeze();
            }
            catch (Exception hata) when (hata is NotSupportedException or FileFormatException or ArgumentException or InvalidOperationException)
            {
                return null;
            }
            var uzun = Math.Max(asil.PixelWidth, asil.PixelHeight);
            var taban = Math.Min(Bildirim.GoruntuEnAzKenar, uzun);
            for (var kenar = Math.Min(Bildirim.GoruntuEnCokKenar, uzun); kenar >= taban && kenar > 0; kenar = kenar * 3 / 4)
            {
                var oran = (double)kenar / uzun;
                var kucuk = new TransformedBitmap(asil, new ScaleTransform(oran, oran));
                kucuk.Freeze();
                foreach (var kalite in Bildirim.GoruntuKaliteleri)
                {
                    var kodlayici = new JpegBitmapEncoder { QualityLevel = kalite };
                    kodlayici.Frames.Add(BitmapFrame.Create(kucuk));
                    using var cikti = new MemoryStream();
                    kodlayici.Save(cikti);
                    if (cikti.Length <= Bildirim.GoruntuEnCokBayt) return cikti.ToArray();
                }
            }
            return null;
        }
    }
}
