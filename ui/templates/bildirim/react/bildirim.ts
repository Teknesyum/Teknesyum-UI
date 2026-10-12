// teknesyum-ui template bildirim/react/bildirim.ts
const ADRES = 'https://api.github.com/repos/{{DEPO}}/issues';
const IMAGE_MAX_BYTES = 150 * 1024;
const IMAGE_MAX_EDGE = 1600;
const IMAGE_MIN_EDGE = 320;
const QUALITIES = [0.85, 0.7, 0.55, 0.4] as const;

export type FeedbackInput = {
  app: string;
  version: string;
  platform: string;
  lang: string;
  note: string;
  contact?: string;
  image?: Blob | null;
};

export type FeedbackFailure = 'network' | 'auth' | 'forbidden' | 'server';

export type FeedbackResult =
  | { ok: true; number: number; imageFailed: boolean }
  | { ok: false; reason: FeedbackFailure };

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export function feedbackTitle(app: string, note: string): string {
  return app + ': ' + note.replace(/\s+/g, ' ').trim().slice(0, 70);
}

export function feedbackBody(input: FeedbackInput): string {
  const lines = [
    input.note.trim(),
    '',
    '- Sürüm: ' + input.version,
    '- Platform: ' + input.platform,
    '- Dil: ' + input.lang,
  ];
  const contact = (input.contact ?? '').trim();
  if (contact) lines.push('- İletişim: ' + contact);
  return lines.join('\n');
}

export function imageComment(base64: string): string {
  return ['<details><summary>Görüntü</summary>', '', '```teknesyum-goruntu image/jpeg', base64, '```', '', '</details>'].join('\n');
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function shrinkImage(source: Blob): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    return null;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let edge = Math.min(IMAGE_MAX_EDGE, Math.max(bitmap.width, bitmap.height));
  const floor = Math.min(IMAGE_MIN_EDGE, edge);
  while (edge >= floor && edge > 0) {
    const scale = edge / Math.max(bitmap.width, bitmap.height);
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      const blob = await toJpeg(canvas, quality);
      if (blob && blob.size <= IMAGE_MAX_BYTES) return blob;
    }
    edge = Math.floor(edge * 0.75);
  }
  return null;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
    reader.readAsDataURL(blob);
  });
}

function failure(status: number): FeedbackFailure {
  if (status === 401) return 'auth';
  if (status === 403 || status === 404 || status === 422 || status === 429) return 'forbidden';
  return 'server';
}

export async function sendFeedback(
  input: FeedbackInput,
  key: readonly string[],
  fetcher: Fetcher = (url, init) => fetch(url, init),
): Promise<FeedbackResult> {
  const headers = {
    Authorization: 'Bearer ' + key.join(''),
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  let number: number;
  try {
    const res = await fetcher(ADRES, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: feedbackTitle(input.app, input.note),
        body: feedbackBody(input),
        labels: ['bildirim', 'app:' + input.app.toLocaleLowerCase('en-US')],
      }),
    });
    if (!res.ok) return { ok: false, reason: failure(res.status) };
    number = Number(((await res.json()) as { number?: number }).number);
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!input.image) return { ok: true, number, imageFailed: false };
  try {
    const res = await fetcher(ADRES + '/' + number + '/comments', {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: imageComment(await toBase64(input.image)) }),
    });
    return { ok: true, number, imageFailed: !res.ok };
  } catch {
    return { ok: true, number, imageFailed: true };
  }
}
