export function baslatSenkron(esitle: () => void, rozet: { textContent: string }) {
  setInterval(() => {
    rozet.textContent = 'senkronize ediliyor';
    esitle();
  }, 60000);
}
