'use strict';

const fs = require('fs');
const path = require('path');

const dir = __dirname;

const F = {
  'bare-focus.bad.css': `.tk-btn:focus {\n  outline: 2px solid var(--tk-blue);\n}\n`,
  'bare-focus.good.css': `.tk-btn:focus-visible {\n  outline: 2px solid var(--tk-blue);\n}\n.tk-btn:focus:not(:focus-visible) {\n  outline: none;\n}\n`,

  'disabled-opacity.bad.tsx': `export const A = () => <button className="disabled:opacity-30">Kaydet</button>;\n`,
  'disabled-opacity.good.tsx': `export const A = () => <button className="disabled:border-[var(--tk-disabled)]">Kaydet</button>;\n`,

  'empty-accessible-name.bad.tsx': `export const A = () => <button aria-label="">x</button>;\n`,
  'empty-accessible-name.good.tsx': `export const A = () => <button aria-label="Kapat">x</button>;\n`,

  'progress-live-region.bad.tsx': `export const P = () => <div role="progressbar" aria-live="polite" aria-valuenow={40} />;\n`,
  'progress-live-region.good.tsx': `export const P = () => <div role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100} />;\n`,

  'assertive-scope.bad.tsx': `export const S = () => <div aria-live="assertive">Kaydedildi</div>;\n`,
  'assertive-scope.good.tsx': `export const S = () => <div aria-live="assertive">Kayit hatasi</div>;\n`,

  'storyboard-target.bad.xaml': `<Storyboard>\n  <DoubleAnimation Storyboard.TargetProperty="Width" To="120" />\n</Storyboard>\n`,
  'storyboard-target.good.xaml': `<Storyboard>\n  <DoubleAnimation Storyboard.TargetProperty="Opacity" To="1" />\n</Storyboard>\n`,

  'raw-easing.bad.css': `.tk-card {\n  transition: transform var(--tk-t-fast) cubic-bezier(0.2, 0, 0, 1);\n}\n`,
  'raw-easing.good.css': `.tk-card {\n  transition: transform var(--tk-t-fast) var(--tk-e-out);\n}\n`,

  'five-states.bad.css': `[data-tk='cell'] {
  color: var(--tk-text);
}
[data-tk='cell']:hover {
  border-color: var(--tk-border-strong);
}
[data-tk='cell']:disabled {
  color: var(--tk-disabled);
  cursor: not-allowed;
}
`,
  'five-states.good.css': `[data-tk='cell'] {\n  color: var(--tk-text);\n}\n[data-tk='cell']:hover:not(:disabled),\n[data-tk='cell']:focus-visible:not(:disabled) {\n  border-color: var(--tk-border-strong);\n}\n[data-tk='cell']:active:not(:disabled) {\n  border-color: var(--tk-pink);\n  transform: scale(0.98);\n}\n[data-tk='cell']:disabled {\n  color: var(--tk-disabled);\n  cursor: not-allowed;\n}\n`,

  'state-layer-properties.bad.css': `[data-tk='toggle']:hover {\n  border-color: var(--tk-border-strong);\n  padding: 4px;\n}\n`,
  'state-layer-properties.good.css': `[data-tk='toggle']:hover {\n  border-color: var(--tk-border-strong);\n}\n`,

  'state-layer-binding.bad.css': `.tk-toggle:hover {\n  border-color: var(--tk-border-strong);\n}\n`,
  'state-layer-binding.good.css': `[data-tk='toggle']:hover {\n  border-color: var(--tk-border-strong);\n}\n`,

  'hover-without-focus.bad.css': `.tk-chip:hover {\n  border-color: var(--tk-pink);\n}\n`,
  'hover-without-focus.good.css': `.tk-chip:hover,\n.tk-chip:focus-visible {\n  border-color: var(--tk-pink);\n}\n`,

  'pressed-without-carrier.bad.css': `.tk-btn:active {\n  transform: scale(0.98);\n}\n`,
  'pressed-without-carrier.good.css': `.tk-btn:active {\n  transform: scale(0.98);\n  border-color: var(--tk-pink);\n}\n`,

  'state-opacity.bad.css': `.tk-btn:disabled {\n  opacity: 0.3;\n}\n`,
  'state-opacity.good.css': `.tk-btn:disabled {\n  color: var(--tk-disabled);\n  cursor: not-allowed;\n}\n`,

  'disabled-affordance.bad.css': `.tk-btn:disabled {\n  color: var(--tk-disabled);\n}\n`,
  'disabled-affordance.good.css': `.tk-btn:disabled {\n  color: var(--tk-disabled);\n  cursor: not-allowed;\n}\n`,
  'disabled-affordance.bad.tsx': `export const A = () => <button disabled>Kaydet</button>;\n`,
  'disabled-affordance.good.tsx': `export const A = () => <button disabled title="Once bir kaynak sec">Kaydet</button>;\n`,

  'focus-ring-layers.bad.css': `.tk-btn:focus-visible {\n  outline: 2px solid var(--tk-blue);\n  outline-offset: 2px;\n}\n`,
  'focus-ring-layers.good.css': `.tk-btn:focus-visible {\n  outline: 2px solid var(--tk-blue);\n  outline-offset: 2px;\n  box-shadow: 0 0 0 2px #000000;\n}\n`,

  'animated-property.bad.css': `@keyframes tk-grow {\n  from { width: 0; }\n  to { width: 100%; }\n}\n`,
  'animated-property.good.css': `@keyframes tk-grow {\n  from { transform: scaleX(0); }\n  to { transform: scaleX(1); }\n}\n`,

  'infinite-loop-scope.bad.css': `.tk-badge {\n  animation: tk-pulse var(--tk-t-slow) var(--tk-e-out) infinite;\n}\n`,
  'infinite-loop-scope.good.css': `.tk-progress-track {\n  animation: tk-shimmer var(--tk-t-slow) var(--tk-e-out) infinite;\n}\n`,

  'glow-on-repeated-item.bad.css': `.tk-list-row {\n  box-shadow: var(--tk-glow-blue);\n}\n`,
  'glow-on-repeated-item.good.css': `.tk-list {\n  box-shadow: var(--tk-glow-blue);\n}\n`,

  'wpf-shadow-in-item-template.bad.xaml': `<ItemsControl>\n  <ItemsControl.ItemTemplate>\n    <DataTemplate>\n      <Border>\n        <Border.Effect>\n          <DropShadowEffect BlurRadius="20" />\n        </Border.Effect>\n      </Border>\n    </DataTemplate>\n  </ItemsControl.ItemTemplate>\n</ItemsControl>\n`,
  'wpf-shadow-in-item-template.good.xaml': `<ItemsControl>\n  <ItemsControl.ItemTemplate>\n    <DataTemplate>\n      <Border BorderBrush="{StaticResource TkBorder}" />\n    </DataTemplate>\n  </ItemsControl.ItemTemplate>\n</ItemsControl>\n`,

  'avalonia-transform-object.bad.axaml': `<Style Selector="Button:pointerover">\n  <Setter Property="RenderTransform">\n    <ScaleTransform ScaleX="1.02" ScaleY="1.02" />\n  </Setter>\n</Style>\n`,
  'avalonia-transform-object.good.axaml': `<Style Selector="Button:pointerover">\n  <Setter Property="RenderTransform" Value="scale(1.02)" />\n</Style>\n`,

  'backdrop-filter-count.bad.css': `.tk-panel {\n  backdrop-filter: blur(16px);\n}\n.tk-modal {\n  backdrop-filter: blur(16px);\n}\n`,
  'backdrop-filter-count.good.css': `.tk-panel {\n  backdrop-filter: blur(16px);\n}\n.tk-modal {\n  background: var(--tk-glass);\n}\n`,

  'unnamed-interactive.bad.tsx': `export const A = () => (\n  <button>\n    <svg aria-hidden="true" focusable="false" />\n  </button>\n);\n`,
  'unnamed-interactive.good.tsx': `export const A = () => (\n  <button aria-label="Kapat">\n    <svg aria-hidden="true" focusable="false" />\n  </button>\n);\n`,

  'icon-not-hidden.bad.tsx': `export const A = () => (\n  <button aria-label="Kapat">\n    <svg viewBox="0 0 24 24" />\n  </button>\n);\n`,
  'icon-not-hidden.good.tsx': `export const A = () => (\n  <button aria-label="Kapat">\n    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" />\n  </button>\n);\n`,

  'sr-only-display-none.bad.css': `.tk-sr-only {\n  display: none;\n}\n`,
  'sr-only-display-none.good.css': `.tk-sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  overflow: hidden;\n  clip-path: inset(50%);\n}\n`,

  'forced-color-adjust-scope.bad.css': `.tk-btn-primary {\n  forced-color-adjust: none;\n}\n`,
  'forced-color-adjust-scope.good.css': `.tk-color-swatch {\n  forced-color-adjust: none;\n}\n`,

  'wpf-animation-guard.bad.xaml': `<Storyboard RepeatBehavior="Forever">\n  <DoubleAnimation Storyboard.TargetProperty="Opacity" To="1" />\n</Storyboard>\n`,
  'wpf-animation-guard.good.xaml': `<!-- SystemParameters.ClientAreaAnimation is read before this storyboard starts -->\n<Storyboard RepeatBehavior="Forever">\n  <DoubleAnimation Storyboard.TargetProperty="Opacity" To="1" />\n</Storyboard>\n`,

  'hero-glow-forced-colors.bad.css': `.tk-hero {\n  filter: drop-shadow(var(--tk-glow-hero));\n}\n`,
  'hero-glow-forced-colors.good.css': `.tk-hero {\n  filter: drop-shadow(var(--tk-glow-hero));\n}\n@media (forced-colors: active) {\n  .tk-hero {\n    filter: none;\n  }\n}\n`,
};

for (const [name, body] of Object.entries(F))
  fs.writeFileSync(path.join(dir, name), body, 'utf8');

console.log('wrote ' + Object.keys(F).length + ' fixtures');
