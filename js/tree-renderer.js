/* Tree Renderer — layout radial escalável para árvores grandes */
const TreeRenderer = (() => {
  function buildTree(nodes) {
    const map = new Map();
    nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
    const root = nodes.find(n => !n.parent);
    nodes.forEach(n => {
      if (n.parent && map.has(n.parent)) map.get(n.parent).children.push(map.get(n.id));
    });
    return root ? map.get(root.id) : null;
  }

  function maxDepth(node, d = 0) {
    if (!node.children || !node.children.length) return d;
    return Math.max(...node.children.map(c => maxDepth(c, d + 1)));
  }

  function countNodes(node) {
    let c = 1;
    (node.children || []).forEach(ch => { c += countNodes(ch); });
    return c;
  }

  function getRings(nodeCount, depth, rect) {
    const scale = Math.min(rect.width, rect.height) / 900;
    const base = 140 * Math.max(scale, 0.75);
    const spread = nodeCount > 15 ? 1.35 : nodeCount > 10 ? 1.2 : 1;
    return {
      module: base * spread,
      file: base * 1.75 * spread,
      function: base * 2.35 * spread,
      default: base * spread
    };
  }

  function layoutNode(node, angle, depth, positions, cx, cy, rings) {
    positions.set(node.id, { x: cx, y: cy, node, depth });
    const children = node.children || [];
    if (!children.length) return;

    const childLayer = children[0].layer || 'function';
    const radius = rings[childLayer] || rings.default;
    const depthFactor = 0.55 + depth * 0.22;
    const r = radius * depthFactor;

    if (children.length === 1) {
      layoutNode(children[0], angle, depth + 1, positions, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, rings);
      return;
    }

    const arc = Math.min(Math.PI * 1.6, Math.PI * 0.35 * children.length + 0.5);
    const start = angle - arc / 2;
    const step = arc / (children.length - 1);

    children.forEach((child, i) => {
      const a = start + step * i;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      layoutNode(child, a, depth + 1, positions, x, y, rings);
    });
  }

  function render(container, linesEl, nodes, projectColor, projectSlug) {
    container.innerHTML = '';
    linesEl.innerHTML = '';
    const tree = buildTree(nodes);
    if (!tree) return;

    const scene = container.parentElement.parentElement;
    const rect = scene.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const nodeCount = countNodes(tree);
    const depth = maxDepth(tree);
    const rings = getRings(nodeCount, depth, rect);

    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, cx, cy, rings);

    positions.forEach((pos) => {
      const n = pos.node;
      if (!n.parent) return;
      const parent = positions.get(n.parent);
      if (!parent) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parent.x);
      line.setAttribute('y1', parent.y);
      line.setAttribute('x2', pos.x);
      line.setAttribute('y2', pos.y);
      line.setAttribute('stroke', projectColor || '#38bdf8');
      line.setAttribute('stroke-opacity', '0.3');
      linesEl.appendChild(line);
    });

    const dense = nodeCount > 14;

    positions.forEach((pos) => {
      const n = pos.node;
      const isRoot = n.layer === 'root';
      const el = document.createElement(isRoot ? 'div' : 'a');
      el.className = 'tree-node' + (dense ? ' tree-node-dense' : '');
      el.dataset.id = n.id;
      el.dataset.layer = n.layer || 'function';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      const z = isRoot ? 80 : n.layer === 'module' ? 50 : n.layer === 'file' ? 30 : 10;
      el.style.zIndex = z;

      if (!isRoot) {
        el.href = AppConfig.nodePageUrl(projectSlug, n.id);
        el.title = n.title + ' — ' + (n.file || '');
      } else {
        el.style.cursor = 'default';
      }

      const inner = document.createElement('span');
      inner.className = 'tree-node-inner';
      const maxLen = dense ? 10 : 14;
      inner.textContent = n.title.length > maxLen ? n.title.slice(0, maxLen - 1) + '…' : n.title;
      el.appendChild(inner);
      container.appendChild(el);
    });

    return positions;
  }

  return { render, buildTree, countNodes };
})();
