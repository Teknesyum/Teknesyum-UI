// teknesyum-ui template bildirim/wpf/BizeUlasin.cs
#nullable enable
using System;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Markup;
using Microsoft.Win32;

namespace {{AD}}.Kabuk
{
    public class BizeUlasin : UserControl
    {
        const string KutuStili = @"
<Style xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation""
       xmlns:x=""http://schemas.microsoft.com/winfx/2006/xaml""
       TargetType=""TextBox"">
  <Setter Property=""Background"" Value=""{DynamicResource Surface}""/>
  <Setter Property=""Foreground"" Value=""{DynamicResource TextBody}""/>
  <Setter Property=""CaretBrush"" Value=""{DynamicResource TextBody}""/>
  <Setter Property=""SelectionBrush"" Value=""{DynamicResource Renk1}""/>
  <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderDefault}""/>
  <Setter Property=""BorderThickness"" Value=""{DynamicResource BorderWidth}""/>
  <Setter Property=""Padding"" Value=""{DynamicResource InputPadding}""/>
  <Setter Property=""MinHeight"" Value=""{DynamicResource InputHeight}""/>
  <Setter Property=""FontFamily"" Value=""{DynamicResource FontSans}""/>
  <Setter Property=""FontSize"" Value=""{DynamicResource FontSize2}""/>
  <Setter Property=""VerticalContentAlignment"" Value=""Center""/>
  <Setter Property=""ToolTipService.ShowOnDisabled"" Value=""True""/>
  <Setter Property=""Template"">
    <Setter.Value>
      <ControlTemplate TargetType=""TextBox"">
        <Border x:Name=""bd""
                Background=""{TemplateBinding Background}""
                BorderBrush=""{TemplateBinding BorderBrush}""
                BorderThickness=""{TemplateBinding BorderThickness}""
                CornerRadius=""{DynamicResource Radius}""
                SnapsToDevicePixels=""True"">
          <ScrollViewer x:Name=""PART_ContentHost"" Margin=""{TemplateBinding Padding}"" Focusable=""False""
                        VerticalAlignment=""{TemplateBinding VerticalContentAlignment}""/>
        </Border>
      </ControlTemplate>
    </Setter.Value>
  </Setter>
  <Style.Triggers>
    <Trigger Property=""IsMouseOver"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderStrong}""/>
    </Trigger>
    <Trigger Property=""IsKeyboardFocused"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Renk1}""/>
    </Trigger>
    <Trigger Property=""IsEnabled"" Value=""False"">
      <Setter Property=""Foreground"" Value=""{DynamicResource Disabled}""/>
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Disabled}""/>
    </Trigger>
  </Style.Triggers>
</Style>";

        const string IkincilStili = @"
<Style xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation""
       xmlns:x=""http://schemas.microsoft.com/winfx/2006/xaml""
       TargetType=""Button"">
  <Setter Property=""Background"" Value=""Transparent""/>
  <Setter Property=""Foreground"" Value=""{DynamicResource TextBody}""/>
  <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderDefault}""/>
  <Setter Property=""BorderThickness"" Value=""{DynamicResource BorderWidth}""/>
  <Setter Property=""Padding"" Value=""{DynamicResource ButtonPadding}""/>
  <Setter Property=""MinHeight"" Value=""{DynamicResource TargetMin}""/>
  <Setter Property=""MinWidth"" Value=""{DynamicResource TargetMin}""/>
  <Setter Property=""FontFamily"" Value=""{DynamicResource FontSans}""/>
  <Setter Property=""FontSize"" Value=""{DynamicResource FontSize1}""/>
  <Setter Property=""FontWeight"" Value=""{DynamicResource WeightBody}""/>
  <Setter Property=""Cursor"" Value=""Hand""/>
  <Setter Property=""ToolTipService.ShowOnDisabled"" Value=""True""/>
  <Setter Property=""Template"">
    <Setter.Value>
      <ControlTemplate TargetType=""Button"">
        <Border x:Name=""bd""
                Background=""{TemplateBinding Background}""
                BorderBrush=""{TemplateBinding BorderBrush}""
                BorderThickness=""{TemplateBinding BorderThickness}""
                CornerRadius=""{DynamicResource Radius}""
                Padding=""{TemplateBinding Padding}""
                SnapsToDevicePixels=""True"">
          <ContentPresenter HorizontalAlignment=""Center"" VerticalAlignment=""Center""/>
        </Border>
      </ControlTemplate>
    </Setter.Value>
  </Setter>
  <Style.Triggers>
    <Trigger Property=""IsMouseOver"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderStrong}""/>
      <Setter Property=""Background"" Value=""{DynamicResource Renk1x10}""/>
      <Setter Property=""Foreground"" Value=""{DynamicResource OnRenk1x10}""/>
    </Trigger>
    <Trigger Property=""IsKeyboardFocused"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderStrong}""/>
      <Setter Property=""Background"" Value=""{DynamicResource Renk1x10}""/>
      <Setter Property=""Foreground"" Value=""{DynamicResource OnRenk1x10}""/>
    </Trigger>
    <Trigger Property=""IsPressed"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Renk1}""/>
    </Trigger>
    <Trigger Property=""IsEnabled"" Value=""False"">
      <Setter Property=""Background"" Value=""Transparent""/>
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Disabled}""/>
      <Setter Property=""Foreground"" Value=""{DynamicResource Disabled}""/>
      <Setter Property=""Cursor"" Value=""No""/>
    </Trigger>
  </Style.Triggers>
</Style>";

        readonly TextBlock baslikYazisi = new();
        readonly TextBlock notEtiketi = new();
        readonly TextBox notKutusu = new() { AcceptsReturn = true, TextWrapping = TextWrapping.Wrap, VerticalContentAlignment = VerticalAlignment.Top, VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
        readonly TextBlock notIpucuYazisi = new() { TextWrapping = TextWrapping.Wrap };
        readonly TextBlock iletisimEtiketi = new();
        readonly TextBox iletisimKutusu = new();
        readonly TextBlock iletisimIpucuYazisi = new() { TextWrapping = TextWrapping.Wrap };
        readonly Button goruntuEkleDugmesi = new();
        readonly Button goruntuKaldirDugmesi = new() { Visibility = Visibility.Collapsed };
        readonly TextBlock goruntuYazisi = new() { TextWrapping = TextWrapping.Wrap, VerticalAlignment = VerticalAlignment.Center };
        readonly TextBlock durumYazisi = new() { TextWrapping = TextWrapping.Wrap, VerticalAlignment = VerticalAlignment.Top };
        readonly Button gonderDugmesi = new() { VerticalAlignment = VerticalAlignment.Top };

        byte[]? goruntu;
        bool mesgul;
        bool hataVar;

        public BizeUlasin()
        {
            var kutu = (Style)XamlReader.Parse(KutuStili);
            var ikincil = (Style)XamlReader.Parse(IkincilStili);
            notKutusu.Style = iletisimKutusu.Style = kutu;
            goruntuEkleDugmesi.Style = goruntuKaldirDugmesi.Style = ikincil;
            gonderDugmesi.SetResourceReference(StyleProperty, "PrimaryButton");
            ToolTipService.SetShowOnDisabled(gonderDugmesi, true);
            baslikYazisi.SetResourceReference(StyleProperty, "H2");
            foreach (var etiket in new[] { notEtiketi, iletisimEtiketi }) etiket.SetResourceReference(StyleProperty, "Label");
            foreach (var ipucu in new[] { notIpucuYazisi, iletisimIpucuYazisi, goruntuYazisi }) ipucu.SetResourceReference(StyleProperty, "Hint");
            durumYazisi.SetResourceReference(TextBlock.FontFamilyProperty, "FontSans");
            durumYazisi.SetResourceReference(TextBlock.FontSizeProperty, "FontSize1");
            durumYazisi.SetResourceReference(TextBlock.ForegroundProperty, "TextBody");
            durumYazisi.MinHeight = Math.Ceiling(Sayi("FontSize1") * Sayi("LineHeightBody") * 2);
            notKutusu.MinHeight = Sayi("InputHeight") * 3;
            AutomationProperties.SetLabeledBy(notKutusu, notEtiketi);
            AutomationProperties.SetLabeledBy(iletisimKutusu, iletisimEtiketi);
            AutomationProperties.SetLiveSetting(durumYazisi, AutomationLiveSetting.Polite);
            AutomationProperties.SetLiveSetting(goruntuYazisi, AutomationLiveSetting.Polite);

            var alanArasi = Sayi("FieldStack");
            var ic = Sayi("FieldGap");
            var yan = Sayi("Space2");
            var yigin = new StackPanel();
            Ekle(yigin, baslikYazisi, alanArasi);
            Ekle(yigin, notEtiketi, ic);
            Ekle(yigin, notKutusu, ic);
            Ekle(yigin, notIpucuYazisi, alanArasi);
            Ekle(yigin, iletisimEtiketi, ic);
            Ekle(yigin, iletisimKutusu, ic);
            Ekle(yigin, iletisimIpucuYazisi, alanArasi);
            var goruntuSirasi = new WrapPanel();
            goruntuEkleDugmesi.Margin = goruntuKaldirDugmesi.Margin = new Thickness(0, 0, yan, 0);
            goruntuSirasi.Children.Add(goruntuEkleDugmesi);
            goruntuSirasi.Children.Add(goruntuKaldirDugmesi);
            goruntuSirasi.Children.Add(goruntuYazisi);
            Ekle(yigin, goruntuSirasi, alanArasi);
            var eylem = new Grid();
            eylem.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            eylem.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            durumYazisi.Margin = new Thickness(0, 0, Sayi("Space3"), 0);
            Grid.SetColumn(gonderDugmesi, 1);
            eylem.Children.Add(durumYazisi);
            eylem.Children.Add(gonderDugmesi);
            yigin.Children.Add(eylem);
            Content = yigin;

            notKutusu.TextChanged += (_, _) => Yenile();
            goruntuEkleDugmesi.Click += async (_, _) => await GoruntuEkle();
            goruntuKaldirDugmesi.Click += (_, _) => GoruntuyuBirak();
            gonderDugmesi.Click += async (_, _) => await Gonder();
            Yenile();
        }

        public string Uygulama { get; set; } = "";
        public string Surum { get; set; } = "";
        public string Platform { get; set; } = RuntimeInformation.OSDescription;
        public string Dil { get; set; } = CultureInfo.CurrentUICulture.Name;
        public BildirimMetinleri Metinler { get; set; } = new();
        public Func<BildirimGirdisi, Task<BildirimSonucu>> Gonderici { get; set; } = g => Bildirim.Gonder(g);
        public Func<(string Ad, byte[] Veri)?>? GoruntuSecici { get; set; }
        public string Not { get => notKutusu.Text; set => notKutusu.Text = value; }

        public event Action<int>? Gonderildi;

        public void MetinleriUygula() => Yenile();

        static double Sayi(string ad) => Application.Current?.TryFindResource(ad) is double d ? d : 0;

        static void Ekle(Panel kap, FrameworkElement oge, double alt)
        {
            oge.Margin = new Thickness(0, 0, 0, alt);
            kap.Children.Add(oge);
        }

        void Yenile()
        {
            var m = Metinler;
            var notVar = !string.IsNullOrWhiteSpace(notKutusu.Text);
            baslikYazisi.Text = m.Baslik;
            notEtiketi.Text = m.Not;
            notIpucuYazisi.Text = m.NotIpucu;
            iletisimEtiketi.Text = m.Iletisim;
            iletisimIpucuYazisi.Text = m.IletisimIpucu;
            goruntuEkleDugmesi.Content = m.GoruntuEkle;
            goruntuKaldirDugmesi.Content = m.GoruntuKaldir;
            goruntuKaldirDugmesi.Visibility = goruntu is null ? Visibility.Collapsed : Visibility.Visible;
            gonderDugmesi.Content = hataVar ? m.YenidenDene : m.Gonder;
            AutomationProperties.SetName(goruntuEkleDugmesi, m.GoruntuEkle);
            AutomationProperties.SetName(goruntuKaldirDugmesi, m.GoruntuKaldir);
            AutomationProperties.SetName(gonderDugmesi, hataVar ? m.YenidenDene : m.Gonder);
            notKutusu.IsEnabled = iletisimKutusu.IsEnabled = !mesgul;
            goruntuEkleDugmesi.IsEnabled = goruntuKaldirDugmesi.IsEnabled = !mesgul;
            gonderDugmesi.IsEnabled = !mesgul && notVar;
            var neden = mesgul ? m.Gonderiliyor : null;
            foreach (var oge in new FrameworkElement[] { notKutusu, iletisimKutusu, goruntuEkleDugmesi, goruntuKaldirDugmesi })
                oge.ToolTip = neden;
            gonderDugmesi.ToolTip = neden ?? (notVar ? null : m.NotGerekli);
        }

        void DurumuYaz(string metin, string firca)
        {
            durumYazisi.SetResourceReference(TextBlock.ForegroundProperty, firca);
            durumYazisi.Text = metin;
        }

        void GoruntuyuBirak()
        {
            goruntu = null;
            goruntuYazisi.Text = "";
            Yenile();
        }

        (string Ad, byte[] Veri)? DosyaSec()
        {
            var pencere = new OpenFileDialog
            {
                Title = Metinler.GoruntuEkle,
                Filter = "*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.webp|*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.webp",
            };
            if (pencere.ShowDialog(Window.GetWindow(this)) != true) return null;
            return (Path.GetFileName(pencere.FileName), File.ReadAllBytes(pencere.FileName));
        }

        async Task GoruntuEkle()
        {
            (string Ad, byte[] Veri)? secilen;
            try { secilen = (GoruntuSecici ?? DosyaSec)(); }
            catch (Exception hata) when (hata is IOException or UnauthorizedAccessException) { secilen = null; }
            if (secilen is null) return;
            var veri = secilen.Value.Veri;
            var kucuk = await Task.Run(() => Goruntu.Kucult(veri));
            goruntu = kucuk;
            goruntuYazisi.Text = kucuk is null
                ? Metinler.GoruntuOlmadi
                : string.Format(CultureInfo.CurrentCulture, Metinler.GoruntuHazir, secilen.Value.Ad);
            Yenile();
        }

        public async Task Gonder()
        {
            if (mesgul || string.IsNullOrWhiteSpace(notKutusu.Text)) return;
            mesgul = true;
            DurumuYaz(Metinler.Gonderiliyor, "TextBody");
            Yenile();
            BildirimSonucu sonuc;
            try
            {
                sonuc = await Gonderici(new BildirimGirdisi(
                    Uygulama, Surum, Platform, Dil, notKutusu.Text, iletisimKutusu.Text, goruntu));
            }
            finally
            {
                mesgul = false;
            }
            hataVar = !sonuc.Tamam;
            if (!sonuc.Tamam)
            {
                DurumuYaz(Metinler.Hata(sonuc.Hata), "DangerText");
                Yenile();
                return;
            }
            DurumuYaz(sonuc.GoruntuEklenemedi ? Metinler.UlastiGoruntusuz : Metinler.Ulasti, "Success");
            notKutusu.Text = "";
            GoruntuyuBirak();
            Gonderildi?.Invoke(sonuc.No);
        }
    }
}
