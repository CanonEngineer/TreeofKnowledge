/* App — galeria, árvore, busca e zoom */
(() => {
  const $ = (s) => document.querySelector(s);
  const gallery = $('#gallery');
  const treeView = $('#tree-view');
  const projectGrid = $('#project-grid');
  const treeNodes = $('#tree-nodes');
  const treeLines = $('#tree-lines');
  const treeScene = $('#tree-scene');
  const treeStage = $('#tree-stage');
  const treeZoomSpace = $('#tree-zoom-space');
  const tooltip = $('#tooltip');
  const zoomLabel = $('#tree-zoom-label');
  const btnZoomIn = $('#btn-zoom-in');
  const btnZoomOut = $('#btn-zoom-out');
  const treeSceneWrap = $('#tree-scene-wrap');
  const btnTreeFullscreen = $('#btn-tree-fullscreen');
  const treeFsBar = $('#tree-fs-bar');
  const treeFsName = $('#tree-fs-name');
  const btnTreeFsExit = $('#btn-tree-fs-exit');

  let currentProject = null;
  let nodeMap = new Map();
  let zoom = 1;
  let fitOverviewOnRender = false;

  const ZOOM_INITIAL = 0.35;
  const ZOOM_MIN = 0.35;
  const ZOOM_MAX = 1;
  const ZOOM_STEP = 0.15;

  const ICONS = {
    python: '🐍', django: '🍕', javascript: '⚡', node: '🖥️', cpp: '⚙️',
    scanner: '🔍', php: '🐘', html: '🌐'
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

  function clampZoom(value) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  }

  function centerTreeInView() {
    const baseW = parseFloat(treeStage.dataset.baseWidth) || treeStage.offsetWidth;
    const baseH = parseFloat(treeStage.dataset.baseHeight) || treeStage.offsetHeight;
    const viewW = treeScene.clientWidth;
    const viewH = treeScene.clientHeight;
    treeScene.scrollLeft = Math.max(0, (baseW * zoom - viewW) / 2);
    treeScene.scrollTop = Math.max(0, (baseH * zoom - viewH) / 2);
  }

  /** 35% padrão; se o grafo for enorme, reduz só o necessário para caber tudo */
  function computeOverviewZoom() {
    const baseW = parseFloat(treeStage.dataset.baseWidth) || treeStage.offsetWidth;
    const baseH = parseFloat(treeStage.dataset.baseHeight) || treeStage.offsetHeight;
    const viewW = treeScene.clientWidth;
    const viewH = treeScene.clientHeight;
    if (!baseW || !baseH || !viewW || !viewH) return ZOOM_INITIAL;
    const fitZoom = Math.min(viewW / baseW, viewH / baseH) * 0.92;
    if (fitZoom >= ZOOM_INITIAL) return ZOOM_INITIAL;
    return clampZoom(Math.max(0.12, fitZoom));
  }

  function restoreOverview() {
    zoom = computeOverviewZoom();
    applyZoom(zoom, false);
    centerTreeInView();
  }

  function isTreeFullscreen() {
    return document.fullscreenElement === treeSceneWrap;
  }

  function updateFullscreenUi() {
    const on = isTreeFullscreen();
    if (btnTreeFullscreen) {
      btnTreeFullscreen.textContent = on ? '⤓' : '⤢';
      btnTreeFullscreen.title = on ? 'Sair da tela cheia' : 'Tela cheia da árvore';
      btnTreeFullscreen.setAttribute('aria-label', btnTreeFullscreen.title);
    }
    if (treeFsBar) {
      treeFsBar.classList.toggle('hidden', !on);
      treeFsBar.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (treeFsName && currentProject) {
      treeFsName.textContent = currentProject.name;
    }
  }

  async function toggleTreeFullscreen() {
    if (!treeSceneWrap || !currentProject) return;
    try {
      if (!isTreeFullscreen()) {
        await treeSceneWrap.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      /* navegador bloqueou ou API indisponível */
    }
  }

  async function exitTreeFullscreen() {
    if (isTreeFullscreen()) {
      try {
        await document.exitFullscreen();
      } catch (_) { /* ignore */ }
    }
  }

  function applyZoom(nextZoom, keepCenter = true, pointer = null) {
    const prev = zoom;
    zoom = clampZoom(nextZoom);

    const baseW = parseFloat(treeStage.dataset.baseWidth || treeStage.style.width) || treeStage.offsetWidth;
    const baseH = parseFloat(treeStage.dataset.baseHeight || treeStage.style.height) || treeStage.offsetHeight;

    const viewW = treeScene.clientWidth;
    const viewH = treeScene.clientHeight;
    const centerX = treeScene.scrollLeft + viewW / 2;
    const centerY = treeScene.scrollTop + viewH / 2;
    const contentX = centerX / prev;
    const contentY = centerY / prev;

    treeStage.style.transformOrigin = '0 0';
    treeStage.style.transform = zoom === 1 ? 'none' : 'scale(' + zoom + ')';
    treeZoomSpace.style.width = Math.max(baseW * zoom, viewW) + 'px';
    treeZoomSpace.style.height = Math.max(baseH * zoom, viewH) + 'px';

    if (pointer) {
      const rect = treeScene.getBoundingClientRect();
      const localX = pointer.x - rect.left + treeScene.scrollLeft;
      const localY = pointer.y - rect.top + treeScene.scrollTop;
      const px = localX / prev;
      const py = localY / prev;
      treeScene.scrollLeft = px * zoom - (pointer.x - rect.left);
      treeScene.scrollTop = py * zoom - (pointer.y - rect.top);
    } else if (keepCenter) {
      treeScene.scrollLeft = contentX * zoom - viewW / 2;
      treeScene.scrollTop = contentY * zoom - viewH / 2;
    }

    zoomLabel.textContent = Math.round(zoom * 100) + '%';
    btnZoomOut.disabled = zoom <= ZOOM_MIN + 0.001;
    btnZoomIn.disabled = zoom >= ZOOM_MAX - 0.001;
  }

  function renderTree() {
    requestAnimationFrame(() => {
      TreeRenderer.render(treeNodes, treeLines, currentProject.nodes, currentProject.color, currentProject.slug);
      if (fitOverviewOnRender) {
        zoom = computeOverviewZoom();
        fitOverviewOnRender = false;
      }
      applyZoom(zoom, false);
      centerTreeInView();
      bindNodeEvents();
    });
  }

  function openTree(project) {
    if (project.comingSoon) return;
    currentProject = project;
    nodeMap = new Map(project.nodes.map(n => [n.id, n]));
    zoom = ZOOM_INITIAL;
    fitOverviewOnRender = true;
    gallery.classList.add('hidden');
    treeView.classList.remove('hidden');
    history.replaceState(null, '', AppConfig.indexUrl('tree=' + encodeURIComponent(project.slug)));
    $('#tree-project-name').textContent = project.name;
    $('#tree-node-count').textContent = project.nodes.length + ' nós de código';
    $('#tree-repo-link').href = project.repoUrl;
    const demoLink = $('#tree-demo-link');
    if (project.demoUrl) {
      demoLink.href = project.demoUrl;
      demoLink.classList.remove('hidden');
    } else {
      demoLink.removeAttribute('href');
      demoLink.classList.add('hidden');
    }
    const galaxyLink = $('#tree-galaxy-link');
    if (galaxyLink) {
      galaxyLink.href = 'galaxy/index.html?project=' + encodeURIComponent(project.slug);
      galaxyLink.classList.remove('hidden');
    }
    renderTree();
  }

  function closeTree() {
    exitTreeFullscreen();
    treeView.classList.add('hidden');
    gallery.classList.remove('hidden');
    currentProject = null;
    zoom = 1;
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
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    const rect = tooltip.getBoundingClientRect();
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + rect.width > window.innerWidth - 8) x = Math.max(8, e.clientX - rect.width - pad);
    if (y + rect.height > window.innerHeight - 8) y = Math.max(8, e.clientY - rect.height - pad);
    if (x < 8) x = 8;
    if (y < 8) y = 8;
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
  btnZoomIn.addEventListener('click', () => applyZoom(zoom + ZOOM_STEP));
  btnZoomOut.addEventListener('click', () => applyZoom(zoom - ZOOM_STEP));

  $('#btn-zoom-reset')?.addEventListener('click', restoreOverview);

  btnTreeFullscreen?.addEventListener('click', toggleTreeFullscreen);
  btnTreeFsExit?.addEventListener('click', exitTreeFullscreen);

  treeScene?.addEventListener('wheel', (e) => {
    if (!currentProject) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    applyZoom(zoom + step, false, { x: e.clientX, y: e.clientY });
  }, { passive: false });

  treeSceneWrap?.addEventListener('fullscreenchange', () => {
    updateFullscreenUi();
    if (!currentProject) return;
    requestAnimationFrame(() => restoreOverview());
  });

  window.addEventListener('resize', () => {
    if (currentProject) {
      fitOverviewOnRender = false;
      renderTree();
    }
  });

  initGallery();
  restoreFromUrl();
})();
