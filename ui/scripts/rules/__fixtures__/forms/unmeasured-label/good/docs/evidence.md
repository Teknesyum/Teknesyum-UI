# Evidence

The shell association was read back verbatim:

```
HKEY_CURRENT_USER\Software\Classes\Teknesyum.VidShrink.Video\DefaultIcon  ->  (Default) = C:\...\VidShrink.exe,0
Toast life default is 6000 ms.
```

The stream was probed with `ffprobe -v error -of default=nw=1 input.mp4`, and the
raw flag appears unquoted as well: -of default=nw=1 over 3 streams.
