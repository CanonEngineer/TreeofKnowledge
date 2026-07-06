/* App — galeria, árvore, tooltip, modal */
(() => {
  const $ = (s) => document.querySelector(s);
  const gallery = $('#gallery');
  const treeView = $('#tree-view');
  const projectGrid = $('#project-grid');
  const treeNodes = $('#tree-nodes');
  const treeLines = $('#tree-lines');
  const treeScene = $('#tree-scene');
  const treeStage = $('#tree-stage');
  const tooltip = $('#tooltip');
  let currentProject = null;
  let nodeMap = new Map();

  const ICONS = {
    python: '🐍', django: '🍕', javascript: '⚡', node: '🖥️', cpp: '⚙️', scanner: '🔍'
  };

  function initGallery() {
    PROJECTS.forEach(p => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.style.setProperty('--card-color', p.color);
      card.innerHTML = `
        <div class="project-card-icon">${ICONS[p.icon] || '📦'}</div>
        <h3>${p.name}</h3>
        <p>${p.summary}</p>
        <div class="project-card-meta">
          <span>${p.nodes.length} nós</span>
          <span>${p.stack}</span>
        </div>`;
      card.addEventListener('click', () => openTree(p));
      projectGrid.appendChild(card);
    });
  }

  function openTree(project) {
    currentProject = project;
    nodeMap = new Map(project.nodes.map(n => [n.id, n]));
    gallery.classList.add('hidden');
    treeView.classList.remove('hidden');
    $('#tree-project-name').textContent = project.name;
    $('#tree-node-count').textContent = `${project.nodes.length} nós de código`;
    const link = $('#tree-repo-link');
    link.href = project.repoUrl;
    TreeRenderer.render(treeNodes, treeLines, project.nodes, project.color);
    bindNodeEvents();
    initParallax();
  }

  function closeTree() {
    treeView.classList.add('hidden');
    gallery.classList.remove('hidden');
    currentProject = null;
    hideTooltip();
  }

  function bindNodeEvents() {
    treeNodes.querySelectorAll('.tree-node').forEach(el => {
      const node = nodeMap.get(el.dataset.id);
      if (!node) return;
      el.addEventListener('mouseenter', (e) => showTooltip(e, node));
      el.addEventListener('mousemove', (e) => moveTooltip(e));
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('click', () => openModal(node));
    });
  }

  function showTooltip(e, node) {
    $('#tooltip-title').textContent = node.title;
    $('#tooltip-desc').textContent = node.description;
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

  function openModal(node) {
    hideTooltip();
    $('#modal-title').textContent = node.title;
    $('#modal-file').textContent = node.file || '';
    $('#modal-desc').textContent = node.description;
    $('#modal-code').textContent = node.code || '';
    const impl = $('#modal-impl');
    if (Array.isArray(node.implementation)) {
      impl.innerHTML = '<ol>' + node.implementation.map(s => `<li>${s}</li>`).join('') + '</ol>';
    } else {
      impl.textContent = node.implementation || '';
    }
    $('#modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('#modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function initParallax() {
    treeScene.onmousemove = (e) => {
      const rect = treeScene.getBoundingClientRect();
      const rx = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      const ry = ((e.clientX - rect.left) / rect.width - 0.5) * -8;
      treeStage.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    treeScene.onmouseleave = () => { treeStage.style.transform = ''; };
  }

  $('#btn-back').addEventListener('click', closeTree);
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-close-bottom').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', (e) => {
    if (e.target === $('#modal-overlay')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  window.addEventListener('resize', () => {
    if (!currentProject) return;
    TreeRenderer.render(treeNodes, treeLines, currentProject.nodes, currentProject.color);
    bindNodeEvents();
  });

  initGallery();
})();
