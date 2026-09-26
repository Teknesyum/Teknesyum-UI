using Avalonia;
using Avalonia.Animation;
using Avalonia.Markup.Xaml;
using Avalonia.Media.Transformation;

namespace Fixture;

public class App : Application
{
    public override void Initialize()
    {
        Animation.RegisterCustomAnimator<ITransform, TransformAnimator>();
        AvaloniaXamlLoader.Load(this);
    }
}

public sealed class TransformAnimator : InterpolatingAnimator<ITransform>
{
    public override ITransform Interpolate(double progress, ITransform oldValue, ITransform newValue) =>
        TransformOperations.Interpolate(oldValue as TransformOperations ?? TransformOperations.Identity,
            newValue as TransformOperations ?? TransformOperations.Identity, progress);
}
