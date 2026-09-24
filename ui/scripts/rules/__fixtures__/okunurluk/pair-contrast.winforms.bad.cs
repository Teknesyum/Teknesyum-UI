using System.Drawing;
using System.Windows.Forms;

static class Tokens
{
    public const string SoftBlue = "#6FA8DC";
    public const string InkBlue = "#1F4E79";
}

static class Palette
{
    public static readonly Color SoftBlue = ColorTranslator.FromHtml(Tokens.SoftBlue);
    public static readonly Color InkBlue = ColorTranslator.FromHtml(Tokens.InkBlue);
}

class SaveButton : Button
{
    bool _hover;

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        if (_hover)
        {
            using var fill = new SolidBrush(Color.FromArgb(230, Palette.SoftBlue));
            g.FillRectangle(fill, ClientRectangle);
        }
        TextRenderer.DrawText(g, Text, Font, ClientRectangle, _hover ? Palette.InkBlue : Color.White);
    }
}

class Banner : Form
{
    Label Build() => new Label { BackColor = Palette.SoftBlue, ForeColor = Palette.InkBlue, Text = "Kaydet" };
}
