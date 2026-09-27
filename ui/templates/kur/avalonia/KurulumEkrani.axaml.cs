// teknesyum-ui template kur/avalonia/KurulumEkrani.axaml.cs · düzen 2
#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using Avalonia;
using Avalonia.Automation;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Shapes;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Styling;
using Avalonia.Threading;
using Avalonia.VisualTree;

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
        const int SolmaSatiri = 3;

        public static readonly StyledProperty<KurulumDurumu> DurumProperty =
            AvaloniaProperty.Register<KurulumEkrani, KurulumDurumu>(nameof(Durum));
        public static readonly StyledProperty<string> AdProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(Ad), "Yeni Program");
        public static readonly StyledProperty<string> BaslikEkiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(BaslikEki), "Kurulum");
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
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(HazirCumlesi), "Program bu bilgisayara kurulacak ve kendini güncel tutacak.");
        public static readonly StyledProperty<string> KuruluyorCumlesiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KuruluyorCumlesi), "Kuruluyor, pencereyi kapatma.");
        public static readonly StyledProperty<string> BittiCumlesiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(BittiCumlesi), "Kurulum tamamlandı.");
        public static readonly StyledProperty<string> HataCumlesiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(HataCumlesi), "Kurulum yarıda kaldı. İnterneti denetleyip yeniden dene.");
        public static readonly StyledProperty<string> KurulumYeriProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KurulumYeri), "");
        public static readonly StyledProperty<string> DegistirMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(DegistirMetni), "Değiştir");
        public static readonly StyledProperty<string> KurMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KurMetni), "Kur");
        public static readonly StyledProperty<string> KuruluyorMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KuruluyorMetni), "Kuruluyor");
        public static readonly StyledProperty<string> KuruluyorIpucuProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KuruluyorIpucu), "Kurulum bitince açılır");
        public static readonly StyledProperty<string> GunlukMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(GunlukMetni), "Günlüğü aç");
        public static readonly StyledProperty<string> KapatMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KapatMetni), "Kapat");
        public static readonly StyledProperty<string> AcMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(AcMetni), "Programı aç");
        public static readonly StyledProperty<string> YenidenMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(YenidenMetni), "Yeniden dene");
        public static readonly StyledProperty<string> ImzaMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(ImzaMetni), "Teknesyum");
        public static readonly StyledProperty<string> ImzaAdresiProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(ImzaAdresi), "https://github.com/Teknesyum");
        public static readonly StyledProperty<string> ImzaIpucuProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(ImzaIpucu), "Teknesyum GitHub sayfasını aç");
        public static readonly StyledProperty<string> KucultMetniProperty =
            AvaloniaProperty.Register<KurulumEkrani, string>(nameof(KucultMetni), "Küçült");
        public static readonly StyledProperty<bool> ProvaProperty =
            AvaloniaProperty.Register<KurulumEkrani, bool>(nameof(Prova));

        public KurulumDurumu Durum { get => GetValue(DurumProperty); private set => SetValue(DurumProperty, value); }
        public bool Kapanabilir => Durum != KurulumDurumu.Kuruluyor;
        public string Ad { get => GetValue(AdProperty); set => SetValue(AdProperty, value); }
        public string BaslikEki { get => GetValue(BaslikEkiProperty); set => SetValue(BaslikEkiProperty, value); }
        public IReadOnlyList<string> AdimAdlari { get => GetValue(AdimAdlariProperty); set => SetValue(AdimAdlariProperty, value); }
        public string HazirCumlesi { get => GetValue(HazirCumlesiProperty); set => SetValue(HazirCumlesiProperty, value); }
        public string KuruluyorCumlesi { get => GetValue(KuruluyorCumlesiProperty); set => SetValue(KuruluyorCumlesiProperty, value); }
        public string BittiCumlesi { get => GetValue(BittiCumlesiProperty); set => SetValue(BittiCumlesiProperty, value); }
        public string HataCumlesi { get => GetValue(HataCumlesiProperty); set => SetValue(HataCumlesiProperty, value); }
        public string KurulumYeri { get => GetValue(KurulumYeriProperty); set => SetValue(KurulumYeriProperty, value); }
        public string DegistirMetni { get => GetValue(DegistirMetniProperty); set => SetValue(DegistirMetniProperty, value); }
        public string KurMetni { get => GetValue(KurMetniProperty); set => SetValue(KurMetniProperty, value); }
        public string KuruluyorMetni { get => GetValue(KuruluyorMetniProperty); set => SetValue(KuruluyorMetniProperty, value); }
        public string KuruluyorIpucu { get => GetValue(KuruluyorIpucuProperty); set => SetValue(KuruluyorIpucuProperty, value); }
        public string GunlukMetni { get => GetValue(GunlukMetniProperty); set => SetValue(GunlukMetniProperty, value); }
        public string KapatMetni { get => GetValue(KapatMetniProperty); set => SetValue(KapatMetniProperty, value); }
        public string AcMetni { get => GetValue(AcMetniProperty); set => SetValue(AcMetniProperty, value); }
        public string YenidenMetni { get => GetValue(YenidenMetniProperty); set => SetValue(YenidenMetniProperty, value); }
        public string ImzaMetni { get => GetValue(ImzaMetniProperty); set => SetValue(ImzaMetniProperty, value); }
        public string ImzaAdresi { get => GetValue(ImzaAdresiProperty); set => SetValue(ImzaAdresiProperty, value); }
        public string ImzaIpucu { get => GetValue(ImzaIpucuProperty); set => SetValue(ImzaIpucuProperty, value); }
        public string KucultMetni { get => GetValue(KucultMetniProperty); set => SetValue(KucultMetniProperty, value); }
        public bool Prova { get => GetValue(ProvaProperty); set => SetValue(ProvaProperty, value); }

        public event EventHandler? Kur;
        public event EventHandler? YenidenDene;
        public event EventHandler? Degistir;
        public event EventHandler? GunluguAc;
        public event EventHandler? ProgramiAc;
        public event EventHandler? Kapat;

        readonly DispatcherTimer _zamanlayici = new() { Interval = TimeSpan.FromMilliseconds(16) };
        readonly List<string> _gunluk = new();
        readonly IBrush? _gecis;
        Window? _pencere;
        double _gosterilen;
        double _hedef;
        double _tavan;
        int _suren;
        string _hata = "";

        public KurulumEkrani()
        {
            Resources["KurParlama"] = Parlama("Renk1x20");
            Resources["KurParlamaGuclu"] = Parlama("Renk1x50");
            InitializeComponent();
            _gecis = Dolgu.Background;
            _zamanlayici.Tick += (_, _) => Tik();
            KurDugmesi.Click += (_, _) => Basla(Kur);
            YenidenDugmesi.Click += (_, _) => Basla(YenidenDene);
            DegistirDugmesi.Click += (_, _) => Degistir?.Invoke(this, EventArgs.Empty);
            GunlukDugmesi.Click += (_, _) => GunluguAc?.Invoke(this, EventArgs.Empty);
            AcDugmesi.Click += (_, _) => ProgramiAc?.Invoke(this, EventArgs.Empty);
            KapatDugmesi.Click += (_, _) => KapatIste();
            CarpiDugmesi.Click += (_, _) => KapatIste();
            KucultDugmesi.Click += (_, _) =>
            {
                if (Pencere() is { } w)
                    w.WindowState = WindowState.Minimized;
            };
            ImzaDugmesi.Click += (_, _) => Ac(ImzaAdresi);
            Cubuk.PointerPressed += CubukBasildi;
            Iz.SizeChanged += (_, _) => Ciz();
            GunlukKutusu.SizeChanged += (_, _) => Soldur();
            Govde.Padding = new Thickness(Sayi("Space5"), Sayi("Space4"));
            YerYazisi.TextTrimming = TextTrimming.PathSegmentEllipsis;
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
            Yaz(cumle);
            Yenile();
        }

        public void Bitti()
        {
            _gosterilen = _hedef = _tavan = 100;
            _suren = AdimAdlari.Count;
            Yaz(BittiCumlesi);
            Durum = KurulumDurumu.Bitti;
        }

        public void Hata(string ileti)
        {
            _hata = ileti;
            Durum = KurulumDurumu.Hata;
        }

        void Basla(EventHandler? olay)
        {
            _gosterilen = _hedef = _tavan = 0;
            _suren = 0;
            _hata = "";
            _gunluk.Clear();
            Yaz("");
            Durum = KurulumDurumu.Kuruluyor;
            olay?.Invoke(this, EventArgs.Empty);
        }

        void KapatIste()
        {
            if (!Kapanabilir)
                return;
            if (Kapat is { } olay)
                olay.Invoke(this, EventArgs.Empty);
            else
                Pencere()?.Close();
        }

        void Yaz(string satir)
        {
            if (satir.Length > 0)
                _gunluk.Add(satir);
            if (_gunluk.Count > GunlukSatiri)
                _gunluk.RemoveRange(0, _gunluk.Count - GunlukSatiri);
            Gunluk.Children.Clear();
            var yukseklik = SatirYuksekligi();
            for (var i = 0; i < _gunluk.Count; i++)
            {
                var tb = new TextBlock { Text = _gunluk[i], LineHeight = yukseklik };
                tb.Classes.Add("gunluk");
                if (i == _gunluk.Count - 1)
                    tb.Classes.Add("son");
                Gunluk.Children.Add(tb);
            }
        }

        double SatirYuksekligi() => Sayi("FontSize1") * Sayi("LineHeightMono");

        void Soldur()
        {
            var yukseklik = GunlukKutusu.Bounds.Height;
            if (yukseklik <= 0)
                return;
            GunlukKutusu.OpacityMask = new LinearGradientBrush
            {
                StartPoint = new RelativePoint(0, 0, RelativeUnit.Relative),
                EndPoint = new RelativePoint(0, 1, RelativeUnit.Relative),
                GradientStops =
                {
                    new GradientStop(Colors.Transparent, 0),
                    new GradientStop(Colors.Black, Math.Min(1, SolmaSatiri * SatirYuksekligi() / yukseklik))
                }
            };
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
            Ciz();
        }

        void Ciz()
        {
            if (Dolgu is null)
                return;
            Dolgu.RenderTransform = new ScaleTransform(_gosterilen / 100, 1);
            YuzdeYazisi.Text = "%" + Math.Floor(_gosterilen).ToString(CultureInfo.InvariantCulture);
        }

        protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
        {
            base.OnPropertyChanged(change);
            if (change.Property.OwnerType != typeof(KurulumEkrani))
                return;
            Yenile();
            if (change.Property == DurumProperty && Durum is KurulumDurumu.Bitti or KurulumDurumu.Hata)
                Dispatcher.UIThread.Post(() => Birincil()?.Focus());
        }

        protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
        {
            base.OnAttachedToVisualTree(e);
            _pencere = Pencere();
            if (_pencere is not null && ReferenceEquals(_pencere.Content, this))
            {
                PencereyiKur(_pencere);
                _pencere.Closing += Kapaniyor;
            }
            Yenile();
            _zamanlayici.Start();
        }

        protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
        {
            _zamanlayici.Stop();
            if (_pencere is not null)
                _pencere.Closing -= Kapaniyor;
            _pencere = null;
            base.OnDetachedFromVisualTree(e);
        }

        void Kapaniyor(object? sender, WindowClosingEventArgs e)
        {
            if (!Kapanabilir)
                e.Cancel = true;
        }

        void PencereyiKur(Window w)
        {
            w.Width = Sayi("InstallerWidth");
            w.Height = Sayi("InstallerHeight");
            w.CanResize = false;
            if (string.IsNullOrEmpty(w.Title))
                w.Title = Ad.Trim() + " " + BaslikEki;
            w.ExtendClientAreaToDecorationsHint = true;
            w.ExtendClientAreaChromeHints = Avalonia.Platform.ExtendClientAreaChromeHints.NoChrome;
            w.ExtendClientAreaTitleBarHeightHint = Sayi("TitleBarHeightMin");
            if (OperatingSystem.IsWindows())
                return;
            w.SystemDecorations = SystemDecorations.None;
            w.TransparencyLevelHint = new[] { WindowTransparencyLevel.Transparent };
            Cerceve.Background = w.Background ?? Kaynak("AppBg");
            w.Background = Brushes.Transparent;
            Cerceve.CornerRadius = Bul("WindowRadius") is CornerRadius r ? r : default;
            Cerceve.ClipToBounds = true;
        }

        void Yenile()
        {
            if (AdYazisi is null)
                return;
            if (AdYazisi.Inlines is { Count: >= 2 } parca)
            {
                ((Run)parca[0]).Text = Ad.Trim() + " ";
                ((Run)parca[1]).Text = BaslikEki;
            }
            ImzaDugmesi.Content = ImzaMetni;
            ImzaDugmesi.IsVisible = !string.IsNullOrWhiteSpace(ImzaMetni);
            ToolTip.SetTip(ImzaDugmesi, ImzaIpucu);
            AutomationProperties.SetName(ImzaDugmesi, ImzaIpucu);
            ToolTip.SetTip(KucultDugmesi, KucultMetni);
            AutomationProperties.SetName(KucultDugmesi, KucultMetni);
            ToolTip.SetTip(CarpiDugmesi, KapatMetni);
            AutomationProperties.SetName(CarpiDugmesi, KapatMetni);
            CarpiDugmesi.IsEnabled = Kapanabilir;

            CumleYazisi.Text = Durum switch
            {
                KurulumDurumu.Kuruluyor => KuruluyorCumlesi,
                KurulumDurumu.Bitti => BittiCumlesi,
                KurulumDurumu.Hata => HataCumlesi,
                _ => HazirCumlesi
            };
            HataYazisi.Text = _hata;
            HataYazisi.IsVisible = Durum == KurulumDurumu.Hata && _hata.Length > 0;

            YerYazisi.Text = KurulumYeri;
            ToolTip.SetTip(YerYazisi, KurulumYeri);
            DegistirYazisi.Text = DegistirMetni;
            AutomationProperties.SetName(DegistirDugmesi, DegistirMetni);
            DegistirDugmesi.IsVisible = Durum is KurulumDurumu.Hazir or KurulumDurumu.Hata;

            Dugme(KurDugmesi, KurMetni, Durum == KurulumDurumu.Hazir);
            Dugme(KuruluyorDugmesi, KuruluyorMetni, Durum == KurulumDurumu.Kuruluyor);
            Dugme(GunlukDugmesi, GunlukMetni, Durum == KurulumDurumu.Hata);
            Dugme(YenidenDugmesi, YenidenMetni, Durum == KurulumDurumu.Hata);
            Dugme(KapatDugmesi, KapatMetni, Durum == KurulumDurumu.Bitti);
            Dugme(AcDugmesi, AcMetni, Durum == KurulumDurumu.Bitti && !Prova);
            if (Resources[Prova ? "KurBirincil" : "KurIkincil"] is ControlTheme tema)
                KapatDugmesi.Theme = tema;

            Ilerleme.IsVisible = Durum != KurulumDurumu.Hazir;
            Dolgu.Background = Durum == KurulumDurumu.Hata ? Kaynak("DangerText") : _gecis;

            Adimlar.Children.Clear();
            var cap = Sayi("IconSize3");
            var cizgi = Bul("BorderWidth") is Thickness k ? k.Left : 0;
            for (var i = 0; i < AdimAdlari.Count; i++)
            {
                var durum = i < _suren || Durum == KurulumDurumu.Bitti ? "bitti"
                    : i == _suren && Durum == KurulumDurumu.Hata ? "hata"
                    : i == _suren && Durum == KurulumDurumu.Kuruluyor ? "suren"
                    : "";
                var halka = new Ellipse { Width = cap, Height = cap, StrokeThickness = cizgi };
                var isaret = new TextBlock { Text = durum == "bitti" ? "✓" : durum == "hata" ? "!" : (i + 1).ToString(CultureInfo.InvariantCulture) };
                var ad = new TextBlock { Text = AdimAdlari[i] };
                halka.Classes.Add("isaret");
                isaret.Classes.Add("isaret");
                ad.Classes.Add("adim");
                if (durum.Length > 0)
                {
                    halka.Classes.Add(durum);
                    isaret.Classes.Add(durum);
                    ad.Classes.Add(durum);
                }
                var nokta = new Panel { Width = cap, Height = cap };
                nokta.Children.Add(halka);
                nokta.Children.Add(isaret);
                var satir = new StackPanel { Orientation = Orientation.Horizontal, Spacing = Sayi("Space3"), Height = cap };
                satir.Children.Add(nokta);
                satir.Children.Add(ad);
                Adimlar.Children.Add(satir);
            }
            Ciz();
        }

        static void Dugme(Button dugme, string metin, bool gorunur)
        {
            dugme.Content = metin;
            dugme.IsVisible = gorunur;
            AutomationProperties.SetName(dugme, metin);
        }

        Button? Birincil() => Durum switch
        {
            KurulumDurumu.Hata => YenidenDugmesi,
            KurulumDurumu.Bitti => Prova ? KapatDugmesi : AcDugmesi,
            _ => null
        };

        void CubukBasildi(object? sender, PointerPressedEventArgs e)
        {
            if (e.Source is Visual kaynak && kaynak.FindAncestorOfType<Button>(true) is not null)
                return;
            if (e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
                Pencere()?.BeginMoveDrag(e);
        }

        async void Ac(string adres)
        {
            if (!Uri.TryCreate(adres, UriKind.Absolute, out var uri))
                return;
            if (TopLevel.GetTopLevel(this)?.Launcher is { } launcher)
                await launcher.LaunchUriAsync(uri);
        }

        Window? Pencere() => TopLevel.GetTopLevel(this) as Window;

        BoxShadows Parlama(string ad) => new(new BoxShadow
        {
            IsInset = true,
            Blur = Sayi("Space2"),
            Color = Kaynak(ad) is ISolidColorBrush f ? f.Color : default
        });

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
