// teknesyum-ui template durum/electron/badge.js
const LABELS = {
  waiting: 'Bağlanıyor…',
  syncing: 'Eşitleniyor…',
  synced: 'Eşitlendi',
  offline: 'Çevrimdışı',
  local: 'Yalnız bu bilgisayar',
  now: 'Şimdi eşitle',
};

function clock(at) {
  return new Date(at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function mountSyncBadge(host, labels = LABELS) {
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'tk-sync';
  badge.title = labels.now;
  badge.setAttribute('aria-live', 'polite');
  const render = (s) => {
    badge.dataset.state = s.state;
    badge.classList.toggle('tk-sync-progress', s.state === 'syncing');
    const timed = (s.state === 'synced' || s.state === 'offline') && s.at;
    badge.textContent = timed ? labels[s.state] + ' · ' + clock(s.at) : labels[s.state];
  };
  badge.addEventListener('click', () => window.sync.now());
  window.sync.onChange(render);
  window.sync.state().then(render);
  host.append(badge);
  return badge;
}

const VERSION_LABELS = {
  check: 'Güncellemeleri denetle',
  current: (version) => 'Güncel sürümdesiniz (' + version + ')',
  error: (reason) => 'Güncelleme denetlenemedi' + (reason ? ': ' + reason : ''),
  install: 'Kur',
  later: 'Sonra',
};

const TOAST_MAX = 3;

function toastStack() {
  let stack = document.querySelector('.tk-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'tk-toast-stack';
    document.body.append(stack);
  }
  return stack;
}

function showToast(text, tone, ms, actions = []) {
  const toast = document.createElement('div');
  toast.className = 'tk-toast tk-toast-' + tone;
  toast.setAttribute('role', 'status');
  toast.append(text);
  const close = () => toast.remove();
  for (const [label, run] of actions) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tk-btn tk-btn-ghost';
    b.textContent = label;
    b.addEventListener('click', () => {
      close();
      run();
    });
    toast.append(b);
  }
  const stack = toastStack();
  stack.append(toast);
  while (stack.children.length > TOAST_MAX) stack.firstElementChild.remove();
  if (ms) setTimeout(close, ms);
  return toast;
}

export function mountVersionButton(host, { version, confirm = false, labels = VERSION_LABELS, toastMs = 6000 }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tk-version';
  button.textContent = version;
  button.title = labels.check;
  button.setAttribute('aria-label', labels.check);
  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-busy') === 'true') return;
    button.setAttribute('aria-busy', 'true');
    try {
      const found = await window.update.check();
      if (found.state === 'current') showToast(labels.current(version), 'success', toastMs);
      else if (found.state === 'error') showToast(labels.error(found.message), 'danger', toastMs);
      else if (confirm) {
        const note = found.notes ? '\n' + found.notes : '';
        showToast((found.latest || '') + note, 'warning', 0, [
          [labels.install, () => window.update.install(found)],
          [labels.later, () => {}],
        ]);
      } else window.update.install(found);
    } catch (e) {
      showToast(labels.error(e && e.message ? e.message : String(e)), 'danger', toastMs);
    } finally {
      button.removeAttribute('aria-busy');
    }
  });
  host.append(button);
  return button;
}
