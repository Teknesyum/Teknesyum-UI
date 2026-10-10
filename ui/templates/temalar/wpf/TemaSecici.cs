// teknesyum-ui template temalar/wpf/TemaSecici.cs
#nullable enable
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Shapes;

namespace {{AD}}.Kabuk
{
    public class TemaSecici : UserControl
    {
        const string KartStili = @"
<Style xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation""
       xmlns:x=""http://schemas.microsoft.com/winfx/2006/xaml""
       TargetType=""Button"">
  <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderDefault}""/>
  <Setter Property=""BorderThickness"" Value=""{DynamicResource BorderWidth}""/>
  <Setter Property=""Padding"" Value=""{DynamicResource InputPadding}""/>
  <Setter Property=""MinHeight"" Value=""{DynamicResource InputHeight}""/>
  <Setter Property=""FontFamily"" Value=""{DynamicResource FontSans}""/>
  <Setter Property=""FontSize"" Value=""{DynamicResource FontSize1}""/>
  <Setter Property=""FontWeight"" Value=""{DynamicResource WeightBody}""/>
  <Setter Property=""Cursor"" Value=""Hand""/>
  <Setter Property=""HorizontalContentAlignment"" Value=""Stretch""/>
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
          <ContentPresenter VerticalAlignment=""Center""/>
        </Border>
      </ControlTemplate>
    </Setter.Value>
  </Setter>
  <Style.Triggers>
    <Trigger Property=""IsMouseOver"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderStrong}""/>
    </Trigger>
    <Trigger Property=""IsKeyboardFocused"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource BorderStrong}""/>
    </Trigger>
    <Trigger Property=""Tag"" Value=""secili"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Renk1}""/>
      <Setter Property=""FontWeight"" Value=""{DynamicResource WeightSemi}""/>
    </Trigger>
    <Trigger Property=""IsPressed"" Value=""True"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Renk1}""/>
    </Trigger>
    <Trigger Property=""IsEnabled"" Value=""False"">
      <Setter Property=""BorderBrush"" Value=""{DynamicResource Disabled}""/>
      <Setter Property=""Cursor"" Value=""No""/>
    </Trigger>
  </Style.Triggers>
</Style>";

        readonly Dictionary<string, (Button dugme, UIElement isaret)> kartlar = new();

        public string SeciliMetni { get; set; } = "seçili";

        public event Action<Tema>? Secildi;

        public TemaSecici()
        {
            var stil = (Style)XamlReader.Parse(KartStili);
            var kap = new WrapPanel();
            var bosluk = Sayi("Space2");
            var genislik = Sayi("SidebarCollapsedWidth") + Sayi("TitleBarHeightMax") * 2;
            foreach (var tema in Temalar.Liste)
            {
                var kart = Kart(tema, stil);
                kart.MinWidth = genislik;
                kart.Margin = new Thickness(0, 0, bosluk, bosluk);
                kap.Children.Add(kart);
            }
            Content = kap;
            Isaretle();
            Loaded += (_, _) => Temalar.Degisti += Degisti;
            Unloaded += (_, _) => Temalar.Degisti -= Degisti;
        }

        void Degisti(Tema tema) => Isaretle();

        Button Kart(Tema tema, Style stil)
        {
            var metin = Firca(tema.Al("text"));
            var nokta = Sayi("Space2");
            var noktalar = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            foreach (var ad in new[] { "renk-1", "renk-2", "renk-3" })
                noktalar.Children.Add(new Ellipse { Width = nokta, Height = nokta, Fill = Firca(tema.Al(ad)), Margin = new Thickness(0, 0, Sayi("Space1"), 0) });
            var adi = new TextBlock { Text = tema.Ad, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(Sayi("Space1"), 0, Sayi("Space2"), 0) };
            var isaret = new Path
            {
                Data = Geometry.Parse("M1,5 L4,8 L10,1"),
                Stroke = metin,
                StrokeThickness = Sayi("FocusWidth"),
                StrokeStartLineCap = PenLineCap.Round,
                StrokeEndLineCap = PenLineCap.Round,
                StrokeLineJoin = PenLineJoin.Round,
                VerticalAlignment = VerticalAlignment.Center,
                Opacity = 0,
            };
            var ic = new Grid();
            ic.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            ic.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            ic.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            Grid.SetColumn(adi, 1);
            Grid.SetColumn(isaret, 2);
            ic.Children.Add(noktalar);
            ic.Children.Add(adi);
            ic.Children.Add(isaret);
            var dugme = new Button
            {
                Style = stil,
                Background = Firca(tema.Al("black")),
                Foreground = metin,
                Content = ic,
                ToolTip = tema.Ad,
            };
            dugme.Click += (_, _) =>
            {
                var secilen = Temalar.Uygula(tema.Id);
                if (secilen is not null) Secildi?.Invoke(secilen);
            };
            kartlar[tema.Id] = (dugme, isaret);
            return dugme;
        }

        void Isaretle()
        {
            var secili = string.IsNullOrEmpty(Temalar.Secili) && Temalar.Liste.Count > 0 ? Temalar.Liste[0].Id : Temalar.Secili;
            var ince = Application.Current?.TryFindResource("BorderWidth") is Thickness t ? t.Left : 0;
            var kalin = Sayi("FocusWidth");
            var dolgu = Application.Current?.TryFindResource("InputPadding") is Thickness p ? p : default;
            foreach (var (id, (dugme, isaret)) in kartlar)
            {
                var bu = id == secili;
                dugme.Tag = bu ? "secili" : null;
                isaret.Opacity = bu ? 1 : 0;
                if (bu && kalin > ince)
                {
                    var fark = kalin - ince;
                    dugme.BorderThickness = new Thickness(kalin);
                    dugme.Padding = new Thickness(Math.Max(0, dolgu.Left - fark), Math.Max(0, dolgu.Top - fark), Math.Max(0, dolgu.Right - fark), Math.Max(0, dolgu.Bottom - fark));
                }
                else
                {
                    dugme.ClearValue(Control.BorderThicknessProperty);
                    dugme.ClearValue(Control.PaddingProperty);
                }
                var ad = dugme.ToolTip?.ToString() ?? id;
                AutomationProperties.SetName(dugme, bu ? ad + ", " + SeciliMetni : ad);
            }
        }

        static Brush Firca(TemaRengi c)
        {
            var firca = new SolidColorBrush(Color.FromArgb(c.Alfa, c.R, c.G, c.B));
            firca.Freeze();
            return firca;
        }

        static double Sayi(string ad) => Application.Current?.TryFindResource(ad) is double d ? d : 0;
    }
}
