using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Headless;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Ekran;
using Ekran.Kontrast;

AppBuilder.Configure<App>()
    .UseSkia()
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();

var kok = args.Length > 0 ? Path.GetFullPath(args[0]) : Kok();
var kurG = (int)(double)Sahne.Kaynak("InstallerWidth")!;
var kurY = (int)(double)Sahne.Kaynak("InstallerHeight")!;
var bilesenler = new (string klasor, Func<Control> yap, int genislik, int yukseklik)[]
{
    ("ustcubuk", () => Sahne.UstCubuk(), 1024, 640),
    ("durum", () => Sahne.Guncelleme(), 848, 640),
    ("kur", () => Sahne.Kurulum(), kurG, kurY),
    ("temalar", () => Sahne.Secici(), 848, 480),
    ("bildirim", () => Sahne.Ulasin(), 848, 640),
};
var durumlar = new (string ad, string[] sozde)[]
{
    ("dinlenik", Array.Empty<string>()),
    ("hover", new[] { ":pointerover" }),
    ("basili", new[] { ":pointerover", ":pressed" }),
    ("odak", new[] { ":focus-visible", ":focus" }),
    ("edilgen", Array.Empty<string>()),
};
var toplam = 0;
foreach (var (klasor, yap, genislik, yukseklik) in bilesenler)
{
    var cikti = Path.Combine(kok, "ui", "templates", klasor, "avalonia", "ekran");
    Directory.CreateDirectory(cikti);
    var pencere = Sahne.Pencere(yap(), genislik, yukseklik);
    pencere.Show();
    Oturt();
    var dugmeler = pencere.GetVisualDescendants().OfType<Button>()
        .Where(b => b.IsEffectivelyVisible && !b.GetVisualAncestors().OfType<ScrollBar>().Any()).ToList();
    foreach (var (ad, sozde) in durumlar)
    {
        var etkin = dugmeler.Select(b => b.IsEnabled).ToList();
        foreach (var b in dugmeler)
        {
            foreach (var s in sozde) ((IPseudoClasses)b.Classes).Add(s);
            if (ad == "edilgen") b.IsEnabled = false;
        }
        Oturt();
        pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, ad + ".png"));
        for (var i = 0; i < dugmeler.Count; i++)
        {
            foreach (var s in sozde) ((IPseudoClasses)dugmeler[i].Classes).Remove(s);
            dugmeler[i].IsEnabled = etkin[i];
        }
        Oturt();
    }
    var satirlar = new List<string>();
    var denetim = 0;
    foreach (var b in dugmeler)
        foreach (var s in new[] { "", ":pointerover", ":pressed", ":focus-visible" })
        {
            denetim++;
            satirlar.AddRange(KabukTests.Tasmalar(b, s));
        }
    foreach (var b in dugmeler) b.IsEnabled = false;
    Oturt();
    foreach (var b in dugmeler)
    {
        denetim++;
        satirlar.AddRange(KabukTests.Tasmalar(b, "").Select(x => "edilgen " + x));
    }
    pencere.Close();
    var sb = new StringBuilder();
    sb.AppendLine($"bilesen: {klasor}  pencere: {genislik}x{yukseklik}  dugme: {dugmeler.Count}  denetim: {denetim}  tasma: {satirlar.Count}");
    sb.AppendLine("dugmeler: " + string.Join(", ", dugmeler.Select(b => string.IsNullOrEmpty(b.Name) ? b.Content?.ToString() : b.Name)));
    foreach (var s in satirlar.Distinct()) sb.AppendLine(s);
    File.WriteAllText(Path.Combine(cikti, "kirpma.txt"), sb.ToString(), new UTF8Encoding(false));
    Console.Write(sb.ToString());
    toplam += satirlar.Count;
}
{
    var cikti = Path.Combine(kok, "ui", "templates", "temalar", "avalonia", "ekran");
    var pencere = Sahne.Pencere(Sahne.TemaSahnesi(), 1024, 640);
    pencere.Show();
    Oturt();
    var firca = (Avalonia.Media.SolidColorBrush)Sahne.Kaynak("Renk1")!;
    var ilk = firca.Color;
    var acik = Ekran.Kabuk.Temalar.Liste.First(t => Ekran.Kabuk.TemaHesap.AcikMi(t));
    var koyu = Ekran.Kabuk.Temalar.Liste.Skip(1).First(t => !Ekran.Kabuk.TemaHesap.AcikMi(t));
    Ekran.Kabuk.Temalar.Uygula(acik.Id, false);
    Oturt();
    pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, "tema-acik.png"));
    var acikRenk = firca.Color;
    Ekran.Kabuk.Temalar.Uygula(koyu.Id, false);
    Oturt();
    pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, "tema-koyu.png"));
    Ekran.Kabuk.Temalar.Uygula(Ekran.Kabuk.Temalar.Liste[0].Id, false);
    Oturt();
    pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, "tema-standart.png"));
    var dondu = firca.Color == ilk;
    pencere.Close();
    Console.WriteLine($"tema: {Ekran.Kabuk.Temalar.Liste.Count} tema, acik={acik.Id} degisti={acikRenk != ilk} koyu={koyu.Id} standarta dondu={dondu}");
    if (acikRenk == ilk || !dondu) toplam++;
}
{
    var cikti = Path.Combine(kok, "ui", "templates", "bildirim", "avalonia", "ekran");
    var form = Sahne.Ulasin();
    var pencere = Sahne.Pencere(form, 848, 640);
    pencere.Show();
    Oturt();
    var kutular = form.GetVisualDescendants().OfType<TextBox>().ToList();
    var durum = form.GetVisualDescendants().OfType<TextBlock>().First(t => t.Name == "DurumYazisi");
    var gonder = form.GetVisualDescendants().OfType<Button>().First(b => b.Name == "GonderDugmesi");
    var ekle = form.GetVisualDescendants().OfType<Button>().First(b => b.Name == "GoruntuEkleDugmesi");
    var bosEdilgen = !gonder.IsEnabled;
    var yukseklik = durum.Bounds.Height;

    using var buyuk = new SkiaSharp.SKBitmap(3200, 2000);
    var rastgele = new Random(7);
    var noktalar = new byte[buyuk.ByteCount];
    rastgele.NextBytes(noktalar);
    System.Runtime.InteropServices.Marshal.Copy(noktalar, 0, buyuk.GetPixels(), noktalar.Length);
    using var png = buyuk.Encode(SkiaSharp.SKEncodedImageFormat.Png, 100);
    var kucuk = Ekran.Kabuk.Goruntu.Kucult(png.ToArray());
    using var cozulen = kucuk is null ? null : SkiaSharp.SKBitmap.Decode(kucuk);
    var goruntuTamam = kucuk is not null && kucuk.Length <= 150 * 1024 && Math.Max(cozulen!.Width, cozulen.Height) <= 1600;
    var bozukTamam = Ekran.Kabuk.Goruntu.Kucult(new byte[] { 1, 2, 3 }) is null;

    form.GoruntuSecici = () => Task.FromResult<(string, byte[])?>(("ekran.png", png.ToArray()));
    ekle.RaiseEvent(new Avalonia.Interactivity.RoutedEventArgs(Button.ClickEvent));
    var bekle = DateTime.UtcNow.AddSeconds(20);
    while (DateTime.UtcNow < bekle && form.GetVisualDescendants().OfType<Button>().All(b => b.Name != "GoruntuKaldirDugmesi" || !b.IsVisible)) Oturt();

    Ekran.Kabuk.BildirimGirdisi? giden = null;
    kutular[0].Text = "Kaydet düğmesi ikinci tıklamada yanıt vermiyor.";
    kutular[1].Text = "ornek@teknesyum.dev";
    form.Gonderici = g => { giden = g; return Task.FromResult(new Ekran.Kabuk.BildirimSonucu(false, 0, false, Ekran.Kabuk.BildirimHatasi.Ag)); };
    Oturt();
    var doluEtkin = gonder.IsEnabled;
    form.Gonder().GetAwaiter().GetResult();
    Oturt();
    var hataMetni = durum.Text;
    var hataDugme = gonder.Content?.ToString();
    var notDuruyor = kutular[0].Text!.Length > 0;
    var hataYukseklik = durum.Bounds.Height;
    pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, "hata.png"));
    form.Gonderici = g => { giden = g; return Task.FromResult(new Ekran.Kabuk.BildirimSonucu(true, 42, false, Ekran.Kabuk.BildirimHatasi.Yok)); };
    form.Gonder().GetAwaiter().GetResult();
    Oturt();
    pencere.CaptureRenderedFrame()?.Save(Path.Combine(cikti, "ulasti.png"));
    var tamam = bosEdilgen && doluEtkin && goruntuTamam && bozukTamam && giden?.Goruntu is not null && hataDugme == "Yeniden dene" && notDuruyor
        && durum.Text == "Bildirimin ulaştı, teşekkürler." && string.IsNullOrEmpty(kutular[0].Text) && gonder.Content?.ToString() == "Gönder"
        && yukseklik > 0 && Math.Abs(hataYukseklik - yukseklik) < 0.5 && Math.Abs(durum.Bounds.Height - yukseklik) < 0.5;
    pencere.Close();
    Console.WriteLine($"bildirim: bos edilgen={bosEdilgen} dolu etkin={doluEtkin} goruntu={kucuk?.Length} bayt/{cozulen?.Width}x{cozulen?.Height} bozuk reddedildi={bozukTamam} giden goruntu={giden?.Goruntu is not null} hata=\"{hataMetni}\" dugme={hataDugme} not duruyor={notDuruyor} son=\"{durum.Text}\" durum yuksekligi={yukseklik}/{hataYukseklik}/{durum.Bounds.Height} tamam={tamam}");
    if (!tamam) toplam++;
}
Console.WriteLine("toplam tasma: " + toplam);
return toplam == 0 ? 0 : 1;

static void Oturt()
{
    var son = DateTime.UtcNow.AddMilliseconds(1500);
    while (DateTime.UtcNow < son)
    {
        Dispatcher.UIThread.RunJobs();
        AvaloniaHeadlessPlatform.ForceRenderTimerTick(1);
        Thread.Sleep(4);
    }
    KabukTests.Bekle();
}

static string Kok()
{
    var d = new DirectoryInfo(AppContext.BaseDirectory);
    while (d != null && !Directory.Exists(Path.Combine(d.FullName, "ui", "templates"))) d = d.Parent;
    return d?.FullName ?? throw new InvalidOperationException("ui/templates bulunamadı");
}
