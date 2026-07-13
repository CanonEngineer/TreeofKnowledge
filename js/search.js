/* Busca global na Árvore do Conhecimento */
const TreeSearch = (() => {
  const LAYER_LABELS = { root: 'Raiz', module: 'Módulo', file: 'Arquivo', function: 'Função' };

  function activeProjects() {
    return PROJECTS.filter(p => !p.comingSoon);
  }

  function buildIndex() {
    const index = [];
    activeProjects().forEach(project => {
      project.nodes.forEach(node => {
        if (node.layer === 'root') return;
        index.push({
          projectSlug: project.slug,
          projectName: project.name,
          projectColor: project.color,
          nodeId: node.id,
          title: node.title,
          description: node.description || '',
          file: node.file || '',
          code: node.code || '',
          layer: node.layer || 'function',
          haystack: [
            project.name,
            node.title,
            node.description,
            node.file,
            node.code,
            ...(Array.isArray(node.implementation) ? node.implementation : [node.implementation || ''])
          ].join(' ').toLowerCase()
        });
      });
    });
    return index;
  }

  let INDEX = [];

  function ensureIndex() {
    if (!INDEX.length && typeof PROJECTS !== 'undefined') INDEX = buildIndex();
    return INDEX;
  }

  function nodeUrl(projectSlug, nodeId) {
    return AppConfig.nodePageUrl(projectSlug, nodeId);
  }

  function search(query, limit = 12) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const index = ensureIndex();
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];

    index.forEach(item => {
      let score = 0;
      terms.forEach(term => {
        if (item.title.toLowerCase().includes(term)) score += 10;
        if (item.file.toLowerCase().includes(term)) score += 8;
        if (item.projectName.toLowerCase().includes(term)) score += 5;
        if (item.description.toLowerCase().includes(term)) score += 4;
        if (item.code.toLowerCase().includes(term)) score += 3;
        if (item.haystack.includes(term)) score += 1;
      });
      if (score > 0) scored.push({ ...item, score });
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
  }

  function fileBaseName(path) {
    if (!path) return '';
    const parts = String(path).split(/[/\\]/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : path;
  }

  function mount(inputEl, resultsEl) {
    if (!inputEl || !resultsEl) return;
    let debounce;

    function renderResults(results, query) {
      if (!results.length) {
        resultsEl.innerHTML =
          '<div class="search-confirm">' +
          '<span class="search-confirm-label">Busca</span>' +
          '<strong class="search-confirm-file">' + highlight(query, query) + '</strong>' +
          '<span class="search-confirm-path">Nenhum arquivo correspondente</span>' +
          '</div>' +
          '<div class="search-empty">Nenhum resultado para "<strong>' + query + '</strong>"</div>';
        resultsEl.classList.remove('hidden');
        return;
      }

      const top = results[0];
      const confirmFile = fileBaseName(top.file) || top.title;
      const confirmPath = top.file || top.title;

      const header =
        '<div class="search-confirm">' +
        '<span class="search-confirm-label">Arquivo</span>' +
        '<strong class="search-confirm-file">' + highlight(confirmFile, query) + '</strong>' +
        '<span class="search-confirm-path">' + highlight(confirmPath, query) + '</span>' +
        '</div>';

      const items = results.map((r) => {
        const fileName = fileBaseName(r.file) || r.title;
        const pathLine = r.file || r.title;
        return (
          '<a class="search-result-item" href="' + nodeUrl(r.projectSlug, r.nodeId) + '">' +
          '<span class="search-result-layer" style="border-color:' + r.projectColor + '">' +
          (LAYER_LABELS[r.layer] || r.layer) +
          '</span>' +
          '<strong class="search-result-file">' + highlight(fileName, query) + '</strong>' +
          '<span class="search-result-title">' + highlight(r.title, query) + '</span>' +
          '<span class="search-result-meta">' + r.projectName + ' · ' + highlight(pathLine, query) + '</span>' +
          '<span class="search-result-snippet">' +
          highlight(r.description.slice(0, 90), query) +
          (r.description.length > 90 ? '…' : '') +
          '</span>' +
          '</a>'
        );
      }).join('');

      resultsEl.innerHTML = header + items;
      resultsEl.classList.remove('hidden');
    }

    inputEl.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = inputEl.value.trim();
      if (q.length < 2) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
        return;
      }
      debounce = setTimeout(() => renderResults(search(q), q), 150);
    });

    inputEl.addEventListener('focus', () => {
      const q = inputEl.value.trim();
      if (q.length >= 2) renderResults(search(q), q);
    });

    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
        resultsEl.classList.add('hidden');
      }
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        resultsEl.classList.add('hidden');
        inputEl.blur();
      }
    });
  }

  function findNode(projectSlug, nodeId) {
    if (typeof PROJECTS === 'undefined') return null;
    const project = PROJECTS.find(p => p.slug === projectSlug);
    if (!project) return null;
    const node = project.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    return { project, node };
  }

  return { search, mount, nodeUrl, findNode, activeProjects, ensureIndex };
})();
