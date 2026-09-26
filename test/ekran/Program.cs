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
var bilesenler = new (string klasor, Func<Control> yap)[]
{
    ("ustcubuk", () => Sahne.UstCubuk()),
    ("durum", () => Sahne.Guncelleme()),
    ("kur", () => Sahne.Kurulum()),
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
foreach (var (klasor, yap) in bilesenler)
{
    var cikti = Path.Combine(kok, "ui", "templates", klasor, "avalonia", "ekran");
    Directory.CreateDirectory(cikti);
    var pencere = Sahne.Pencere(yap(), 848, 640);
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
    sb.AppendLine($"bilesen: {klasor}  pencere: 848x640  dugme: {dugmeler.Count}  denetim: {denetim}  tasma: {satirlar.Count}");
    sb.AppendLine("dugmeler: " + string.Join(", ", dugmeler.Select(b => string.IsNullOrEmpty(b.Name) ? b.Content?.ToString() : b.Name)));
    foreach (var s in satirlar.Distinct()) sb.AppendLine(s);
    File.WriteAllText(Path.Combine(cikti, "kirpma.txt"), sb.ToString(), new UTF8Encoding(false));
    Console.Write(sb.ToString());
    toplam += satirlar.Count;
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
