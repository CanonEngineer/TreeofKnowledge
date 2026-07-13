/* Tree Renderer — layout radial escalável para árvores grandes */
const TreeRenderer = (() => {
  const SIBLING_GAP = 1.65;
  const PARENT_GAP = 1.45;

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

  function getRings(nodeCount, rect) {
    const minDim = Math.min(rect.width, rect.height);
    const density = Math.max(0.58, Math.min(1.25, 18 / Math.sqrt(nodeCount)));
    const base = minDim * 0.19 * density;
    return {
      module: base,
      file: base * 1.9,
      function: base * 2.55,
      default: base * 1.15
    };
  }

  function nodeHalfSize(layer, dense) {
    const sizes = dense
      ? { root: 43, module: 29, file: 25, function: 22 }
      : { root: 50, module: 36, file: 29, function: 25 };
    return sizes[layer] || sizes.function;
  }

  function nodeDiameter(layer, dense) {
    return nodeHalfSize(layer, dense) * 2;
  }

  /** Raio mínimo para N irmãos em círculo sem sobreposição */
  function minOrbitRadius(count, childLayer, dense) {
    if (count <= 1) return 0;
    const d = nodeDiameter(childLayer, dense);
    return (count * d * SIBLING_GAP) / (2 * Math.PI);
  }

  function childOrbitRadius(ringRadius, childLayer, depth, parentLayer, dense) {
    const depthFactors = [1.15, 1.0, 0.92, 0.86];
    const factor = depthFactors[depth] ?? 0.8;
    const fromRing = ringRadius * factor;
    const minFromParent = (nodeHalfSize(parentLayer, dense) + nodeHalfSize(childLayer, dense)) * PARENT_GAP;
    return Math.max(fromRing, minFromParent);
  }

  function arcForSiblings(count, orbitR, childLayer, dense) {
    if (count <= 1) return 0;
    const d = nodeDiameter(childLayer, dense);
    const minArc = (count * d * SIBLING_GAP) / Math.max(orbitR, 1);
    const spreadArc = Math.PI * 0.52 * count + 0.55;
    return Math.min(Math.PI * 2 * 0.94, Math.max(minArc, spreadArc));
  }

  function fitStage(stage, positions, rect, dense) {
    const pad = 48;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    positions.forEach((pos) => {
      const margin = nodeHalfSize(pos.node.layer || 'function', dense) * 1.2;
      minX = Math.min(minX, pos.x - margin);
      minY = Math.min(minY, pos.y - margin);
      maxX = Math.max(maxX, pos.x + margin);
      maxY = Math.max(maxY, pos.y + margin);
    });

    const bw = Math.max(maxX - minX, 120);
    const bh = Math.max(maxY - minY, 120);
    const scale = Math.min(
      (rect.width - pad * 2) / bw,
      (rect.height - pad * 2) / bh,
      1
    );

    const bcx = (minX + maxX) / 2;
    const bcy = (minY + maxY) / 2;
    const tx = rect.width / 2 - bcx * scale;
    const ty = rect.height / 2 - bcy * scale;

    stage.style.transformOrigin = '0 0';
    stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function layoutNode(node, angle, depth, positions, cx, cy, rings, dense) {
    positions.set(node.id, { x: cx, y: cy, node, depth });
    const children = node.children || [];
    if (!children.length) return;

    const parentLayer = node.layer || 'root';
    const childLayer = children[0].layer || 'function';
    const ringRadius = rings[childLayer] || rings.default;
    let orbitR = childOrbitRadius(ringRadius, childLayer, depth, parentLayer, dense);
    orbitR = Math.max(orbitR, minOrbitRadius(children.length, childLayer, dense));

    if (children.length === 1) {
      layoutNode(children[0], angle, depth + 1, positions,
        cx + Math.cos(angle) * orbitR, cy + Math.sin(angle) * orbitR, rings, dense);
      return;
    }

    if (depth === 0) {
      const step = (2 * Math.PI) / children.length;
      children.forEach((child, i) => {
        const a = -Math.PI / 2 + step * i;
        layoutNode(child, a, depth + 1, positions,
          cx + Math.cos(a) * orbitR, cy + Math.sin(a) * orbitR, rings, dense);
      });
      return;
    }

    const arc = arcForSiblings(children.length, orbitR, childLayer, dense);
    const start = angle - arc / 2;
    const step = arc / (children.length - 1);

    children.forEach((child, i) => {
      const a = start + step * i;
      layoutNode(child, a, depth + 1, positions,
        cx + Math.cos(a) * orbitR, cy + Math.sin(a) * orbitR, rings, dense);
    });
  }

  function render(container, linesEl, nodes, projectColor, projectSlug) {
    container.innerHTML = '';
    linesEl.innerHTML = '';
    const tree = buildTree(nodes);
    if (!tree) return;

    const stage = container.parentElement;
    const scene = stage.parentElement;
    const rect = scene.getBoundingClientRect();
    stage.style.transform = '';
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const nodeCount = countNodes(tree);
    const rings = getRings(nodeCount, rect);
    const dense = nodeCount > 14;

    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, cx, cy, rings, dense);

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
      const maxLen = dense ? 12 : 15;
      inner.textContent = n.title.length > maxLen ? n.title.slice(0, maxLen - 1) + '…' : n.title;
      el.appendChild(inner);
      container.appendChild(el);
    });

    fitStage(stage, positions, rect, dense);
    return positions;
  }

  return { render, buildTree, countNodes };
})();
