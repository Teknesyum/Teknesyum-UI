const LABELS = { syncing: 'Eşitleniyor…', synced: 'Eşitlendi', offline: 'Çevrimdışı', now: 'Şimdi eşitle' };

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
    badge.textContent = s.state === 'synced' && s.at ? labels.synced + ' · ' + clock(s.at) : labels[s.state];
  };
  badge.addEventListener('click', () => window.sync.now());
  window.sync.onChange(render);
  window.sync.state().then(render);
  host.append(badge);
  return badge;
}
