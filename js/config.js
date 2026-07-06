/* Base path — GitHub Pages /TreeofKnowledge/ */
const AppConfig = (() => {
  function getBase() {
    const path = window.location.pathname;
    const marker = '/TreeofKnowledge';
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      return path.substring(0, idx + marker.length) + '/';
    }
    if (path.endsWith('/')) return path;
    if (path.endsWith('.html')) return path.substring(0, path.lastIndexOf('/') + 1);
    return path + '/';
  }

  function nodePageUrl(projectSlug, nodeId) {
    return getBase() + 'node.html?p=' + encodeURIComponent(projectSlug) + '&n=' + encodeURIComponent(nodeId);
  }

  function indexUrl(query) {
    return getBase() + 'index.html' + (query ? '?' + query : '');
  }

  return { getBase, nodePageUrl, indexUrl };
})();
