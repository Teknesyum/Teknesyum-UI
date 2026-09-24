export function SaveBar({ onSave, busy }) {
  const list = items.filter((a) => a < 3);
  return (
    <div className="flex gap-2 bg-black text-white">
      <button className="rounded bg-sky-300 px-4 text-black hover:bg-sky-400" onClick={onSave}>
        Kaydet
      </button>
      <button className="bg-sky-300 text-blue-800" disabled>
        Kapalı
      </button>
    </div>
  );
}
