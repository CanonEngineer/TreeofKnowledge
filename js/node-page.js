/* Página dedicada do nó */
(() => {
  const params = new URLSearchParams(window.location.search);
  const projectSlug = params.get('p');
  const nodeId = params.get('n');

  const LAYER_LABELS = { root: 'Raiz', module: 'Módulo', file: 'Arquivo', function: 'Função' };
  const LAYER_COLORS = { root: '#fbbf24', module: '#38bdf8', file: '#c084fc', function: '#34d399' };

  TreeSearch.mount(
    document.getElementById('global-search'),
    document.getElementById('search-results')
  );

  const data = TreeSearch.findNode(projectSlug, nodeId);

  if (!data) {
    document.querySelector('.node-page').innerHTML =
      '<div class="node-error"><h2>Nó não encontrado</h2>' +
      '<p>Projeto: ' + (projectSlug || '?') + ' · Nó: ' + (nodeId || '?') + '</p>' +
      '<a href="' + AppConfig.indexUrl() + '" class="btn-primary">← Voltar</a></div>';
    return;
  }

  const { project, node } = data;

  if (project.comingSoon) {
    document.querySelector('.node-page').innerHTML =
      '<div class="node-error"><h2>' + project.name + '</h2>' +
      '<p>Este projeto será mapeado em breve.</p>' +
      '<a href="' + AppConfig.indexUrl() + '" class="btn-primary">← Voltar</a></div>';
    return;
  }

  document.title = node.title + ' — ' + project.name + ' | Tree of Knowledge';

  const treeBack = AppConfig.indexUrl('tree=' + encodeURIComponent(project.slug));
  document.getElementById('btn-back-tree').href = treeBack;

  const crumbEl = document.getElementById('node-breadcrumb');
  const fileBase = (node.file || '').split(/[/\\]/).filter(Boolean).pop() || '';
  const crumbShort = fileBase && fileBase !== node.title
    ? project.name + ' › ' + fileBase
    : project.name + ' › ' + node.title;
  const crumbFull = project.name + ' › ' + (node.file || node.title);
  crumbEl.textContent = crumbShort;
  crumbEl.title = crumbFull;

  document.getElementById('node-repo-link').href = project.repoUrl;

  const badge = document.getElementById('node-project-badge');
  badge.textContent = project.name;
  badge.style.borderColor = project.color;

  const layerBadge = document.getElementById('node-layer-badge');
  layerBadge.textContent = LAYER_LABELS[node.layer] || node.layer;
  layerBadge.style.background = LAYER_COLORS[node.layer] || project.color;

  document.getElementById('node-title').textContent = node.title;
  document.getElementById('node-file').textContent = node.file || '';
  document.getElementById('node-desc').textContent = node.description || '';
  document.getElementById('node-code').textContent = node.code || '';

  const implEl = document.getElementById('node-impl');
  if (Array.isArray(node.implementation)) {
    implEl.innerHTML = '<ol>' + node.implementation.map(s => '<li>' + s + '</li>').join('') + '</ol>';
  } else {
    implEl.textContent = node.implementation || '';
  }

  const siblings = document.getElementById('sibling-links');
  project.nodes
    .filter(n => n.id !== node.id && n.layer !== 'root')
    .forEach(n => {
      const a = document.createElement('a');
      a.href = AppConfig.nodePageUrl(project.slug, n.id);
      a.className = 'sibling-link';
      a.innerHTML = '<span class="sibling-layer">' + (LAYER_LABELS[n.layer] || n.layer) + '</span>' + n.title;
      siblings.appendChild(a);
    });
})();
