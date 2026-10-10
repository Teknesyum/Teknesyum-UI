import { ScaleSwitch } from '../teknesyum-ui/ustcubuk/ScaleSwitch';

export const Zoom = ({ scale, onChange }: { scale: number; onChange: (n: number) => void }) => <ScaleSwitch scale={scale} onChange={onChange} />;
