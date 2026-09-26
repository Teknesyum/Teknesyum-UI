using Avalonia;
using Avalonia.Animation;
using Avalonia.Media;
using Avalonia.Media.Transformation;
using Avalonia.Markup.Xaml.Styling;
using Avalonia.Styling;
using Avalonia.Themes.Fluent;

namespace Ekran;

public class App : Application
{
    public override void Initialize()
    {
        Animation.RegisterCustomAnimator<ITransform, DonusumAnimatoru>();
        RequestedThemeVariant = ThemeVariant.Dark;
        Styles.Add(new FluentTheme());
        Styles.Add(new StyleInclude(new Uri("avares://Ekran/")) { Source = new Uri("avares://Ekran/Tema/Theme.axaml") });
        Styles.Add(new StyleInclude(new Uri("avares://Ekran/")) { Source = new Uri("avares://Ekran/Kabuk/KabukStilleri.axaml") });
    }
}

public sealed class DonusumAnimatoru : InterpolatingAnimator<ITransform>
{
    public override ITransform Interpolate(double progress, ITransform oldValue, ITransform newValue) =>
        TransformOperations.Interpolate(oldValue as TransformOperations ?? TransformOperations.Identity,
            newValue as TransformOperations ?? TransformOperations.Identity, progress);
}
