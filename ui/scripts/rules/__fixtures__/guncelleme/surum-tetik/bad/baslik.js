const el = document.createElement('span');
el.textContent = `v${app.version}`;
document.querySelector('header').append(el);
