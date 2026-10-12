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
        var bildirim = BildirimSinamasi(kok);
        return acikRenk != ilk && dondu && bildirim ? 0 : 1;
    }

    static bool BildirimSinamasi(string kok)
    {
        var cikti = Path.Combine(kok, "ui", "templates", "bildirim", "wpf", "ekran");
        Directory.CreateDirectory(cikti);
        var form = new BizeUlasin { Uygulama = "Dusty Bytes", Surum = "1.4.0", Width = (double)Application.Current.FindResource("ModalWidth"), Margin = new Thickness(16), HorizontalAlignment = HorizontalAlignment.Left, VerticalAlignment = VerticalAlignment.Top };
        var zemin = new Border { Child = form };
        zemin.SetResourceReference(Border.BackgroundProperty, "AppBg");
        var pencere = new Window { Width = 848, Height = 640, Content = zemin, WindowStyle = WindowStyle.None, ShowInTaskbar = false, Left = -20000, Top = -20000, ShowActivated = false };
        pencere.Show();
        Oturt();
        Kaydet(zemin, Path.Combine(cikti, "dinlenik.png"));

        var noktalar = new byte[3200 * 2000 * 3];
        new Random(7).NextBytes(noktalar);
        var kaynak = System.Windows.Media.Imaging.BitmapSource.Create(3200, 2000, 96, 96, PixelFormats.Bgr24, null, noktalar, 3200 * 3);
        var png = new System.Windows.Media.Imaging.PngBitmapEncoder();
        png.Frames.Add(System.Windows.Media.Imaging.BitmapFrame.Create(kaynak));
        using var akis = new MemoryStream();
        png.Save(akis);
        var kucuk = Goruntu.Kucult(akis.ToArray());
        var cozulen = kucuk is null ? null : System.Windows.Media.Imaging.BitmapFrame.Create(new MemoryStream(kucuk));
        var goruntuTamam = kucuk is not null && kucuk.Length <= 150 * 1024 && Math.Max(cozulen!.PixelWidth, cozulen.PixelHeight) <= 1600;
        var bozukTamam = Goruntu.Kucult(new byte[] { 1, 2, 3 }) is null;

        BildirimGirdisi? giden = null;
        form.Not = "Kaydet düğmesi ikinci tıklamada yanıt vermiyor.";
        form.Gonderici = g => { giden = g; return Task.FromResult(new BildirimSonucu(false, 0, false, BildirimHatasi.Ag)); };
        form.Gonder().GetAwaiter().GetResult();
        Oturt();
        var notDuruyor = form.Not.Length > 0;
        Kaydet(zemin, Path.Combine(cikti, "hata.png"));
        form.Gonderici = g => { giden = g; return Task.FromResult(new BildirimSonucu(true, 42, false, BildirimHatasi.Yok)); };
        form.Gonder().GetAwaiter().GetResult();
        Oturt();
        Kaydet(zemin, Path.Combine(cikti, "ulasti.png"));
        var tamam = goruntuTamam && bozukTamam && notDuruyor && giden is not null && form.Not.Length == 0;
        pencere.Close();
        Console.WriteLine($"bildirim: goruntu={kucuk?.Length} bayt/{cozulen?.PixelWidth}x{cozulen?.PixelHeight} bozuk reddedildi={bozukTamam} not duruyor={notDuruyor} gonderildi={giden is not null} tamam={tamam}");
        return tamam;
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
