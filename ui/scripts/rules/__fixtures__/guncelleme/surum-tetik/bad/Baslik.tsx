export function Baslik({ version }: { version: string }) {
  return (
    <header>
      <span className="surum">v{version}</span>
    </header>
  );
}
