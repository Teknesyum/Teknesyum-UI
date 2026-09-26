using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using Ekran.Kabuk;

namespace Ekran;

public static class Sahne
{
    public static object? Kaynak(string ad) =>
        Application.Current!.TryFindResource(ad, out var d) ? d : null;

    public static IImage Logo() =>
        new DrawingImage(new GeometryDrawing
        {
            Geometry = Geometry.Parse("M11 0L22 11L11 22L0 11Z"),
            Brush = (IBrush)Kaynak("NeonBlue")!
        });

    public static TitleBar UstCubuk() =>
        new() { Ad1 = "Dusty", Ad2 = "Bytes", Logo = Logo(), RozetDurumu = RozetDurumu.Var, VerticalAlignment = VerticalAlignment.Top };

    public static GuncellemePaneli Guncelleme() =>
        new() { Logo = Logo(), Surum = "1.4.0", Durum = GuncellemeDurumu.Var, HorizontalAlignment = HorizontalAlignment.Center, VerticalAlignment = VerticalAlignment.Center };

    public static KurulumEkrani Kurulum()
    {
        var k = new KurulumEkrani { Ad1 = "Dusty", Ad2 = "Bytes", Logo = Logo(), KurulumYeri = @"C:\Users\ornek\AppData\Local\Programs\DustyBytes" };
        k.Adim(2, 18, "Yazma izni denetleniyor.");
        k.Adim(20, 38, "Sürüm GitHub Releases üzerinden indiriliyor.");
        k.Adim(30, 38, "İndirme sürüyor, 18 MB / 42 MB.");
        k.Adim(40, 58, "İndirilen dosyanın sha256 özeti doğrulanıyor.");
        k.Adim(60, 78, "Dosyalar kullanıcı profiline yerleştiriliyor.");
        k.Adim(70, 78, "Eski sürüm dosyaları yedekleniyor ve yenileri yazılıyor, bu satır uzun olduğu için kırpılmalı.");
        k.Adim(80, 98, "Başlat menüsü kısayolu oluşturuluyor.");
        k.Adim(90, 98, "Masaüstü kısayolu oluşturuluyor.");
        k.Adim(95, 98, "Kurulum günlüğü diske yazılıyor.");
        k.Bitti();
        return k;
    }

    public static Window Pencere(Control icerik, double genislik, double yukseklik)
    {
        var kok = new Panel();
        kok.Children.Add(new Panel { Classes = { "appbg" } });
        kok.Children.Add(icerik);
        var w = new Window { Width = genislik, Height = yukseklik, Content = kok, Background = (IBrush)Kaynak("AppBg")! };
        w.Classes.Add("anim");
        return w;
    }
}

public class SinamaPenceresi : Window
{
    public SinamaPenceresi()
    {
        Width = 1400;
        Height = 900;
        Background = (IBrush)Sahne.Kaynak("AppBg")!;
        Classes.Add("anim");
        var govde = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*") };
        var g = Sahne.Guncelleme();
        g.Margin = new Thickness((double)Sahne.Kaynak("Space5")!);
        govde.Children.Add(g);
        var k = Sahne.Kurulum();
        Grid.SetColumn(k, 1);
        govde.Children.Add(k);
        var dock = new DockPanel();
        var ust = Sahne.UstCubuk();
        DockPanel.SetDock(ust, Dock.Top);
        dock.Children.Add(ust);
        dock.Children.Add(govde);
        var kok = new Panel();
        kok.Children.Add(new Panel { Classes = { "appbg" } });
        kok.Children.Add(dock);
        Content = kok;
    }
}
