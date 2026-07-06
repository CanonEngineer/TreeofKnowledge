/* Header — data/hora dinâmica */
(() => {
  function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const text = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    const iso = now.toISOString();
    document.querySelectorAll('#header-datetime, .header-datetime').forEach(el => {
      el.textContent = text;
      if (el.tagName === 'TIME') el.setAttribute('datetime', iso);
    });
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);
})();
