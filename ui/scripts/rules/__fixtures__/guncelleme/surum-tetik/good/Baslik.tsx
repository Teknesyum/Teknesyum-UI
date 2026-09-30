export function Baslik({ version, onCheck }: { version: string; onCheck: () => void }) {
  return (
    <header>
      <button type="button" className="tk-version" aria-label="Güncellemeleri denetle" onClick={onCheck}>
        v{version}
      </button>
    </header>
  );
}
