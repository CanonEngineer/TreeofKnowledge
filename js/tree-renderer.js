/* Tree Renderer — layout radial sem sobreposição, com área rolável */
const TreeRenderer = (() => {
  const SIBLING_PAD = 1.28;
  const PARENT_PAD = 1.18;
  const STAGE_PAD = 72;
  const SEPARATION_ITERS = 48;

  function buildTree(nodes) {
    const map = new Map();
    nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
    const root = nodes.find(n => !n.parent);
    nodes.forEach(n => {
      if (n.parent && map.has(n.parent)) map.get(n.parent).children.push(map.get(n.id));
    });
    return root ? map.get(root.id) : null;
  }

  function countNodes(node) {
    let c = 1;
    (node.children || []).forEach(ch => { c += countNodes(ch); });
    return c;
  }

  function nodeHalfSize(layer, dense) {
    const sizes = dense
      ? { root: 43, module: 29, file: 25, function: 22 }
      : { root: 50, module: 36, file: 29, function: 25 };
    return sizes[layer] || sizes.function;
  }

  /** Raio do disco ocupado pela subárvore (nó + descendentes). */
  function measureSubtree(node, dense) {
    const half = nodeHalfSize(node.layer || 'function', dense);
    const children = node.children || [];
    if (!children.length) {
      node._subR = half;
      return half;
    }

    children.forEach(ch => measureSubtree(ch, dense));

    const childRs = children.map(ch => ch._subR);
    const n = children.length;
    let orbit = 0;

    if (n === 1) {
      orbit = (half + childRs[0]) * PARENT_PAD;
    } else {
      const step = (2 * Math.PI) / n;
      for (let i = 0; i < n; i++) {
        const a = childRs[i];
        const b = childRs[(i + 1) % n];
        const need = ((a + b) * SIBLING_PAD) / (2 * Math.sin(step / 2));
        orbit = Math.max(orbit, need);
      }
      const maxChild = Math.max(...childRs);
      orbit = Math.max(orbit, (half + maxChild) * PARENT_PAD);
    }

    node._orbit = orbit;
    node._subR = orbit + Math.max(...childRs);
    return node._subR;
  }

  function layoutNode(node, angle, depth, positions, cx, cy, dense) {
    positions.set(node.id, { x: cx, y: cy, node, depth, angle });
    const children = node.children || [];
    if (!children.length) return;

    const orbitR = node._orbit || 0;

    if (children.length === 1) {
      const a = angle;
      layoutNode(
        children[0], a, depth + 1, positions,
        cx + Math.cos(a) * orbitR,
        cy + Math.sin(a) * orbitR,
        dense
      );
      return;
    }

    const step = (2 * Math.PI) / children.length;
    const start = depth === 0 ? -Math.PI / 2 : angle - Math.PI + step / 2;

    children.forEach((child, i) => {
      const a = start + step * i;
      layoutNode(
        child, a, depth + 1, positions,
        cx + Math.cos(a) * orbitR,
        cy + Math.sin(a) * orbitR,
        dense
      );
    });
  }

  /** Empurra nós que ainda se tocam (colisões entre ramos). */
  function resolveOverlaps(positions, dense) {
    const items = Array.from(positions.values());
    for (let iter = 0; iter < SEPARATION_ITERS; iter++) {
      let moved = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const ra = nodeHalfSize(a.node.layer || 'function', dense);
          const rb = nodeHalfSize(b.node.layer || 'function', dense);
          const minDist = (ra + rb) * SIBLING_PAD;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.01) {
            dx = (Math.random() - 0.5) || 0.01;
            dy = (Math.random() - 0.5) || 0.01;
            dist = Math.hypot(dx, dy);
          }
          if (dist >= minDist) continue;

          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          const aRoot = a.node.layer === 'root';
          const bRoot = b.node.layer === 'root';

          if (!aRoot) {
            a.x -= ux * push;
            a.y -= uy * push;
            moved = true;
          }
          if (!bRoot) {
            b.x += ux * (aRoot ? push * 2 : push);
            b.y += uy * (aRoot ? push * 2 : push);
            moved = true;
          } else if (aRoot) {
            a.x -= ux * push * 2;
            a.y -= uy * push * 2;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }

  function normalizeStage(stage, positions, dense) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    positions.forEach((pos) => {
      const margin = nodeHalfSize(pos.node.layer || 'function', dense) * 1.25;
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

    const width = Math.max(maxX - minX + STAGE_PAD * 2, 640);
    const height = Math.max(maxY - minY + STAGE_PAD * 2, 480);

    stage.style.width = width + 'px';
    stage.style.height = height + 'px';
    stage.style.transform = 'none';
    stage.style.transformOrigin = '0 0';

    return { width, height };
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
    const dense = nodeCount > 14;
    measureSubtree(tree, dense);

    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, 0, 0, dense);
    resolveOverlaps(positions, dense);
    const stageSize = normalizeStage(stage, positions, dense);

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
      line.setAttribute('stroke-width', '1.5');
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
      el.style.zIndex = isRoot ? 80 : n.layer === 'module' ? 50 : n.layer === 'file' ? 30 : 10;

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

    // Centraliza a raiz na viewport inicial
    const rootPos = positions.get(tree.id);
    if (rootPos) {
      requestAnimationFrame(() => {
        const vw = scene.clientWidth;
        const vh = scene.clientHeight;
        scene.scrollLeft = Math.max(0, rootPos.x - vw / 2);
        scene.scrollTop = Math.max(0, rootPos.y - vh / 2);
      });
    }

    return positions;
  }

  return { render, buildTree, countNodes };
})();
