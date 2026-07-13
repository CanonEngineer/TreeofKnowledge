/* Tree Renderer — layout no estilo CustomizeVeyon: radial, sem sobreposição, área rolável */
const TreeRenderer = (() => {
  const SIBLING_PAD = 1.42;
  const PARENT_PAD = 1.22;
  const STAGE_PAD = 80;
  const SEPARATION_ITERS = 56;
  const FILL_RATIO = 0.88;

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

  /** Abertura angular dos filhos (círculo completo só na raiz). */
  function childSpread(count, isRoot) {
    if (count <= 1) return 0;
    if (isRoot) return Math.PI * 2;
    return Math.min(Math.PI * 1.25, 0.55 + count * 0.48);
  }

  function orbitFromChildren(half, childRs, isRoot) {
    const n = childRs.length;
    if (n === 0) return 0;
    if (n === 1) return (half + childRs[0]) * PARENT_PAD;

    const spread = childSpread(n, isRoot);
    const step = isRoot ? spread / n : spread / (n - 1);
    let orbit = 0;
    for (let i = 0; i < n; i++) {
      const a = childRs[i];
      const b = childRs[isRoot ? (i + 1) % n : Math.min(i + 1, n - 1)];
      if (!isRoot && i === n - 1) break;
      const need = ((a + b) * SIBLING_PAD) / (2 * Math.sin(Math.max(step, 0.12) / 2));
      orbit = Math.max(orbit, need);
    }
    orbit = Math.max(orbit, (half + Math.max(...childRs)) * PARENT_PAD);
    return orbit;
  }

  /** Mede subárvores; na raiz aplica órbita mínima no estilo Veyon. */
  function measureSubtree(node, dense, isRoot, minRootOrbit) {
    const half = nodeHalfSize(node.layer || 'function', dense);
    const children = node.children || [];
    if (!children.length) {
      node._subR = half;
      node._orbit = 0;
      return half;
    }

    children.forEach(ch => measureSubtree(ch, dense, false, 0));
    const childRs = children.map(ch => ch._subR);
    let orbit = orbitFromChildren(half, childRs, isRoot);

    if (isRoot && minRootOrbit) {
      orbit = Math.max(orbit, minRootOrbit);
    }

    // Espaçamento extra leve em nós com muitos filhos (como o Veyon)
    if (children.length >= 5) {
      orbit *= 1.08;
    }

    node._orbit = orbit;
    node._subR = orbit + Math.max(...childRs);
    return node._subR;
  }

  function layoutNode(node, angle, depth, positions, cx, cy) {
    positions.set(node.id, { x: cx, y: cy, node, depth, angle });
    const children = node.children || [];
    if (!children.length) return;

    const orbitR = node._orbit || 0;
    const n = children.length;
    const isRoot = depth === 0;

    if (n === 1) {
      const a = isRoot ? -Math.PI / 2 : angle;
      layoutNode(
        children[0], a, depth + 1, positions,
        cx + Math.cos(a) * orbitR,
        cy + Math.sin(a) * orbitR
      );
      return;
    }

    const spread = childSpread(n, isRoot);
    const step = isRoot ? spread / n : spread / (n - 1);
    const start = isRoot ? -Math.PI / 2 : angle - spread / 2;

    children.forEach((child, i) => {
      const a = start + step * i;
      layoutNode(
        child, a, depth + 1, positions,
        cx + Math.cos(a) * orbitR,
        cy + Math.sin(a) * orbitR
      );
    });
  }

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

  function boundsOf(positions, dense) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach((pos) => {
      const margin = nodeHalfSize(pos.node.layer || 'function', dense) * 1.3;
      minX = Math.min(minX, pos.x - margin);
      minY = Math.min(minY, pos.y - margin);
      maxX = Math.max(maxX, pos.x + margin);
      maxY = Math.max(maxY, pos.y + margin);
    });
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  /**
   * Centraliza e, se a árvore for menor que a tela (FoodOnline etc.),
   * amplia até preencher ~88% — visual próximo ao CustomizeVeyon.
   * Se for maior, mantém tamanho real e usa scroll.
   */
  function normalizeStage(stage, positions, dense, sceneW, sceneH) {
    let b = boundsOf(positions, dense);

    const targetW = Math.max(sceneW * FILL_RATIO, 320);
    const targetH = Math.max(sceneH * FILL_RATIO, 280);
    const scaleUp = Math.min(targetW / Math.max(b.width, 1), targetH / Math.max(b.height, 1));

    if (scaleUp > 1.02) {
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      positions.forEach((pos) => {
        pos.x = cx + (pos.x - cx) * scaleUp;
        pos.y = cy + (pos.y - cy) * scaleUp;
      });
      b = boundsOf(positions, dense);
    }

    const contentW = b.width + STAGE_PAD * 2;
    const contentH = b.height + STAGE_PAD * 2;
    const width = Math.max(contentW, sceneW);
    const height = Math.max(contentH, sceneH);

    const offsetX = (width - b.width) / 2 - b.minX;
    const offsetY = (height - b.height) / 2 - b.minY;
    positions.forEach((pos) => {
      pos.x += offsetX;
      pos.y += offsetY;
    });

    stage.style.width = width + 'px';
    stage.style.height = height + 'px';
    stage.style.transform = 'none';
    stage.style.transformOrigin = '0 0';
    stage.dataset.baseWidth = String(width);
    stage.dataset.baseHeight = String(height);

    return { width, height };
  }

  function render(container, linesEl, nodes, projectColor, projectSlug) {
    container.innerHTML = '';
    linesEl.innerHTML = '';
    const tree = buildTree(nodes);
    if (!tree) return;

    const stage = container.parentElement;
    const zoomSpace = stage.parentElement;
    const scene = zoomSpace.parentElement;
    stage.style.transform = '';

    const sceneW = Math.max(scene.clientWidth || 1000, 640);
    const sceneH = Math.max(scene.clientHeight || 640, 420);
    const nodeCount = countNodes(tree);
    const dense = nodeCount > 14;

    // Órbita mínima da raiz no espírito do Veyon (módulos bem abertos)
    const minRootOrbit = Math.min(sceneW, sceneH) * (nodeCount >= 40 ? 0.30 : 0.34);
    measureSubtree(tree, dense, true, minRootOrbit);

    const positions = new Map();
    layoutNode(tree, -Math.PI / 2, 0, positions, 0, 0);
    resolveOverlaps(positions, dense);
    const stageSize = normalizeStage(stage, positions, dense, sceneW, sceneH);

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
        el.removeAttribute('title');
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

    const rootPos = positions.get(tree.id);
    if (rootPos) {
      requestAnimationFrame(() => {
        scene.scrollLeft = Math.max(0, rootPos.x - scene.clientWidth / 2);
        scene.scrollTop = Math.max(0, rootPos.y - scene.clientHeight / 2);
      });
    }

    return positions;
  }

  return { render, buildTree, countNodes };
})();
