using Avalonia;
using Avalonia.Markup.Xaml;

namespace Fixture;

public class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }
}
