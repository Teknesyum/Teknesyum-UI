export const Rows = ({ items }: { items: string[] }) => (
  <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
);
