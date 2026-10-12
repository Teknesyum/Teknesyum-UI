// teknesyum-ui template bildirim/avalonia/BizeUlasin.axaml.cs
#nullable enable
using System;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Platform.Storage;

namespace {{AD}}.Kabuk
{
    public partial class BizeUlasin : UserControl
    {
        byte[]? goruntu;
        bool mesgul;
        bool hataVar;

        public BizeUlasin()
        {
            InitializeComponent();
            NotKutusu.MinHeight = Kaynak("InputHeight") * 3;
            DurumYazisi.MinHeight = Math.Ceiling(Kaynak("FontSize1") * Kaynak("LineHeightBody") * 2);
            var bosluk = new Thickness(0, 0, Kaynak("Space2"), 0);
            GoruntuEkleDugmesi.Margin = bosluk;
            GoruntuKaldirDugmesi.Margin = bosluk;
            NotKutusu.TextChanged += (_, _) => Yenile();
            GoruntuEkleDugmesi.Click += GoruntuEkle;
            GoruntuKaldirDugmesi.Click += (_, _) => GoruntuyuBirak();
            GonderDugmesi.Click += GonderTiklandi;
            Yenile();
        }

        public string Uygulama { get; set; } = "";
        public string Surum { get; set; } = "";
        public string Platform { get; set; } = RuntimeInformation.OSDescription;
        public string Dil { get; set; } = CultureInfo.CurrentUICulture.Name;
        public BildirimMetinleri Metinler { get; set; } = new();
        public Func<BildirimGirdisi, Task<BildirimSonucu>> Gonderici { get; set; } = g => Bildirim.Gonder(g);
        public Func<Task<(string Ad, byte[] Veri)?>>? GoruntuSecici { get; set; }

        public event Action<int>? Gonderildi;

        public void MetinleriUygula() => Yenile();

        static double Kaynak(string ad) => Application.Current is { } uygulama && uygulama.TryFindResource(ad, out var deger) && deger is double sayi
            ? sayi
            : 0;

        void Yenile()
        {
            var m = Metinler;
            var notVar = !string.IsNullOrWhiteSpace(NotKutusu.Text);
            BaslikYazisi.Text = m.Baslik;
            NotEtiketi.Text = m.Not;
            NotIpucuYazisi.Text = m.NotIpucu;
            IletisimEtiketi.Text = m.Iletisim;
            IletisimIpucuYazisi.Text = m.IletisimIpucu;
            GoruntuEkleDugmesi.Content = m.GoruntuEkle;
            GoruntuKaldirDugmesi.Content = m.GoruntuKaldir;
            GoruntuKaldirDugmesi.IsVisible = goruntu is not null;
            GonderDugmesi.Content = hataVar ? m.YenidenDene : m.Gonder;
            NotKutusu.IsEnabled = IletisimKutusu.IsEnabled = !mesgul;
            GoruntuEkleDugmesi.IsEnabled = GoruntuKaldirDugmesi.IsEnabled = !mesgul;
            GonderDugmesi.IsEnabled = !mesgul && notVar;
            var neden = mesgul ? m.Gonderiliyor : null;
            foreach (var oge in new Control[] { NotKutusu, IletisimKutusu, GoruntuEkleDugmesi, GoruntuKaldirDugmesi })
                ToolTip.SetTip(oge, neden);
            ToolTip.SetTip(GonderDugmesi, neden ?? (notVar ? null : m.NotGerekli));
        }

        void DurumuYaz(string metin, string? sinif)
        {
            DurumYazisi.Classes.Set("ulasti", sinif == "ulasti");
            DurumYazisi.Classes.Set("hata", sinif == "hata");
            DurumYazisi.Text = metin;
        }

        void GoruntuyuBirak()
        {
            goruntu = null;
            GoruntuYazisi.Text = "";
            Yenile();
        }

        async Task<(string Ad, byte[] Veri)?> DosyaSec()
        {
            var ust = TopLevel.GetTopLevel(this);
            if (ust is null) return null;
            var secilen = await ust.StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
            {
                Title = Metinler.GoruntuEkle,
                AllowMultiple = false,
                FileTypeFilter = new[] { FilePickerFileTypes.ImageAll },
            });
            if (secilen.Count == 0) return null;
            await using var akis = await secilen[0].OpenReadAsync();
            using var bellek = new MemoryStream();
            await akis.CopyToAsync(bellek);
            return (secilen[0].Name, bellek.ToArray());
        }

        async void GoruntuEkle(object? sender, RoutedEventArgs e)
        {
            (string Ad, byte[] Veri)? secilen;
            try { secilen = await (GoruntuSecici ?? DosyaSec)(); }
            catch (Exception hata) when (hata is IOException or UnauthorizedAccessException) { secilen = null; }
            if (secilen is null) return;
            var veri = secilen.Value.Veri;
            var kucuk = await Task.Run(() => Goruntu.Kucult(veri));
            goruntu = kucuk;
            GoruntuYazisi.Text = kucuk is null
                ? Metinler.GoruntuOlmadi
                : string.Format(CultureInfo.CurrentCulture, Metinler.GoruntuHazir, secilen.Value.Ad);
            Yenile();
        }

        async void GonderTiklandi(object? sender, RoutedEventArgs e) => await Gonder();

        public async Task Gonder()
        {
            if (mesgul || string.IsNullOrWhiteSpace(NotKutusu.Text)) return;
            mesgul = true;
            DurumuYaz(Metinler.Gonderiliyor, null);
            Yenile();
            BildirimSonucu sonuc;
            try
            {
                sonuc = await Gonderici(new BildirimGirdisi(
                    Uygulama, Surum, Platform, Dil, NotKutusu.Text ?? "", IletisimKutusu.Text, goruntu));
            }
            finally
            {
                mesgul = false;
            }
            hataVar = !sonuc.Tamam;
            if (!sonuc.Tamam)
            {
                DurumuYaz(Metinler.Hata(sonuc.Hata), "hata");
                Yenile();
                return;
            }
            DurumuYaz(sonuc.GoruntuEklenemedi ? Metinler.UlastiGoruntusuz : Metinler.Ulasti, "ulasti");
            NotKutusu.Text = "";
            GoruntuyuBirak();
            Gonderildi?.Invoke(sonuc.No);
        }
    }
}
