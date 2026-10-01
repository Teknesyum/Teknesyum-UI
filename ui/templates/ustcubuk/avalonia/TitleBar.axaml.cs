// teknesyum-ui template ustcubuk/avalonia/TitleBar.axaml.cs
#nullable enable
using System;
using System.Windows.Input;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Media;
using Avalonia.VisualTree;

namespace {{AD}}.Kabuk
{
    public enum RozetDurumu
    {
        Yok,
        Var,
        Iniyor,
        Hazir
    }

    public enum SenkronDurumu
    {
        Yok,
        Esitleniyor,
        Esitlendi,
        Cevrimdisi
    }

    public partial class TitleBar : UserControl
    {
        public static readonly StyledProperty<string> Ad1Property =
            AvaloniaProperty.Register<TitleBar, string>(nameof(Ad1), "Yeni");
        public static readonly StyledProperty<string> Ad2Property =
            AvaloniaProperty.Register<TitleBar, string>(nameof(Ad2), "Program");
        public static readonly StyledProperty<string> RozetMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(RozetMetni), "Güncelleme");
        public static readonly StyledProperty<string> RozetIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(RozetIpucu), "Yeni sürüm var, indirmek için tıklayın");
        public static readonly StyledProperty<string> RozetHazirIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(RozetHazirIpucu), "İndirildi, kurmak için tıklayın");
        public static readonly StyledProperty<SenkronDurumu> SenkronDurumuProperty =
            AvaloniaProperty.Register<TitleBar, SenkronDurumu>(nameof(SenkronDurumu));
        public static readonly StyledProperty<string> SenkronMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(SenkronMetni), "Eşitlendi");
        public static readonly StyledProperty<string> CevrimdisiMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(CevrimdisiMetni), "Çevrimdışı");
        public static readonly StyledProperty<string> EsitleniyorMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(EsitleniyorMetni), "Eşitleniyor…");
        public static readonly StyledProperty<string> SenkronIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(SenkronIpucu), "Şimdi eşitle");
        public static readonly StyledProperty<string> SenkronZamaniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(SenkronZamani), "");
        public static readonly StyledProperty<ICommand?> SenkronKomutuProperty =
            AvaloniaProperty.Register<TitleBar, ICommand?>(nameof(SenkronKomutu));
        public static readonly StyledProperty<RozetDurumu> RozetDurumuProperty =
            AvaloniaProperty.Register<TitleBar, RozetDurumu>(nameof(RozetDurumu));
        public static readonly StyledProperty<ICommand?> RozetKomutuProperty =
            AvaloniaProperty.Register<TitleBar, ICommand?>(nameof(RozetKomutu));
        public static readonly StyledProperty<string> ImzaMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(ImzaMetni), "Teknesyum");
        public static readonly StyledProperty<string> ImzaAdresiProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(ImzaAdresi), "https://github.com/Teknesyum");
        public static readonly StyledProperty<string> ImzaIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(ImzaIpucu), "Teknesyum GitHub sayfasını aç");
        public static readonly StyledProperty<string> DestekMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekMetni), "Destek Ol");
        public static readonly StyledProperty<string> DestekAdresiProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekAdresi), "https://github.com/sponsors/Teknesyum");
        public static readonly StyledProperty<string> DestekIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekIpucu), "Projeyi desteklemek için tıkla");
        public static readonly StyledProperty<string> KucultMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(KucultMetni), "Küçült");
        public static readonly StyledProperty<string> BuyutMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(BuyutMetni), "Büyüt");
        public static readonly StyledProperty<string> GeriAlMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(GeriAlMetni), "Önceki boyuta getir");
        public static readonly StyledProperty<string> KapatMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(KapatMetni), "Kapat");
        public static readonly StyledProperty<object?> OrtaProperty =
            AvaloniaProperty.Register<TitleBar, object?>(nameof(Orta));
        public static readonly StyledProperty<IImage?> LogoProperty =
            AvaloniaProperty.Register<TitleBar, IImage?>(nameof(Logo));
        public static readonly StyledProperty<string?> DilProperty =
            AvaloniaProperty.Register<TitleBar, string?>(nameof(Dil));
        public static readonly StyledProperty<object?> SurumProperty =
            AvaloniaProperty.Register<TitleBar, object?>(nameof(Surum));
        public static readonly StyledProperty<object?> EkProperty =
            AvaloniaProperty.Register<TitleBar, object?>(nameof(Ek));

        public string Ad1 { get => GetValue(Ad1Property); set => SetValue(Ad1Property, value); }
        public string Ad2 { get => GetValue(Ad2Property); set => SetValue(Ad2Property, value); }
        public string RozetMetni { get => GetValue(RozetMetniProperty); set => SetValue(RozetMetniProperty, value); }
        public string RozetIpucu { get => GetValue(RozetIpucuProperty); set => SetValue(RozetIpucuProperty, value); }
        public string RozetHazirIpucu { get => GetValue(RozetHazirIpucuProperty); set => SetValue(RozetHazirIpucuProperty, value); }
        public SenkronDurumu SenkronDurumu { get => GetValue(SenkronDurumuProperty); set => SetValue(SenkronDurumuProperty, value); }
        public string SenkronMetni { get => GetValue(SenkronMetniProperty); set => SetValue(SenkronMetniProperty, value); }
        public string CevrimdisiMetni { get => GetValue(CevrimdisiMetniProperty); set => SetValue(CevrimdisiMetniProperty, value); }
        public string EsitleniyorMetni { get => GetValue(EsitleniyorMetniProperty); set => SetValue(EsitleniyorMetniProperty, value); }
        public string SenkronIpucu { get => GetValue(SenkronIpucuProperty); set => SetValue(SenkronIpucuProperty, value); }
        public string SenkronZamani { get => GetValue(SenkronZamaniProperty); set => SetValue(SenkronZamaniProperty, value); }
        public ICommand? SenkronKomutu { get => GetValue(SenkronKomutuProperty); set => SetValue(SenkronKomutuProperty, value); }
        public RozetDurumu RozetDurumu { get => GetValue(RozetDurumuProperty); set => SetValue(RozetDurumuProperty, value); }
        public ICommand? RozetKomutu { get => GetValue(RozetKomutuProperty); set => SetValue(RozetKomutuProperty, value); }
        public string ImzaMetni { get => GetValue(ImzaMetniProperty); set => SetValue(ImzaMetniProperty, value); }
        public string ImzaAdresi { get => GetValue(ImzaAdresiProperty); set => SetValue(ImzaAdresiProperty, value); }
        public string ImzaIpucu { get => GetValue(ImzaIpucuProperty); set => SetValue(ImzaIpucuProperty, value); }
        public string DestekMetni { get => GetValue(DestekMetniProperty); set => SetValue(DestekMetniProperty, value); }
        public string DestekAdresi { get => GetValue(DestekAdresiProperty); set => SetValue(DestekAdresiProperty, value); }
        public string DestekIpucu { get => GetValue(DestekIpucuProperty); set => SetValue(DestekIpucuProperty, value); }
        public string KucultMetni { get => GetValue(KucultMetniProperty); set => SetValue(KucultMetniProperty, value); }
        public string BuyutMetni { get => GetValue(BuyutMetniProperty); set => SetValue(BuyutMetniProperty, value); }
        public string GeriAlMetni { get => GetValue(GeriAlMetniProperty); set => SetValue(GeriAlMetniProperty, value); }
        public string KapatMetni { get => GetValue(KapatMetniProperty); set => SetValue(KapatMetniProperty, value); }
        public object? Orta { get => GetValue(OrtaProperty); set => SetValue(OrtaProperty, value); }
        public IImage? Logo { get => GetValue(LogoProperty); set => SetValue(LogoProperty, value); }
        public string? Dil { get => GetValue(DilProperty); set => SetValue(DilProperty, value); }
        public object? Surum { get => GetValue(SurumProperty); set => SetValue(SurumProperty, value); }
        public object? Ek { get => GetValue(EkProperty); set => SetValue(EkProperty, value); }

        public event EventHandler<string>? DilDegisti;
        public event EventHandler? RozetTiklandi;
        public event EventHandler? SenkronTiklandi;

        const uint WmNcHitTest = 0x0084;
        static readonly Geometry BuyutCizimi = Geometry.Parse("M0.5 0.5H13.5V13.5H0.5Z");
        static readonly Geometry GeriAlCizimi = Geometry.Parse("M0.5 3.5H10.5V13.5H0.5Z M3.5 3.5V0.5H13.5V10.5H10.5");

        Window? _pencere;
        readonly Win32Properties.CustomWndProcHookCallback _kanca;

        public TitleBar()
        {
            _kanca = PencereKancasi;
            InitializeComponent();
            Kap.PointerPressed += KapBasildi;
            Rozet.Click += (_, _) =>
            {
                RozetTiklandi?.Invoke(this, EventArgs.Empty);
                if (RozetKomutu is { } komut && komut.CanExecute(null))
                    komut.Execute(null);
            };
            Senkron.Click += (_, _) =>
            {
                SenkronTiklandi?.Invoke(this, EventArgs.Empty);
                if (SenkronKomutu is { } komut && komut.CanExecute(null))
                    komut.Execute(null);
            };
            ImzaDugmesi.Click += (_, _) => Ac(ImzaAdresi);
            DestekDugmesi.Click += (_, _) => Ac(DestekAdresi);
            DilTr.Click += (_, _) => DilSec("tr");
            DilEn.Click += (_, _) => DilSec("en");
            KucultDugmesi.Click += (_, _) =>
            {
                if (Pencere() is { } w)
                    w.WindowState = WindowState.Minimized;
            };
            BuyutDugmesi.Click += (_, _) => BuyutKucult();
            KapatDugmesi.Click += (_, _) => Pencere()?.Close();
            Win32Properties.SetNonClientHitTestResult(BuyutDugmesi, Win32Properties.Win32HitTestValue.MaxButton);
            Yenile();
        }

        protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
        {
            base.OnPropertyChanged(change);
            if (change.Property.OwnerType == typeof(TitleBar))
                Yenile();
        }

        protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
        {
            base.OnAttachedToVisualTree(e);
            _pencere = Pencere();
            if (_pencere is null)
                return;
            _pencere.PropertyChanged += PencereDegisti;
            Win32Properties.AddWndProcHookCallback(_pencere, _kanca);
            Yenile();
        }

        protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
        {
            if (_pencere is not null)
            {
                _pencere.PropertyChanged -= PencereDegisti;
                Win32Properties.RemoveWndProcHookCallback(_pencere, _kanca);
                _pencere = null;
            }
            base.OnDetachedFromVisualTree(e);
        }

        void PencereDegisti(object? sender, AvaloniaPropertyChangedEventArgs e)
        {
            if (e.Property == Window.WindowStateProperty || e.Property == Window.OffScreenMarginProperty)
                Yenile();
        }

        bool Buyuk => _pencere?.WindowState is WindowState.Maximized or WindowState.FullScreen;

        IntPtr PencereKancasi(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg != WmNcHitTest || _pencere is not { WindowState: WindowState.Maximized } w || !IsEffectivelyVisible)
                return IntPtr.Zero;
            var ham = lParam.ToInt64();
            var ekran = new PixelPoint(unchecked((short)ham), unchecked((short)(ham >> 16)));
            if (w.TranslatePoint(w.PointToClient(ekran), Kap) is not { } p)
                return IntPtr.Zero;
            var kutu = Kap.Bounds;
            if (p.Y >= kutu.Height)
                return IntPtr.Zero;
            var ic = new Point(Math.Clamp(p.X, 0, kutu.Width - 1), Math.Clamp(p.Y, 0, kutu.Height - 1));
            handled = true;
            foreach (var d in new[] { KucultDugmesi, BuyutDugmesi, KapatDugmesi })
                if (d.IsEffectivelyVisible && Kap.TranslatePoint(ic, d) is { } q && new Rect(d.Bounds.Size).Contains(q))
                    return (IntPtr)(d == BuyutDugmesi ? (int)Win32Properties.Win32HitTestValue.MaxButton : (int)Win32Properties.Win32HitTestValue.Client);
            return (IntPtr)(int)Win32Properties.Win32HitTestValue.Client;
        }

        void Yenile()
        {
            if (AdYazisi is null)
                return;
            if (AdYazisi.Inlines is { Count: >= 2 } satir)
            {
                ((Run)satir[0]).Text = Ad1;
                ((Run)satir[1]).Text = Ad2;
            }
            OrtaAlani.Content = Orta;
            EkAlani.Content = Ek;
            EkAlani.IsVisible = Ek is not null;
            LogoResmi.Source = Logo;
            LogoResmi.IsVisible = Logo is not null;
            DilAnahtari.IsVisible = Dil is "tr" or "en";
            DilTr.Classes.Set("secili", Dil == "tr");
            DilEn.Classes.Set("secili", Dil == "en");
            SurumAlani.Content = Surum;
            SurumAlani.IsVisible = Surum is not null;

            RozetYazisi.Text = RozetMetni;
            Rozet.IsVisible = RozetDurumu != RozetDurumu.Yok && !string.IsNullOrWhiteSpace(RozetMetni);
            Rozet.Classes.Set("hazir", RozetDurumu == RozetDurumu.Hazir);
            Rozet.Classes.Set("iniyor", RozetDurumu == RozetDurumu.Iniyor);
            ToolTip.SetTip(Rozet, RozetDurumu == RozetDurumu.Hazir ? RozetHazirIpucu : RozetIpucu);
            AutomationPropertiesAd(Rozet, RozetMetni);

            var senkronMetni = SenkronDurumu switch
            {
                SenkronDurumu.Esitleniyor => EsitleniyorMetni,
                SenkronDurumu.Cevrimdisi => CevrimdisiMetni,
                _ => SenkronMetni
            };
            if (SenkronDurumu != SenkronDurumu.Esitleniyor && !string.IsNullOrWhiteSpace(SenkronZamani))
                senkronMetni += " · " + SenkronZamani;
            SenkronYazisi.Text = senkronMetni;
            Senkron.IsVisible = SenkronDurumu != SenkronDurumu.Yok && !string.IsNullOrWhiteSpace(senkronMetni);
            Senkron.Classes.Set("esitleniyor", SenkronDurumu == SenkronDurumu.Esitleniyor);
            Senkron.Classes.Set("esitlendi", SenkronDurumu == SenkronDurumu.Esitlendi);
            Senkron.Classes.Set("cevrimdisi", SenkronDurumu == SenkronDurumu.Cevrimdisi);
            ToolTip.SetTip(Senkron, SenkronIpucu);
            AutomationPropertiesAd(Senkron, senkronMetni);

            ImzaDugmesi.Content = ImzaMetni;
            ImzaDugmesi.IsVisible = !string.IsNullOrWhiteSpace(ImzaMetni);
            ToolTip.SetTip(ImzaDugmesi, ImzaIpucu);
            AutomationPropertiesAd(ImzaDugmesi, ImzaIpucu);

            DestekDugmesi.Content = DestekMetni;
            DestekDugmesi.IsVisible = !string.IsNullOrWhiteSpace(DestekMetni);
            ToolTip.SetTip(DestekDugmesi, DestekIpucu);
            AutomationPropertiesAd(DestekDugmesi, DestekIpucu);

            ToolTip.SetTip(KucultDugmesi, KucultMetni);
            AutomationPropertiesAd(KucultDugmesi, KucultMetni);
            var buyuk = Buyuk;
            var buyutMetni = buyuk ? GeriAlMetni : BuyutMetni;
            ToolTip.SetTip(BuyutDugmesi, buyutMetni);
            AutomationPropertiesAd(BuyutDugmesi, buyutMetni);
            BuyutSimgesi.Data = buyuk ? GeriAlCizimi : BuyutCizimi;
            var m = _pencere?.OffScreenMargin ?? default;
            Kap.Margin = _pencere?.WindowState == WindowState.Maximized ? new Thickness(m.Left, m.Top, m.Right, 0) : default;
            ToolTip.SetTip(KapatDugmesi, KapatMetni);
            AutomationPropertiesAd(KapatDugmesi, KapatMetni);
        }

        static void AutomationPropertiesAd(Control c, string ad) =>
            Avalonia.Automation.AutomationProperties.SetName(c, ad);

        Window? Pencere() => TopLevel.GetTopLevel(this) as Window;

        void BuyutKucult()
        {
            if (Pencere() is not { } w || !w.CanResize)
                return;
            w.WindowState = w.WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
        }

        void KapBasildi(object? sender, PointerPressedEventArgs e)
        {
            if (e.Source is Visual kaynak && DugmeIcinde(kaynak))
                return;
            if (!e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
                return;
            if (e.ClickCount == 2)
            {
                BuyutKucult();
                e.Handled = true;
                return;
            }
            Pencere()?.BeginMoveDrag(e);
        }

        void DilSec(string dil)
        {
            if (Dil == dil)
                return;
            Dil = dil;
            DilDegisti?.Invoke(this, dil);
        }

        static bool DugmeIcinde(Visual kaynak)
        {
            for (Visual? v = kaynak; v is not null; v = v.GetVisualParent())
                if (v is Button)
                    return true;
            return false;
        }

        async void Ac(string adres)
        {
            if (!Uri.TryCreate(adres, UriKind.Absolute, out var uri))
                return;
            if (TopLevel.GetTopLevel(this)?.Launcher is { } launcher)
                await launcher.LaunchUriAsync(uri);
        }
    }
}
