/** Layout hierárquico radial — raiz no centro, ramos em esferas concêntricas */
export function computeLayout(graph) {
  const { nodes } = graph;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map();

  nodes.forEach((n) => {
    if (n.parent) {
      if (!children.has(n.parent)) children.set(n.parent, []);
      children.get(n.parent).push(n.id);
    }
  });

  children.forEach((ids) => ids.sort());

  const root =
    nodes.find((n) => n.layer === 'root') ||
    nodes.find((n) => !n.parent) ||
    nodes[0];

  const positions = new Map();
  positions.set(root.id, { x: 0, y: 0, z: 0 });

  const level1 = children.get(root.id) || [];
  const R1 = Math.max(14, Math.min(22, 8 + level1.length * 0.55));

  level1.forEach((id, i) => {
    const angle = (i / Math.max(level1.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const tilt = Math.sin(i * 1.15) * 3;
    positions.set(id, {
      x: Math.cos(angle) * R1,
      y: tilt,
      z: Math.sin(angle) * R1,
    });
  });

  function fibonacciOffset(i, count, radius) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(count, 1));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi) * 0.55,
      z: radius * Math.sin(phi) * Math.sin(theta),
    };
  }

  function layoutSubtree(parentId, depth) {
    const kids = children.get(parentId) || [];
    const parentPos = positions.get(parentId);
    if (!parentPos || !kids.length) return;

    const baseR = depth === 1 ? 8 : depth === 2 ? 5.5 : 3.8;
    const radius = baseR + Math.min(kids.length * 0.12, 3);

    kids.forEach((kidId, i) => {
      if (positions.has(kidId)) return;
      const off = fibonacciOffset(i, kids.length, radius);
      positions.set(kidId, {
        x: parentPos.x + off.x,
        y: parentPos.y + off.y,
        z: parentPos.z + off.z,
      });
      layoutSubtree(kidId, depth + 1);
    });
  }

  level1.forEach((id) => layoutSubtree(id, 1));

  nodes.forEach((n) => {
    if (!positions.has(n.id)) {
      const c = clusterFallback(n, nodes);
      positions.set(n.id, c);
    }
  });

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) || { x: 0, y: 0, z: 0 },
  }));
}

function clusterFallback(node, nodes) {
  const cats = [...new Set(nodes.map((n) => n.category))];
  const idx = cats.indexOf(node.category);
  const a = (idx / Math.max(cats.length, 1)) * Math.PI * 2;
  const r = 24 + hash(node.id) * 8;
  return {
    x: Math.cos(a) * r,
    y: (hash(node.id + 'y') - 0.5) * 6,
    z: Math.sin(a) * r,
  };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function getNeighbors(nodeId, links) {
  const set = new Set([nodeId]);
  links.forEach((l) => {
    if (l.source === nodeId) set.add(l.target);
    if (l.target === nodeId) set.add(l.source);
  });
  return set;
}

export function getProjectSlug() {
  const p = new URLSearchParams(window.location.search);
  return p.get('project') || 'professional-scanner';
}

export function countConnections(nodeId, links) {
  return links.filter((l) => l.source === nodeId || l.target === nodeId).length;
}

export function countDependencies(nodeId, links) {
  return links.filter((l) => l.target === nodeId).length;
}

/** Envelope esférico do grafo posicionado — base para enquadrar a câmera */
export function computeGraphBounds(laidOut) {
  if (!laidOut.length) {
    return { center: { x: 0, y: 0, z: 0 }, radius: 22 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  laidOut.forEach((n) => {
    const pad = (n.size || 0.6) * 1.8;
    minX = Math.min(minX, n.position.x - pad);
    maxX = Math.max(maxX, n.position.x + pad);
    minY = Math.min(minY, n.position.y - pad);
    maxY = Math.max(maxY, n.position.y + pad);
    minZ = Math.min(minZ, n.position.z - pad);
    maxZ = Math.max(maxZ, n.position.z + pad);
  });

  const center = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  };
  const radius = Math.max(
    Math.hypot(maxX - minX, maxZ - minZ) / 2,
    (maxY - minY) / 2,
    10
  ) + 6;

  return { center, radius };
}

/** 35% = visão completa · 100% = detalhe · distâncias proporcionais ao grafo */
export function computeCameraFrames(bounds, fovDeg = 52) {
  const fov = (fovDeg * Math.PI) / 180;
  const fitDistance = (bounds.radius / Math.tan(fov / 2)) * 1.28;
  const overviewDistance = fitDistance;
  const detailDistance = fitDistance * 0.35;

  return {
    center: bounds.center,
    overview: {
      x: bounds.center.x,
      y: bounds.center.y + overviewDistance * 0.14,
      z: bounds.center.z + overviewDistance,
    },
    detail: {
      x: bounds.center.x,
      y: bounds.center.y + 4,
      z: bounds.center.z + detailDistance,
    },
    minDistance: detailDistance * 0.4,
    maxDistance: overviewDistance * 1.5,
    overviewDistance,
    detailDistance,
  };
}

export function zoomFromDistance(distance, overviewDistance) {
  const pct = Math.round(35 * (overviewDistance / Math.max(distance, 0.001)));
  return Math.min(200, Math.max(35, pct));
}
