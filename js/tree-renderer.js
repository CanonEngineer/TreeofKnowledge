/* Tree Renderer — layout radial com nós médios e área rolável */
const TreeRenderer = (() => {
  const SIBLING_GAP = 3.0;
  const PARENT_GAP = 2.45;
  const STAGE_PAD = 135;

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

  function getRings(nodeCount) {
    const spread = Math.max(1, Math.sqrt(nodeCount) * 0.45);
    const base = 176 * spread;
    return {
      module: base,
      file: base * 1.58,
      function: base * 2.1,
      default: base * 1.12
    };
  }

  function nodeHalfSize(layer) {
    const sizes = {
      root: 92,
      module: 69,
      file: 58,
      function: 51
    };
    return sizes[layer] || sizes.function;
  }

  function nodeDiameter(layer) {
    return nodeHalfSize(layer) * 2;
  }

  /** Raio mínimo para N irmãos em círculo sem sobreposição */
  function minOrbitRadius(count, childLayer) {
    if (count <= 1) return 0;
    const d = nodeDiameter(childLayer);
    return (count * d * SIBLING_GAP) / (2 * Math.PI);
  }

  function childOrbitRadius(ringRadius, childLayer, depth, parentLayer) {
    const depthFactors = [1.22, 1.08, 1.0, 0.94];
    const factor = depthFactors[depth] ?? 0.9;
    const fromRing = ringRadius * factor;
    const minFromParent = (nodeHalfSize(parentLayer) + nodeHalfSize(childLayer)) * PARENT_GAP;
    return Math.max(fromRing, minFromParent);
  }

  function arcForSiblings(count, orbitR, childLayer) {
    if (count <= 1) return 0;
    const d = nodeDiameter(childLayer);
    const minArc = (count * d * SIBLING_GAP) / Math.max(orbitR, 1);
    const spreadArc = Math.PI * 0.58 * count + 0.75;
    return Math.min(Math.PI * 2 * 0.96, Math.max(minArc, spreadArc));
  }

  function normalizeStage(stage, positions) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    positions.forEach((pos) => {
      const margin = nodeHalfSize(pos.node.layer || 'function') * 1.42;
      minX = Math.min(minX, pos.x - margin);
      minY = Math.min(minY, pos.y - margin);
      maxX = Math.max(maxX, pos.x + margin);
      maxY = Math.max(maxY, pos.y + margin);
    });

    const offsetX = STAGE_PAD - minX;
    const offsetY = STAGE_PAD - minY;

    positions.forEach((pos) => {
      pos.x += offsetX;
      pos.y += offsetY;
    });

    const width = Math.max(maxX - minX + STAGE_PAD * 2, 1000);
    const height = Math.max(maxY - minY + STAGE_PAD * 2, 780);

    stage.style.width = width + 'px';
    stage.style.height = height + 'px';
    stage.style.transform = 'none';
    stage.style.transformOrigin = '0 0';

    return { width, height };
  }

  function layoutNode(node, angle, depth, positions, cx, cy, rings) {
    positions.set(node.id, { x: cx, y: cy, node, depth });
    const children = node.children || [];
    if (!children.length) return;

    const parentLayer = node.layer || 'root';
    const childLayer = children[0].layer || 'function';
    const ringRadius = rings[childLayer] || rings.default;
    let orbitR = childOrbitRadius(ringRadius, childLayer, depth, parentLayer);
    orbitR = Math.max(orbitR, minOrbitRadius(children.length, childLayer));

    if (children.length === 1) {
      layoutNode(children[0], angle, depth + 1, positions,
        cx + Math.cos(angle) * orbitR, cy + Math.sin(angle) * orbitR, rings);
      return;
    }

    if (depth === 0) {
      const step = (2 * Math.PI) / children.length;
      children.forEach((child, i) => {
        const a = -Math.PI / 2 + step * i;
        layoutNode(child, a, depth + 1, positions,
          cx + Math.cos(a) * orbitR, cy + Math.sin(a) * orbitR, rings);
      });
      return;
    }

    const arc = arcForSiblings(children.length, orbitR, childLayer);
    const start = angle - arc / 2;
    const step = arc / (children.length - 1);

    children.forEach((child, i) => {
      const a = start + step * i;
      layoutNode(child, a, depth + 1, positions,
        cx + Math.cos(a) * orbitR, cy + Math.sin(a) * orbitR, rings);
    });
  }

  function formatNodeLabel(title, layer) {
    const maxLen = layer === 'root' ? 56 : layer === 'module' ? 44 : 38;
    if (title.length <= maxLen) return title;
    return title.slice(0, maxLen - 1) + '…';
  }

  function render(container, linesEl, nodes, projectColor, projectSlug) {
    container.innerHTML = '';
    linesEl.innerHTML = '';
    const tree = buildTree(nodes);
    if (!tree) return;

    const stage = container.parentElement;
    const scene = stage.parentElement;
    stage.style.transform = '';

    const nodeCount = countNodes(tree);
    const layoutSpan = Math.max(1600, nodeCount * 86);
    const cx = layoutSpan / 2;
    const cy = layoutSpan / 2;
    const rings = getRings(nodeCount);

    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, cx, cy, rings);
    const stageSize = normalizeStage(stage, positions);

    linesEl.setAttribute('width', stageSize.width);
    linesEl.setAttribute('height', stageSize.height);
    linesEl.setAttribute('viewBox', '0 0 ' + stageSize.width + ' ' + stageSize.height);

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
      line.setAttribute('stroke-opacity', '0.35');
      line.setAttribute('stroke-width', '2.5');
      linesEl.appendChild(line);
    });

    positions.forEach((pos) => {
      const n = pos.node;
      const isRoot = n.layer === 'root';
      const el = document.createElement(isRoot ? 'div' : 'a');
      el.className = 'tree-node';
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
      inner.textContent = formatNodeLabel(n.title, n.layer || 'function');
      el.appendChild(inner);
      container.appendChild(el);
    });

    scene.scrollTop = 0;
    scene.scrollLeft = 0;
    return positions;
  }

  return { render, buildTree, countNodes };
})();
