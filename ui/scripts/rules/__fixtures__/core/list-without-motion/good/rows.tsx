export const Rows = ({ items }: { items: string[] }) => (
  <ul className="transition-[transform]">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);
