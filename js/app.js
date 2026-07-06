/* App — galeria, árvore, busca */
(() => {
  const $ = (s) => document.querySelector(s);
  const gallery = $('#gallery');
  const treeView = $('#tree-view');
  const projectGrid = $('#project-grid');
  const treeNodes = $('#tree-nodes');
  const treeLines = $('#tree-lines');
  const treeScene = $('#tree-scene');
  const tooltip = $('#tooltip');
  let currentProject = null;
  let nodeMap = new Map();

  const ICONS = {
    python: '🐍', django: '🍕', javascript: '⚡', node: '🖥️', cpp: '⚙️', scanner: '🔍'
  };

  TreeSearch.mount($('#global-search'), $('#search-results'));

  function initGallery() {
    projectGrid.innerHTML = '';
    PROJECTS.forEach(p => {
      const card = document.createElement('article');
      card.className = 'project-card' + (p.comingSoon ? ' project-card-soon' : '');
      card.style.setProperty('--card-color', p.color);
      card.innerHTML =
        '<div class="project-card-icon">' + (ICONS[p.icon] || '📦') + '</div>' +
        '<h3>' + p.name + '</h3>' +
        '<p>' + (p.comingSoon ? 'Mapeamento em breve — disponível amanhã.' : p.summary) + '</p>' +
        '<div class="project-card-meta">' +
        '<span>' + (p.comingSoon ? 'Em breve' : p.nodes.length + ' nós') + '</span>' +
        '<span>' + p.stack + '</span></div>';
      if (!p.comingSoon) card.addEventListener('click', () => openTree(p));
      projectGrid.appendChild(card);
    });
  }

  function renderTree() {
    TreeRenderer.render(treeNodes, treeLines, currentProject.nodes, currentProject.color, currentProject.slug);
    bindNodeEvents();
  }

  function openTree(project) {
    if (project.comingSoon) return;
    currentProject = project;
    nodeMap = new Map(project.nodes.map(n => [n.id, n]));
    gallery.classList.add('hidden');
    treeView.classList.remove('hidden');
    history.replaceState(null, '', AppConfig.indexUrl('tree=' + encodeURIComponent(project.slug)));
    $('#tree-project-name').textContent = project.name;
    $('#tree-node-count').textContent = project.nodes.length + ' nós de código';
    $('#tree-repo-link').href = project.repoUrl;
    renderTree();
  }

  function closeTree() {
    treeView.classList.add('hidden');
    gallery.classList.remove('hidden');
    currentProject = null;
    hideTooltip();
    history.replaceState(null, '', AppConfig.indexUrl());
  }

  function bindNodeEvents() {
    treeNodes.querySelectorAll('.tree-node').forEach(el => {
      const node = nodeMap.get(el.dataset.id);
      if (!node) return;
      el.addEventListener('mouseenter', (e) => showTooltip(e, node));
      el.addEventListener('mousemove', (e) => moveTooltip(e));
      el.addEventListener('mouseleave', hideTooltip);
    });
  }

  function showTooltip(e, node) {
    $('#tooltip-title').textContent = node.title;
    $('#tooltip-desc').textContent = node.layer === 'root'
      ? node.description
      : node.description + ' — Clique para abrir a página do código.';
    $('#tooltip-file').textContent = node.file || '';
    tooltip.classList.remove('hidden');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const pad = 16;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - pad;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    tooltip.classList.add('hidden');
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const treeSlug = params.get('tree');
    if (treeSlug) {
      const project = PROJECTS.find(p => p.slug === treeSlug && !p.comingSoon);
      if (project) openTree(project);
    }
  }

  $('#btn-back').addEventListener('click', closeTree);

  window.addEventListener('resize', () => {
    if (currentProject) renderTree();
  });

  initGallery();
  restoreFromUrl();
})();
