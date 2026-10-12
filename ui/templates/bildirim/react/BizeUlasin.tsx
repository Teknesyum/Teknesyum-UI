// teknesyum-ui template bildirim/react/BizeUlasin.tsx
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { sendFeedback, shrinkImage, type FeedbackFailure, type FeedbackInput, type FeedbackResult } from './bildirim';
import './bizeulasin.css';

export type BizeUlasinLabels = {
  title: string;
  note: string;
  noteHint: string;
  contact: string;
  contactHint: string;
  addImage: string;
  removeImage: string;
  imageReady: (name: string) => string;
  imageFailed: string;
  send: string;
  retry: string;
  sending: string;
  noteNeeded: string;
  unavailable: string;
  sent: string;
  sentNoImage: string;
  failed: Record<FeedbackFailure, string>;
};

export const BIZE_ULASIN_LABELS: BizeUlasinLabels = {
  title: 'Bize ulaşın',
  note: 'Notun',
  noteHint: 'Ne oldu, ne bekliyordun?',
  contact: 'Sana nasıl ulaşalım?',
  contactHint: 'İsteğe bağlı. Yazmazsan yanıt veremeyiz.',
  addImage: 'Görüntü ekle',
  removeImage: 'Görüntüyü kaldır',
  imageReady: (name) => 'Eklenecek: ' + name,
  imageFailed: 'Bu görüntü küçültülemedi, eklenmedi.',
  send: 'Gönder',
  retry: 'Yeniden dene',
  sending: 'Gönderiliyor…',
  noteNeeded: 'Göndermek için önce notunu yaz.',
  unavailable: 'Bildirim şu an gönderilemiyor.',
  sent: 'Bildirimin ulaştı, teşekkürler.',
  sentNoImage: 'Bildirimin ulaştı; görüntü eklenemedi.',
  failed: {
    network: 'Gönderilemedi: internet bağlantısı kurulamadı. Notun duruyor, yeniden deneyebilirsin.',
    auth: 'Gönderilemedi: bu sürümün bildirim anahtarı geçersiz. Uygulamayı güncelle, sonra yeniden dene.',
    forbidden: 'Gönderilemedi: GitHub isteği geri çevirdi. Notun duruyor, biraz sonra yeniden dene.',
    server: 'Gönderilemedi: GitHub şu an yanıt vermiyor. Notun duruyor, biraz sonra yeniden dene.',
  },
};

type Props = {
  app: string;
  version: string;
  anahtar: readonly string[];
  platform?: string;
  lang?: string;
  labels?: BizeUlasinLabels;
  disabled?: boolean;
  send?: (input: FeedbackInput, key: readonly string[]) => Promise<FeedbackResult>;
  onSent?: (number: number) => void;
};

type Status = { kind: 'idle' | 'sending' | 'sent' | 'failed'; text: string };

export function BizeUlasin({
  app,
  version,
  anahtar,
  platform = navigator.userAgent,
  lang = document.documentElement.lang || navigator.language,
  labels = BIZE_ULASIN_LABELS,
  disabled = false,
  send = sendFeedback,
  onSent,
}: Props): ReactElement {
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [image, setImage] = useState<{ name: string; blob: Blob } | null>(null);
  const [imageNote, setImageNote] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' });
  const busy = status.kind === 'sending';
  const off = disabled || busy;
  const why = busy ? labels.sending : disabled ? labels.unavailable : undefined;

  const pick = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const blob = await shrinkImage(file);
    setImage(blob ? { name: file.name, blob } : null);
    setImageNote(blob ? labels.imageReady(file.name) : labels.imageFailed);
  };

  const drop = (): void => {
    setImage(null);
    setImageNote('');
  };

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (busy || !note.trim()) return;
    setStatus({ kind: 'sending', text: labels.sending });
    const result = await send({ app, version, platform, lang, note, contact, image: image?.blob ?? null }, anahtar);
    if (!result.ok) {
      setStatus({ kind: 'failed', text: labels.failed[result.reason] });
      return;
    }
    setStatus({ kind: 'sent', text: result.imageFailed ? labels.sentNoImage : labels.sent });
    setNote('');
    drop();
    onSent?.(result.number);
  };

  return (
    <form className="tk-feedback" aria-labelledby={id + '-title'} onSubmit={submit}>
      <h2 className="tk-h2" id={id + '-title'}>
        {labels.title}
      </h2>
      <div className="tk-field">
        <label className="tk-label" htmlFor={id + '-note'}>
          {labels.note}
        </label>
        <textarea
          className="tk-input tk-feedback__note"
          id={id + '-note'}
          value={note}
          aria-invalid={false}
          aria-describedby={id + '-note-hint'}
          required
          disabled={off}
          title={why}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="tk-hint" id={id + '-note-hint'}>
          {labels.noteHint}
        </p>
      </div>
      <div className="tk-field">
        <label className="tk-label" htmlFor={id + '-contact'}>
          {labels.contact}
        </label>
        <input
          className="tk-input"
          id={id + '-contact'}
          type="text"
          autoComplete="email"
          value={contact}
          aria-invalid={false}
          aria-describedby={id + '-contact-hint'}
          disabled={off}
          title={why}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className="tk-hint" id={id + '-contact-hint'}>
          {labels.contactHint}
        </p>
      </div>
      <div className="tk-feedback__image">
        <input ref={picker} type="file" accept="image/*" hidden tabIndex={-1} onChange={pick} />
        <button type="button" className="tk-btn" disabled={off} title={why} onClick={() => picker.current?.click()}>
          {labels.addImage}
        </button>
        {image ? (
          <button type="button" className="tk-btn tk-btn-ghost" disabled={off} title={why} onClick={drop}>
            {labels.removeImage}
          </button>
        ) : null}
        <p className="tk-hint tk-feedback__image-note" aria-live="polite">
          {imageNote}
        </p>
      </div>
      <div className="tk-feedback__actions">
        <p className="tk-feedback__status" data-kind={status.kind} role="status" aria-live="polite">
          {status.text}
        </p>
        <button type="submit" className="tk-btn tk-btn-primary" disabled={off || !note.trim()} title={why ?? (note.trim() ? undefined : labels.noteNeeded)}>
          {status.kind === 'failed' ? labels.retry : labels.send}
        </button>
      </div>
    </form>
  );
}
