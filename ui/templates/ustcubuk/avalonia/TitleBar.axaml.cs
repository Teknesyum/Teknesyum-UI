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

    public partial class TitleBar : UserControl
    {
        public static readonly StyledProperty<string> Ad1Property =
            AvaloniaProperty.Register<TitleBar, string>(nameof(Ad1), "Yeni");
        public static readonly StyledProperty<string> Ad2Property =
            AvaloniaProperty.Register<TitleBar, string>(nameof(Ad2), "Program");
        public static readonly StyledProperty<IImage?> LogoProperty =
            AvaloniaProperty.Register<TitleBar, IImage?>(nameof(Logo));
        public static readonly StyledProperty<string> RozetMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(RozetMetni), "Güncelleme");
        public static readonly StyledProperty<string> RozetIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(RozetIpucu), "Yeni sürüm var, indirmek için tıkla");
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
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekMetni), "Destek");
        public static readonly StyledProperty<string> DestekAdresiProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekAdresi), "https://github.com/sponsors/Teknesyum");
        public static readonly StyledProperty<string> DestekIpucuProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(DestekIpucu), "Projeyi desteklemek için tıkla");
        public static readonly StyledProperty<string> KucultMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(KucultMetni), "Simge durumuna küçült");
        public static readonly StyledProperty<string> BuyutMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(BuyutMetni), "Ekranı kapla");
        public static readonly StyledProperty<string> KapatMetniProperty =
            AvaloniaProperty.Register<TitleBar, string>(nameof(KapatMetni), "Kapat");

        public string Ad1 { get => GetValue(Ad1Property); set => SetValue(Ad1Property, value); }
        public string Ad2 { get => GetValue(Ad2Property); set => SetValue(Ad2Property, value); }
        public IImage? Logo { get => GetValue(LogoProperty); set => SetValue(LogoProperty, value); }
        public string RozetMetni { get => GetValue(RozetMetniProperty); set => SetValue(RozetMetniProperty, value); }
        public string RozetIpucu { get => GetValue(RozetIpucuProperty); set => SetValue(RozetIpucuProperty, value); }
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
        public string KapatMetni { get => GetValue(KapatMetniProperty); set => SetValue(KapatMetniProperty, value); }

        public event EventHandler? RozetTiklandi;

        public TitleBar()
        {
            InitializeComponent();
            Kap.PointerPressed += KapBasildi;
            Rozet.Click += (_, _) =>
            {
                RozetTiklandi?.Invoke(this, EventArgs.Empty);
                if (RozetKomutu is { } komut && komut.CanExecute(null))
                    komut.Execute(null);
            };
            ImzaDugmesi.Click += (_, _) => Ac(ImzaAdresi);
            DestekDugmesi.Click += (_, _) => Ac(DestekAdresi);
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

        void Yenile()
        {
            if (AdYazisi is null)
                return;
            if (AdYazisi.Inlines is { Count: >= 2 } satir)
            {
                ((Run)satir[0]).Text = Ad1;
                ((Run)satir[1]).Text = Ad2;
            }
            LogoResmi.Source = Logo;
            LogoResmi.IsVisible = Logo is not null;

            RozetYazisi.Text = RozetMetni;
            Rozet.IsVisible = RozetDurumu != RozetDurumu.Yok && !string.IsNullOrWhiteSpace(RozetMetni);
            Rozet.Classes.Set("hazir", RozetDurumu == RozetDurumu.Hazir);
            Rozet.Classes.Set("iniyor", RozetDurumu == RozetDurumu.Iniyor);
            ToolTip.SetTip(Rozet, RozetIpucu);
            AutomationPropertiesAd(Rozet, RozetMetni);

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
            ToolTip.SetTip(BuyutDugmesi, BuyutMetni);
            AutomationPropertiesAd(BuyutDugmesi, BuyutMetni);
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
