# Primary action visibility rehearsal

A static scan cannot see layout. AmeliyatListesi v0.2.0 shipped a 640x500 installer window
whose primary button had scrolled off the bottom edge — the scanner found nothing, `tsc` was
clean, the headless install passed 5/5. None of that proves the window is usable; only
looking at the real, rendered window does.

Run this in the real window (the built app, not a `?demo` route in a browser tab sized to
guess the window's dimensions) after taking the screenshot the report requires:

```js
const btn = document.querySelector('[data-primary-action]');
const box = btn.getBoundingClientRect();
const inner = { width: window.innerWidth, height: window.innerHeight };
const visible =
  box.top >= 0 && box.left >= 0 && box.bottom <= inner.height && box.right <= inner.width;
console.log(visible ? 'primary action is inside the window' : 'primary action is clipped', {
  box,
  inner,
});
```

Notes:

- `window.innerWidth` / `innerHeight` is the window's *inner* size — the content area after
  frame and title bar are subtracted. A config value like `640x500` is the *outer* size; do
  not compare the button's box against it.
- Mark the primary button with `data-primary-action` (or swap the selector) so this snippet
  does not depend on copy or class names.
- Run it once at 100% OS scale, then again at 125% and 150%. Text wraps sooner and controls
  grow at higher scale; a button that fits at 100% can clip at 150% on the same window.
- This checks one box. It does not replace the walk-through in `ui-duzeni.md` → Doğrulama
  (every tab, every state, keyboard navigation, language switch) — it is the one measurement
  that catches the specific failure of "compiles clean, ships unusable."
