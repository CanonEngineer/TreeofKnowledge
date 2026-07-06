/* Tree Renderer — layout radial 3D */
const TreeRenderer = (() => {
  const RINGS = { module: 160, file: 280, function: 400 };

  function buildTree(nodes) {
    const map = new Map();
    nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
    const root = nodes.find(n => !n.parent);
    nodes.forEach(n => {
      if (n.parent && map.has(n.parent)) map.get(n.parent).children.push(map.get(n.id));
    });
    return root ? map.get(root.id) : null;
  }

  function layoutNode(node, angle, depth, positions, cx, cy) {
    positions.set(node.id, { x: cx, y: cy, node });
    const children = node.children || [];
    if (!children.length) return;
    const span = Math.PI * 2 / Math.max(children.length, 1);
    const start = angle - (span * (children.length - 1)) / 2;
    const radius = RINGS[node.layer] || RINGS[children[0]?.layer] || 200;
    children.forEach((child, i) => {
      const a = children.length === 1 ? angle : start + span * i;
      const x = cx + Math.cos(a) * radius * (depth * 0.35 + 0.65);
      const y = cy + Math.sin(a) * radius * (depth * 0.35 + 0.65);
      layoutNode(child, a, depth + 1, positions, x, y);
    });
  }

  function render(container, linesEl, nodes, projectColor) {
    container.innerHTML = '';
    linesEl.innerHTML = '';
    const tree = buildTree(nodes);
    if (!tree) return;

    const rect = container.parentElement.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, cx, cy);

    positions.forEach((pos, id) => {
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
      line.setAttribute('stroke-opacity', '0.35');
      linesEl.appendChild(line);
    });

    positions.forEach((pos) => {
      const n = pos.node;
      const el = document.createElement('div');
      el.className = 'tree-node';
      el.dataset.id = n.id;
      el.dataset.layer = n.layer || 'function';
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      const z = n.layer === 'root' ? 80 : n.layer === 'module' ? 50 : n.layer === 'file' ? 30 : 10;
      el.style.zIndex = z;
      const inner = document.createElement('div');
      inner.className = 'tree-node-inner';
      inner.textContent = n.title.length > 14 ? n.title.slice(0, 12) + '…' : n.title;
      el.appendChild(inner);
      container.appendChild(el);
    });

    return positions;
  }

  return { render, buildTree };
})();
