// teknesyum-ui template durum/avalonia/GuncellemePaneli.axaml.cs
#nullable enable
using System;
using System.Globalization;
using System.Windows.Input;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media;

namespace {{AD}}.Kabuk
{
    public enum GuncellemeDurumu
    {
        Var,
        Iniyor,
        Hazir
    }

    public partial class GuncellemePaneli : UserControl
    {
        public static readonly StyledProperty<GuncellemeDurumu> DurumProperty =
            AvaloniaProperty.Register<GuncellemePaneli, GuncellemeDurumu>(nameof(Durum));
        public static readonly StyledProperty<double> YuzdeProperty =
            AvaloniaProperty.Register<GuncellemePaneli, double>(nameof(Yuzde));
        public static readonly StyledProperty<IImage?> LogoProperty =
            AvaloniaProperty.Register<GuncellemePaneli, IImage?>(nameof(Logo));
        public static readonly StyledProperty<string> BaslikProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(Baslik), "Güncelleme");
        public static readonly StyledProperty<string> SurumEtiketiProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(SurumEtiketi), "Yeni sürüm");
        public static readonly StyledProperty<string> SurumProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(Surum), "");
        public static readonly StyledProperty<string> VarMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(VarMetni), "Yeni sürüm yayımlandı, indirmek ister misin?");
        public static readonly StyledProperty<string> IniyorMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(IniyorMetni), "Yeni sürüm iniyor, çalışmana devam edebilirsin.");
        public static readonly StyledProperty<string> HazirMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(HazirMetni), "Yeni sürüm indi, yüklemeye hazır.");
        public static readonly StyledProperty<string> IndirMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(IndirMetni), "İndir");
        public static readonly StyledProperty<string> IndirVeYukleMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(IndirVeYukleMetni), "İndir ve yükle");
        public static readonly StyledProperty<string> IptalMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(IptalMetni), "İptal");
        public static readonly StyledProperty<string> YukleMetniProperty =
            AvaloniaProperty.Register<GuncellemePaneli, string>(nameof(YukleMetni), "Yükle");
        public static readonly StyledProperty<ICommand?> IndirKomutuProperty =
            AvaloniaProperty.Register<GuncellemePaneli, ICommand?>(nameof(IndirKomutu));
        public static readonly StyledProperty<ICommand?> IndirVeYukleKomutuProperty =
            AvaloniaProperty.Register<GuncellemePaneli, ICommand?>(nameof(IndirVeYukleKomutu));
        public static readonly StyledProperty<ICommand?> IptalKomutuProperty =
            AvaloniaProperty.Register<GuncellemePaneli, ICommand?>(nameof(IptalKomutu));
        public static readonly StyledProperty<ICommand?> YukleKomutuProperty =
            AvaloniaProperty.Register<GuncellemePaneli, ICommand?>(nameof(YukleKomutu));

        public GuncellemeDurumu Durum { get => GetValue(DurumProperty); set => SetValue(DurumProperty, value); }
        public double Yuzde { get => GetValue(YuzdeProperty); set => SetValue(YuzdeProperty, value); }
        public IImage? Logo { get => GetValue(LogoProperty); set => SetValue(LogoProperty, value); }
        public string Baslik { get => GetValue(BaslikProperty); set => SetValue(BaslikProperty, value); }
        public string SurumEtiketi { get => GetValue(SurumEtiketiProperty); set => SetValue(SurumEtiketiProperty, value); }
        public string Surum { get => GetValue(SurumProperty); set => SetValue(SurumProperty, value); }
        public string VarMetni { get => GetValue(VarMetniProperty); set => SetValue(VarMetniProperty, value); }
        public string IniyorMetni { get => GetValue(IniyorMetniProperty); set => SetValue(IniyorMetniProperty, value); }
        public string HazirMetni { get => GetValue(HazirMetniProperty); set => SetValue(HazirMetniProperty, value); }
        public string IndirMetni { get => GetValue(IndirMetniProperty); set => SetValue(IndirMetniProperty, value); }
        public string IndirVeYukleMetni { get => GetValue(IndirVeYukleMetniProperty); set => SetValue(IndirVeYukleMetniProperty, value); }
        public string IptalMetni { get => GetValue(IptalMetniProperty); set => SetValue(IptalMetniProperty, value); }
        public string YukleMetni { get => GetValue(YukleMetniProperty); set => SetValue(YukleMetniProperty, value); }
        public ICommand? IndirKomutu { get => GetValue(IndirKomutuProperty); set => SetValue(IndirKomutuProperty, value); }
        public ICommand? IndirVeYukleKomutu { get => GetValue(IndirVeYukleKomutuProperty); set => SetValue(IndirVeYukleKomutuProperty, value); }
        public ICommand? IptalKomutu { get => GetValue(IptalKomutuProperty); set => SetValue(IptalKomutuProperty, value); }
        public ICommand? YukleKomutu { get => GetValue(YukleKomutuProperty); set => SetValue(YukleKomutuProperty, value); }

        public event EventHandler? Indir;
        public event EventHandler? IndirVeYukle;
        public event EventHandler? Iptal;
        public event EventHandler? Yukle;

        public GuncellemePaneli()
        {
            InitializeComponent();
            IndirDugmesi.Click += (_, _) => Calistir(Indir, IndirKomutu);
            IndirVeYukleDugmesi.Click += (_, _) => Calistir(IndirVeYukle, IndirVeYukleKomutu);
            IptalDugmesi.Click += (_, _) => Calistir(Iptal, IptalKomutu);
            YukleDugmesi.Click += (_, _) => Calistir(Yukle, YukleKomutu);
            Iz.SizeChanged += (_, _) => Cubuk();
            Yenile();
        }

        void Calistir(EventHandler? olay, ICommand? komut)
        {
            olay?.Invoke(this, EventArgs.Empty);
            if (komut is not null && komut.CanExecute(null))
                komut.Execute(null);
        }

        protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
        {
            base.OnPropertyChanged(change);
            if (change.Property.OwnerType == typeof(GuncellemePaneli))
                Yenile();
        }

        void Yenile()
        {
            if (BaslikYazisi is null)
                return;
            LogoResmi.Source = Logo;
            LogoResmi.IsVisible = Logo is not null;
            BaslikYazisi.Text = Baslik;
            SurumEtiketiYazisi.Text = SurumEtiketi;
            SurumYazisi.Text = Surum;
            SurumEtiketiYazisi.IsVisible = SurumYazisi.IsVisible = !string.IsNullOrWhiteSpace(Surum);

            DurumYazisi.Text = Durum switch
            {
                GuncellemeDurumu.Iniyor => IniyorMetni,
                GuncellemeDurumu.Hazir => HazirMetni,
                _ => VarMetni
            };

            IndirDugmesi.Content = IndirMetni;
            IndirVeYukleDugmesi.Content = IndirVeYukleMetni;
            IptalDugmesi.Content = IptalMetni;
            YukleDugmesi.Content = YukleMetni;
            IndirDugmesi.IsVisible = Durum == GuncellemeDurumu.Var;
            IndirVeYukleDugmesi.IsVisible = Durum == GuncellemeDurumu.Var;
            IptalDugmesi.IsVisible = Durum == GuncellemeDurumu.Iniyor;
            YukleDugmesi.IsVisible = Durum == GuncellemeDurumu.Hazir;

            Ilerleme.IsVisible = Durum != GuncellemeDurumu.Var;
            Cubuk();
        }

        void Cubuk()
        {
            var yuzde = Durum == GuncellemeDurumu.Hazir ? 100 : Math.Clamp(Yuzde, 0, 100);
            Dolgu.RenderTransform = new ScaleTransform(yuzde / 100, 1);
            YuzdeYazisi.Text = "%" + Math.Floor(yuzde).ToString(CultureInfo.InvariantCulture);
        }

    }
}
