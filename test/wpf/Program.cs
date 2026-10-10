using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using WpfSinama.Kabuk;

public static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        var kok = args.Length > 0 ? Path.GetFullPath(args[0]) : Kok();
        var cikti = Path.Combine(kok, "ui", "templates", "temalar", "wpf", "ekran");
        Directory.CreateDirectory(cikti);

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        foreach (var ad in new[] { "Theme", "States" })
            app.Resources.MergedDictionaries.Add((ResourceDictionary)Application.LoadComponent(new Uri("/WpfSinama;component/Tema/" + ad + ".xaml", UriKind.Relative)));

        var birincil = new Button { Content = "Güncelle", Style = (Style)app.FindResource("PrimaryButton"), HorizontalAlignment = HorizontalAlignment.Left };
        var baslik = new TextBlock { Text = "Tema", Style = (Style)app.FindResource("H2") };
        var govde = new TextBlock { Text = "Çalışırken değişen tema: fırçalar DynamicResource ile okunur.", Style = (Style)app.FindResource("Body") };
        var secici = new TemaSecici();
        var yigin = new StackPanel { Margin = new Thickness(16) };
        foreach (var e in new FrameworkElement[] { baslik, govde, secici, birincil })
        {
            e.Margin = new Thickness(0, 0, 0, 12);
            yigin.Children.Add(e);
        }
        var zemin = new Border { Child = yigin };
        zemin.SetResourceReference(Border.BackgroundProperty, "AppBg");
        var pencere = new Window { Width = 848, Height = 480, Content = zemin, WindowStyle = WindowStyle.None, ShowInTaskbar = false, Left = -20000, Top = -20000, ShowActivated = false };
        pencere.Show();

        Color Renk() => ((SolidColorBrush)birincil.Background).Color;
        var ilk = Renk();
        Kaydet(zemin, Path.Combine(cikti, "tema-standart.png"));
        var acik = Temalar.Liste.First(TemaHesap.AcikMi);
        Temalar.Uygula(acik.Id, false);
        var acikRenk = Renk();
        Kaydet(zemin, Path.Combine(cikti, "tema-acik.png"));
        var koyu = Temalar.Liste.Skip(1).First(t => !TemaHesap.AcikMi(t));
        Temalar.Uygula(koyu.Id, false);
        Kaydet(zemin, Path.Combine(cikti, "tema-koyu.png"));
        Temalar.Uygula(Temalar.Liste[0].Id, false);
        Oturt();
        var dondu = Renk() == ilk;
        pencere.Close();
        Console.WriteLine($"tema: {Temalar.Liste.Count} tema, acik={acik.Id} degisti={acikRenk != ilk} koyu={koyu.Id} standarta dondu={dondu}");
        return acikRenk != ilk && dondu ? 0 : 1;
    }

    static void Oturt() => Dispatcher.CurrentDispatcher.Invoke(() => { }, DispatcherPriority.ApplicationIdle);

    static void Kaydet(FrameworkElement e, string yol)
    {
        Oturt();
        e.UpdateLayout();
        var resim = new RenderTargetBitmap((int)e.ActualWidth, (int)e.ActualHeight, 96, 96, PixelFormats.Pbgra32);
        resim.Render(e);
        var kod = new PngBitmapEncoder();
        kod.Frames.Add(BitmapFrame.Create(resim));
        using var akis = File.Create(yol);
        kod.Save(akis);
    }

    static string Kok()
    {
        var d = new DirectoryInfo(AppContext.BaseDirectory);
        while (d != null && !Directory.Exists(Path.Combine(d.FullName, "ui", "templates"))) d = d.Parent;
        return d?.FullName ?? throw new InvalidOperationException("ui/templates bulunamadı");
    }
}
