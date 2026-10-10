export const Zoom = ({ scale }: { scale: number }) => (
  <div className="app-scale" role="group">
    <button type="button">−</button>
    <span>{Math.round(scale * 100)}%</span>
    <button type="button">+</button>
  </div>
);
