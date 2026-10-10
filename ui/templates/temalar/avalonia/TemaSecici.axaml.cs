// teknesyum-ui template temalar/avalonia/TemaSecici.axaml.cs
#nullable enable
using System;
using System.Collections.Generic;
using Avalonia;
using Avalonia.Automation;
using Avalonia.Controls;
using Avalonia.Controls.Shapes;
using Avalonia.Layout;
using Avalonia.Markup.Xaml;
using Avalonia.Media;
using Avalonia.Media.Immutable;
using Avalonia.Styling;

namespace {{AD}}.Kabuk
{
    public partial class TemaSecici : UserControl
    {
        public static readonly StyledProperty<string> SeciliMetniProperty =
            AvaloniaProperty.Register<TemaSecici, string>(nameof(SeciliMetni), "seçili");

        readonly Dictionary<string, (Button dugme, Control isaret)> kartlar = new();

        public string SeciliMetni { get => GetValue(SeciliMetniProperty); set => SetValue(SeciliMetniProperty, value); }

        public event Action<Tema>? Secildi;

        public TemaSecici()
        {
            Resources["TemaHalka"] = Halka();
            AvaloniaXamlLoader.Load(this);
            var kap = this.FindControl<WrapPanel>("Kap")!;
            var bosluk = Sayi("Space2");
            var genislik = Sayi("SidebarCollapsedWidth") + Sayi("TitleBarHeightMax") * 2;
            foreach (var tema in Temalar.Liste)
            {
                var kart = Kart(tema);
                kart.MinWidth = genislik;
                kart.Margin = new Thickness(0, 0, bosluk, bosluk);
                kap.Children.Add(kart);
            }
            Isaretle();
            AttachedToVisualTree += (_, _) => Temalar.Degisti += Degisti;
            DetachedFromVisualTree += (_, _) => Temalar.Degisti -= Degisti;
        }

        void Degisti(Tema tema)
        {
            Resources["TemaHalka"] = Halka();
            Isaretle();
        }

        Button Kart(Tema tema)
        {
            var metin = Firca(tema.Al("text"));
            var nokta = Sayi("Space2");
            var noktalar = new StackPanel { Orientation = Orientation.Horizontal, Spacing = Sayi("Space1"), VerticalAlignment = VerticalAlignment.Center };
            foreach (var ad in new[] { "renk-1", "renk-2", "renk-3" })
                noktalar.Children.Add(new Ellipse { Width = nokta, Height = nokta, Fill = Firca(tema.Al(ad)) });
            var adi = new TextBlock { Text = tema.Ad, VerticalAlignment = VerticalAlignment.Center };
            var isaret = new Avalonia.Controls.Shapes.Path
            {
                Data = Geometry.Parse("M1,5 L4,8 L10,1"),
                Stroke = metin,
                StrokeThickness = Sayi("FocusWidth"),
                StrokeLineCap = PenLineCap.Round,
                StrokeJoin = PenLineJoin.Round,
                VerticalAlignment = VerticalAlignment.Center,
                Opacity = 0,
            };
            var ic = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*,Auto"), ColumnSpacing = Sayi("Space2") };
            Grid.SetColumn(adi, 1);
            Grid.SetColumn(isaret, 2);
            ic.Children.Add(noktalar);
            ic.Children.Add(adi);
            ic.Children.Add(isaret);
            var dugme = new Button
            {
                Theme = (ControlTheme)Resources["TemaKarti"]!,
                Background = Firca(tema.Al("black")),
                Foreground = metin,
                Content = ic,
            };
            ToolTip.SetTip(dugme, tema.Ad);
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
            foreach (var (id, (dugme, isaret)) in kartlar)
            {
                var bu = id == secili;
                dugme.Classes.Set("secili", bu);
                isaret.Opacity = bu ? 1 : 0;
                var ad = ToolTip.GetTip(dugme)?.ToString() ?? id;
                AutomationProperties.SetName(dugme, bu ? ad + ", " + SeciliMetni : ad);
            }
        }

        static IBrush Firca(TemaRengi c) => new ImmutableSolidColorBrush(Color.FromArgb(c.Alfa, c.R, c.G, c.B));

        static double Sayi(string ad) =>
            Application.Current?.TryFindResource(ad, out var v) == true && v is double d ? d : 0;

        static BoxShadows Halka()
        {
            var renk = Application.Current?.TryFindResource("Renk1", out var v) == true && v is ISolidColorBrush f ? f.Color : Colors.Transparent;
            return new BoxShadows(new BoxShadow { Spread = Sayi("FocusWidth"), Color = renk });
        }
    }
}
