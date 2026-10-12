# test/wpf

WPF harness for the runtime theme templates in `ui/templates/temalar/wpf`.
Templates are filled by `../ekran/Sablon.targets` (`{{AD}}` -> `WpfSinama`); the theme is
regenerated from `ui/templates/neon.tokens.json` with `ui/scripts/generate.js`.

- Run: `dotnet run --project test/wpf/Wpf.csproj`. Windows only.
- It loads `Theme.xaml` and `States.xaml` as compiled pages, shows an off-screen window,
  applies a light theme, a dark theme and the standard one, and writes
  `tema-{standart,acik,koyu}.png` to `ui/templates/temalar/wpf/ekran/`.
- The last line reads `tema: N tema, acik=... degisti=True ... standarta dondu=True`;
  exit code 1 when a brush does not change or does not come back.
- The feedback form (`ui/templates/bildirim/wpf`) sends through a stub with the fake key in
  `BildirimAnahtar.cs` and writes `dinlenik`, `hata`, `ulasti` PNGs; last line `bildirim: ... tamam=True`.
- `Forms.xaml` is left out: it does not compile on its own (`MC1000` at the
  `StaticResource` alias on line 5).
