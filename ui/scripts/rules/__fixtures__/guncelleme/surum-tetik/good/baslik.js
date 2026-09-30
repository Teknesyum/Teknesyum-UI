const button = document.createElement('button');
button.type = 'button';
button.textContent = `v${app.version}`;
button.setAttribute('aria-label', 'Güncellemeleri denetle');
button.addEventListener('click', () => window.update.check());
document.querySelector('header').append(button);
