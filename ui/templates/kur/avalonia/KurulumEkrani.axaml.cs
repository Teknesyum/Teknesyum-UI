// teknesyum-ui template kur/avalonia/KurulumEkrani.axaml.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Media;
using Avalonia.Threading;

namespace {{AD}}.Kabuk
{
    public enum KurulumDurumu
    {
        Hazir,
        Kuruluyor,
        Bitti,
        Hata
    }

    public partial class KurulumEkrani : UserControl
    {
        const int GunlukSatiri = 9;

        public static readonly StyledProperty<KurulumDurumu> DurumProperty =
            AvaloniaProperty.Register<KurulumEkrani, KurulumDurumu>(nameof(Durum));
        public static readonly StyledProperty<IImage?> LogoProperty =
            AvaloniaProperty.Register<KurulumEkrani, IImage?>(nameof(Logo));
        public static readonly StyledProperty<string> Ad1Property =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(Ad1), "Yeni");
        public static readonly StyledProperty<string> Ad2Property =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(Ad2), "Program");
        public static readonly StyledProperty<IReadOnlyList<string>> AdimAdlariProperty =
            AvaloniaProperty.Register<KurulumEkrani, IReadOnlyList<string>>(nameof(AdimAdlari), new[]
            {
                "Yazma izni denetleniyor",
                "Sürüm indiriliyor",
                "İndirilen dosya doğrulanıyor",
                "Dosyalar yerleştiriliyor",
                "Kısayollar oluşturuluyor"
            });
        public static readonly StyledProperty<string> HazirCumlesiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(HazirCumlesi), "Kurulum yerini seç ve Kur düğmesine bas.");
        public static readonly StyledProperty<string> BittiCumlesiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(BittiCumlesi), "Kurulum tamamlandı.");
        public static readonly StyledProperty<string> YerEtiketiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(YerEtiketi), "Kurulum yeri");
        public static readonly StyledProperty<string> KurulumYeriProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KurulumYeri), "");
        public static readonly StyledProperty<string> DegistirMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(DegistirMetni), "Değiştir");
        public static readonly StyledProperty<string> KurMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KurMetni), "Kur");
        public static readonly StyledProperty<string> KuruluyorMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KuruluyorMetni), "Kuruluyor");
        public static readonly StyledProperty<string> KapatMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KapatMetni), "Kapat");
        public static readonly StyledProperty<string> AcMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(AcMetni), "Programı aç");
        public static readonly StyledProperty<string> YenidenMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(YenidenMetni), "Yeniden dene");
        public static readonly StyledProperty<bool> ProvaProperty =
            AvaloniaProperty.Register<KurulumEkrani, bool>(nameof(Prova));

        public KurulumDurumu Durum { get => GetValue(DurumProperty); private set => SetValue(DurumProperty, value); }
        public bool Kapanabilir => Durum != KurulumDurumu.Kuruluyor;
        public IImage? Logo { get => GetValue(LogoProperty); set => SetValue(LogoProperty, value); }
        public string Ad1 { get => GetValue(Ad1Property); set => SetValue(Ad1Property, value); }
        public string Ad2 { get => GetValue(Ad2Property); set => SetValue(Ad2Property, value); }
        public IReadOnlyList<string> AdimAdlari { get => GetValue(AdimAdlariProperty); set => SetValue(AdimAdlariProperty, value); }
        public string HazirCumlesi { get => GetValue(HazirCumlesiProperty); set => SetValue(HazirCumlesiProperty, value); }
        public string BittiCumlesi { get => GetValue(BittiCumlesiProperty); set => SetValue(BittiCumlesiProperty, value); }
        public string YerEtiketi { get => GetValue(YerEtiketiProperty); set => SetValue(YerEtiketiProperty, value); }
        public string KurulumYeri { get => GetValue(KurulumYeriProperty); set => SetValue(KurulumYeriProperty, value); }
        public string DegistirMetni { get => GetValue(DegistirMetniProperty); set => SetValue(DegistirMetniProperty, value); }
        public string KurMetni { get => GetValue(KurMetniProperty); set => SetValue(KurMetniProperty, value); }
        public string KuruluyorMetni { get => GetValue(KuruluyorMetniProperty); set => SetValue(KuruluyorMetniProperty, value); }
        public string KapatMetni { get => GetValue(KapatMetniProperty); set => SetValue(KapatMetniProperty, value); }
        public string AcMetni { get => GetValue(AcMetniProperty); set => SetValue(AcMetniProperty, value); }
        public string YenidenMetni { get => GetValue(YenidenMetniProperty); set => SetValue(YenidenMetniProperty, value); }
        public bool Prova { get => GetValue(ProvaProperty); set => SetValue(ProvaProperty, value); }

        public event EventHandler? Kur;
        public event EventHandler? YenidenDene;
        public event EventHandler? Degistir;
        public event EventHandler? ProgramiAc;
        public event EventHandler? Kapat;

        readonly DispatcherTimer _zamanlayici = new() { Interval = TimeSpan.FromMilliseconds(16) };
        readonly List<string> _gunluk = new();
        double _gosterilen;
        double _hedef;
        double _tavan;
        int _suren;
        string _cumle = "";

        public KurulumEkrani()
        {
            InitializeComponent();
            _zamanlayici.Tick += (_, _) => Tik();
            KurDugmesi.Click += (_, _) => Basla(Kur);
            YenidenDugmesi.Click += (_, _) => Basla(YenidenDene);
            DegistirDugmesi.Click += (_, _) => Degistir?.Invoke(this, EventArgs.Empty);
            AcDugmesi.Click += (_, _) => ProgramiAc?.Invoke(this, EventArgs.Empty);
            KapatDugmesi.Click += (_, _) => Kapat?.Invoke(this, EventArgs.Empty);
            Iz.SizeChanged += (_, _) => Cubuk();
            AttachedToVisualTree += (_, _) => { Yenile(); _zamanlayici.Start(); };
            DetachedFromVisualTree += (_, _) => _zamanlayici.Stop();
            Yenile();
        }

        public void Adim(int yuzde, int tavan, string cumle)
        {
            if (Durum is KurulumDurumu.Hazir or KurulumDurumu.Hata)
                Durum = KurulumDurumu.Kuruluyor;
            if (Durum != KurulumDurumu.Kuruluyor)
                return;
            yuzde = Math.Clamp(yuzde, 0, 100);
            _hedef = Math.Max(_hedef, yuzde);
            _tavan = Math.Max(_hedef, Math.Max(_tavan, Math.Clamp(tavan, 0, 100)));
            var adet = Math.Max(1, AdimAdlari.Count);
            _suren = Math.Min(adet - 1, (int)(_hedef * adet / 100));
            _cumle = cumle;
            Yaz(cumle);
            Yenile();
        }

        public void Bitti()
        {
            _hedef = _tavan = 100;
            _suren = AdimAdlari.Count;
            _cumle = BittiCumlesi;
            Yaz(BittiCumlesi);
            Durum = KurulumDurumu.Bitti;
        }

        public void Hata(string ileti)
        {
            _cumle = ileti;
            Yaz(ileti);
            Durum = KurulumDurumu.Hata;
        }

        void Basla(EventHandler? olay)
        {
            if (Durum == KurulumDurumu.Hata)
            {
                _gosterilen = _hedef = _tavan = 0;
                _suren = 0;
                _gunluk.Clear();
            }
            Durum = KurulumDurumu.Kuruluyor;
            olay?.Invoke(this, EventArgs.Empty);
        }

        void Yaz(string satir)
        {
            _gunluk.Add(satir);
            if (_gunluk.Count > GunlukSatiri)
                _gunluk.RemoveRange(0, _gunluk.Count - GunlukSatiri);
            Gunluk.Children.Clear();
            for (var i = 0; i < _gunluk.Count; i++)
            {
                var tb = new TextBlock { Text = _gunluk[i] };
                tb.Classes.Add("gunluk");
                if (i == _gunluk.Count - 1)
                    tb.Classes.Add("son");
                Gunluk.Children.Add(tb);
            }
        }

        void Tik()
        {
            if (_gosterilen < _hedef)
            {
                var fark = _hedef - _gosterilen;
                _gosterilen = Math.Min(_hedef, _gosterilen + Math.Max(fark * 0.08, 0.2));
            }
            else if (_gosterilen < _tavan)
            {
                _gosterilen += (_tavan - _gosterilen) * 0.006;
            }
            else
            {
                return;
            }
            Cubuk();
        }

        void Cubuk()
        {
            if (Dolgu is null)
                return;
            Dolgu.RenderTransform = new ScaleTransform(_gosterilen / 100, 1);
            YuzdeYazisi.Text = "%" + Math.Floor(_gosterilen).ToString(CultureInfo.InvariantCulture);
        }

        protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
        {
            base.OnPropertyChanged(change);
            if (change.Property.OwnerType == typeof(KurulumEkrani))
                Yenile();
        }

        void Yenile()
        {
            if (AdYazisi is null)
                return;
            LogoResmi.Source = Logo;
            LogoResmi.IsVisible = Logo is not null;
            if (AdYazisi.Inlines is { Count: >= 2 } parca)
            {
                ((Run)parca[0]).Text = Ad1;
                ((Run)parca[1]).Text = Ad2;
            }
            CumleYazisi.Text = Durum == KurulumDurumu.Hazir ? HazirCumlesi : _cumle;
            CumleYazisi.Foreground = Durum switch
            {
                KurulumDurumu.Hata => Kaynak("DangerText"),
                KurulumDurumu.Bitti => Kaynak("Success"),
                _ => Kaynak("TextBody")
            };

            YerEtiketiYazisi.Text = YerEtiketi;
            YerYazisi.Text = KurulumYeri;
            ToolTip.SetTip(YerYazisi, KurulumYeri);
            DegistirDugmesi.Content = DegistirMetni;
            DegistirDugmesi.IsEnabled = Durum is KurulumDurumu.Hazir or KurulumDurumu.Hata;

            KurDugmesi.Content = Durum == KurulumDurumu.Kuruluyor ? KuruluyorMetni : KurMetni;
            KurDugmesi.IsVisible = Durum is KurulumDurumu.Hazir or KurulumDurumu.Kuruluyor;
            KurDugmesi.IsEnabled = Durum == KurulumDurumu.Hazir;
            ToolTip.SetTip(KurDugmesi, Durum == KurulumDurumu.Kuruluyor ? KuruluyorMetni : null);
            YenidenDugmesi.Content = YenidenMetni;
            YenidenDugmesi.IsVisible = Durum == KurulumDurumu.Hata;
            AcDugmesi.Content = AcMetni;
            AcDugmesi.IsVisible = Durum == KurulumDurumu.Bitti && !Prova;
            KapatDugmesi.Content = KapatMetni;
            KapatDugmesi.IsVisible = Durum is KurulumDurumu.Bitti or KurulumDurumu.Hata;

            Dolgu.Background = Durum switch
            {
                KurulumDurumu.Bitti => Kaynak("Success"),
                KurulumDurumu.Hata => Kaynak("DangerText"),
                _ => _gecis ??= Dolgu.Background
            };

            Adimlar.Children.Clear();
            for (var i = 0; i < AdimAdlari.Count; i++)
            {
                var durum = i < _suren || Durum == KurulumDurumu.Bitti ? "bitti"
                    : i == _suren && Durum == KurulumDurumu.Hata ? "hata"
                    : i == _suren && Durum == KurulumDurumu.Kuruluyor ? "suren"
                    : "";
                var isaret = new Border { Child = new TextBlock { Text = durum == "bitti" ? "✓" : durum == "hata" ? "!" : (i + 1).ToString(CultureInfo.InvariantCulture) } };
                isaret.Classes.Add("isaret");
                var ad = new TextBlock { Text = AdimAdlari[i], VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center };
                ad.Classes.Add("adim");
                if (durum.Length > 0)
                {
                    isaret.Classes.Add(durum);
                    ad.Classes.Add(durum);
                }
                var satir = new StackPanel { Orientation = Avalonia.Layout.Orientation.Horizontal, Spacing = Sayi("Space3") };
                satir.Children.Add(isaret);
                satir.Children.Add(ad);
                Adimlar.Children.Add(satir);
            }
            Cubuk();
        }

        IBrush? _gecis;


        object? Bul(string ad)
        {
            if (this.TryFindResource(ad, out var d))
                return d;
            return Application.Current is { } uygulama && uygulama.TryFindResource(ad, out var u) ? u : null;
        }

        IBrush? Kaynak(string ad) => Bul(ad) as IBrush;

        double Sayi(string ad) => Bul(ad) is double v ? v : 0;
    }
}
