# test/ekran

Headless Avalonia 11.3.20 harness for the Avalonia shell templates in `ui/templates`.
Templates are filled at build time by `Sablon.targets` (`{{AD}}` -> `Ekran`,
`{{PENCERE}}` -> `SinamaPenceresi`) into `obj/sablon/`; the theme is regenerated
from `ui/templates/neon.tokens.json` with `ui/scripts/generate.js`.

- Screenshots: `dotnet run --project test/ekran/Ekran.csproj`
  writes 5 PNGs (dinlenik, hover, basili, odak, edilgen) and `kirpma.txt`
  to `ui/templates/{ustcubuk,durum,kur}/avalonia/ekran/`. Exit code 1 on any overflow.
- Tests: `dotnet test test/ekran/Testler` runs `KabukTests` and `KontrastTests`.
- `App.cs` registers an `ITransform` animator; the generated theme animates
  `RenderTransform` and crashes without it.
- `Testler/HeadlessScalingShim.cs` is copied from DustyBytes for `SetRenderScaling`.
