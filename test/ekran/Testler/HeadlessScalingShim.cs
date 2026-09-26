using System.Reflection;
using Avalonia.Controls;

namespace Avalonia.Headless;

public static class HeadlessScalingShim
{
    const BindingFlags Flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;

    public static void SetRenderScaling(this TopLevel topLevel, double scaling)
    {
        var impl = topLevel.PlatformImpl;
        if (impl is null)
            return;
        var type = impl.GetType();
        var property = type.GetProperty("RenderScaling", Flags);
        if (property is { CanWrite: true })
            property.SetValue(impl, scaling);
        else if (type.GetFields(Flags).FirstOrDefault(f => f.FieldType == typeof(double) && f.Name.Contains("RenderScaling", StringComparison.OrdinalIgnoreCase)) is { } field)
            field.SetValue(impl, scaling);
        else
            return;
        if (type.GetProperty("ScalingChanged", Flags)?.GetValue(impl) is Action<double> changed)
            changed(scaling);
    }
}
