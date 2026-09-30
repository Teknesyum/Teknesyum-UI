// teknesyum-ui template durum/avalonia/SurumDugmesi.cs
#nullable enable
using System;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Automation;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Presenters;
using Avalonia.Controls.Primitives;
using Avalonia.Controls.Primitives.PopupPositioning;
using Avalonia.Controls.Templates;
using Avalonia.Layout;
using Avalonia.Markup.Xaml.MarkupExtensions;
using Avalonia.Media;
using Avalonia.Styling;
using Avalonia.Threading;

namespace {{AD}}.Kabuk
{
    public enum SurumDurumu
    {
        Guncel,
        Var,
        Hata
    }

    public sealed record SurumSonucu(SurumDurumu Durum, string Surum = "", string Notlar = "", string Mesaj = "");

    public sealed class SurumDugmesi : Button
    {
        public static readonly StyledProperty<string> SurumProperty =
            AvaloniaProperty.Register<SurumDugmesi, string>(nameof(Surum), "");
        public static readonly StyledProperty<string> DenetleMetniProperty =
            AvaloniaProperty.Register<SurumDugmesi, string>(nameof(DenetleMetni), "Güncellemeleri denetle");
        public static readonly StyledProperty<string> GuncelMetniProperty =
            AvaloniaProperty.Register<SurumDugmesi, string>(nameof(GuncelMetni), "Güncel sürümdesiniz");
        public static readonly StyledProperty<string> HataMetniProperty =
            AvaloniaProperty.Register<SurumDugmesi, string>(nameof(HataMetni), "Güncelleme denetlenemedi");

        public string Surum { get => GetValue(SurumProperty); set => SetValue(SurumProperty, value); }
        public string DenetleMetni { get => GetValue(DenetleMetniProperty); set => SetValue(DenetleMetniProperty, value); }
        public string GuncelMetni { get => GetValue(GuncelMetniProperty); set => SetValue(GuncelMetniProperty, value); }
        public string HataMetni { get => GetValue(HataMetniProperty); set => SetValue(HataMetniProperty, value); }
        public bool OnayIste { get; set; }
        public Func<Task<SurumSonucu>>? Denetle { get; set; }
        public Func<SurumSonucu, Task>? Kur { get; set; }
        public Func<SurumSonucu, Task<bool>>? Sor { get; set; }

        readonly Popup bildirim = new()
        {
            Placement = PlacementMode.AnchorAndGravity,
            PlacementAnchor = PopupAnchor.BottomRight,
            PlacementGravity = PopupGravity.TopLeft,
            IsLightDismissEnabled = false
        };
        readonly DispatcherTimer zaman = new();
        bool calisiyor;

        public SurumDugmesi()
        {
            Background = Brushes.Transparent;
            BorderThickness = default;
            Padding = default;
            Cursor = new Avalonia.Input.Cursor(Avalonia.Input.StandardCursorType.Hand);
            Template = new FuncControlTemplate<SurumDugmesi>((d, _) => new ContentPresenter
            {
                Name = "PART_Icerik",
                [!ContentPresenter.ContentProperty] = d[!ContentProperty],
                [!TextElement.ForegroundProperty] = d[!ForegroundProperty],
                VerticalContentAlignment = VerticalAlignment.Center
            });
            Styles.Add(Kural(null, "LabelVersionBrush"));
            Styles.Add(Kural(":pointerover", "Renk1"));
            Styles.Add(Kural(":focus-visible", "Renk1"));
            ToolTip.SetTip(this, DenetleMetni);
            AutomationProperties.SetName(this, DenetleMetni);
            zaman.Tick += (_, _) => Kapat();
            LogicalChildren.Add(bildirim);
        }

        static Style Kural(string? durum, string firca)
        {
            var stil = new Style(x => durum is null ? x.OfType<SurumDugmesi>() : x.OfType<SurumDugmesi>().Class(durum));
            stil.Setters.Add(new Setter(ForegroundProperty, new DynamicResourceExtension(firca)));
            if (durum is null)
            {
                stil.Setters.Add(new Setter(FontSizeProperty, new DynamicResourceExtension("LabelVersionSize")));
                stil.Setters.Add(new Setter(FontWeightProperty, new DynamicResourceExtension("LabelVersionWeight")));
                stil.Setters.Add(new Setter(FontFamilyProperty, new DynamicResourceExtension("FontSans")));
                stil.Setters.Add(new Setter(MinHeightProperty, new DynamicResourceExtension("TargetMin")));
                stil.Setters.Add(new Setter(MinWidthProperty, new DynamicResourceExtension("TargetMin")));
            }
            else
                stil.Setters.Add(new Setter(TextBlock.TextDecorationsProperty, TextDecorations.Underline));
            return stil;
        }

        protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
        {
            base.OnPropertyChanged(change);
            if (change.Property == SurumProperty)
                Content = Surum;
            if (change.Property == DenetleMetniProperty)
            {
                ToolTip.SetTip(this, DenetleMetni);
                AutomationProperties.SetName(this, DenetleMetni);
            }
        }

        protected override async void OnClick()
        {
            base.OnClick();
            if (calisiyor || Denetle is null)
                return;
            calisiyor = true;
            try
            {
                var s = await Denetle();
                if (s.Durum == SurumDurumu.Guncel)
                    Goster(GuncelMetni + " (" + Surum + ")");
                else if (s.Durum == SurumDurumu.Hata)
                    Goster(string.IsNullOrWhiteSpace(s.Mesaj) ? HataMetni : HataMetni + ": " + s.Mesaj);
                else if ((!OnayIste || Sor is null || await Sor(s)) && Kur is not null)
                    await Kur(s);
            }
            catch (Exception e)
            {
                Goster(HataMetni + ": " + e.Message);
            }
            finally
            {
                calisiyor = false;
            }
        }

        void Goster(string metin)
        {
            var app = Application.Current;
            bildirim.PlacementTarget = TopLevel.GetTopLevel(this);
            bildirim.HorizontalOffset = app?.TryFindResource("ToastInset", out var h) == true && h is double a ? -a : 0;
            bildirim.VerticalOffset = app?.TryFindResource("ToastInset", out var v) == true && v is double b ? -b : 0;
            var kutu = new Border
            {
                Width = app?.TryFindResource("ToastWidth", out var w) == true && w is double c ? c : 360,
                Child = new TextBlock { Text = metin, TextWrapping = TextWrapping.Wrap }
            };
            if (app?.TryFindResource("Panel", out var t) == true && t is ControlTheme tema)
                kutu.Theme = tema;
            AutomationProperties.SetLiveSetting(kutu, AutomationLiveSetting.Polite);
            bildirim.Child = kutu;
            bildirim.IsOpen = true;
            zaman.Interval = app?.TryFindResource("ToastLife", out var l) == true && l is TimeSpan s ? s : TimeSpan.FromSeconds(6);
            zaman.Stop();
            zaman.Start();
        }

        void Kapat()
        {
            zaman.Stop();
            bildirim.IsOpen = false;
        }
    }
}
