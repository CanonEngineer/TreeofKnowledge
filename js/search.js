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

  const INDEX = buildIndex();

  function nodeUrl(projectSlug, nodeId) {
    return `node.html?p=${encodeURIComponent(projectSlug)}&n=${encodeURIComponent(nodeId)}`;
  }

  function search(query, limit = 12) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];

    INDEX.forEach(item => {
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

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  function mount(inputEl, resultsEl) {
    if (!inputEl || !resultsEl) return;

    let debounce;

    function renderResults(results, query) {
      if (!results.length) {
        resultsEl.innerHTML = `<div class="search-empty">Nenhum resultado para "<strong>${query}</strong>"</div>`;
        resultsEl.classList.remove('hidden');
        return;
      }

      resultsEl.innerHTML = results.map(r => `
        <a class="search-result-item" href="${nodeUrl(r.projectSlug, r.nodeId)}">
          <span class="search-result-layer" style="border-color:${r.projectColor}">${LAYER_LABELS[r.layer] || r.layer}</span>
          <strong>${highlight(r.title, query)}</strong>
          <span class="search-result-meta">${r.projectName} · ${r.file}</span>
          <span class="search-result-snippet">${highlight(r.description.slice(0, 90), query)}${r.description.length > 90 ? '…' : ''}</span>
        </a>
      `).join('');
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
    const project = PROJECTS.find(p => p.slug === projectSlug);
    if (!project) return null;
    const node = project.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    return { project, node };
  }

  return { search, mount, nodeUrl, findNode, activeProjects, INDEX };
})();
