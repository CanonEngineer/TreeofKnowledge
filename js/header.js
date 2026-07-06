/* Header — data/hora dinâmica */
(() => {
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function updateDateTime() {
    const now = new Date();
    const iso = now.toISOString();
    const dateLine = capitalize(now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));
    const timeLine = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    document.querySelectorAll('#header-datetime, .header-datetime').forEach(el => {
      el.innerHTML = '<span class="dt-date">' + dateLine + '</span><span class="dt-time">' + timeLine + '</span>';
      if (el.tagName === 'TIME') el.setAttribute('datetime', iso);
    });
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);
})();
