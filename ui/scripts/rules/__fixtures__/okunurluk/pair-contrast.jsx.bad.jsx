export function SaveBar({ onSave }) {
  return (
    <div className="flex gap-2">
      <button className="rounded bg-sky-300 px-4 text-blue-800" onClick={onSave}>
        Kaydet
      </button>
    </div>
  );
}
