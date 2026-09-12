var label = Strings.Get("player.info.resolution", size.Width.ToString(CultureInfo.InvariantCulture) + "x" + size.Height.ToString(CultureInfo.InvariantCulture));
var total = Format("report.total", head.ToString() + tail.ToString());
var shown = Print("report.line", left + right);
