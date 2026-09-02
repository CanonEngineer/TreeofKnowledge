/** Layout hierárquico radial 3D — espelha a lógica da árvore 2D (raios alinhados aos nós). */
const DEFAULT_FLOOR_Y = -14;
const FLOOR_CLEARANCE = 2.6;

export function computeLayout(graph) {
  const { nodes } = graph;
  const children = new Map();

  nodes.forEach((n) => {
    if (n.parent) {
      if (!children.has(n.parent)) children.set(n.parent, []);
      children.get(n.parent).push(n.id);
    }
  });

  children.forEach((ids) => ids.sort());

  const root =
    nodes.find((n) => n.layer === "root") ||
    nodes.find((n) => !n.parent) ||
    nodes[0];

  const positions = new Map();
  positions.set(root.id, { x: 0, y: 0, z: 0 });

  const level1 = children.get(root.id) || [];
  // Anel no plano XZ — mesmo espírito do 2D
  const R1 = Math.max(12, Math.min(28, 8 + Math.sqrt(Math.max(level1.length, 1)) * 3.4));

  level1.forEach((id, i) => {
    const angle = (i / Math.max(level1.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(id, {
      x: Math.cos(angle) * R1,
      y: Math.sin(i * 0.7) * 0.25,
      z: Math.sin(angle) * R1,
    });
  });

  function layoutSubtree(parentId, depth) {
    const kids = children.get(parentId) || [];
    const parentPos = positions.get(parentId);
    if (!parentPos || !kids.length) return;

    // Direção "para fora" a partir da raiz (eixo do ramo)
    const outward = {
      x: parentPos.x,
      y: parentPos.y * 0.35,
      z: parentPos.z,
    };
    let olen = Math.hypot(outward.x, outward.y, outward.z);
    if (olen < 0.001) {
      outward.x = 0;
      outward.y = 0;
      outward.z = 1;
      olen = 1;
    }
    outward.x /= olen;
    outward.y /= olen;
    outward.z /= olen;

    // Base ortonormal no plano perpendicular ao ramo
    let ax = Math.abs(outward.x) < 0.9 ? 1 : 0;
    let ay = Math.abs(outward.x) < 0.9 ? 0 : 1;
    let az = 0;
    // u = outward × arbitrary
    let ux = outward.y * az - outward.z * ay;
    let uy = outward.z * ax - outward.x * az;
    let uz = outward.x * ay - outward.y * ax;
    let ul = Math.hypot(ux, uy, uz) || 1;
    ux /= ul;
    uy /= ul;
    uz /= ul;
    // v = outward × u
    let vx = outward.y * uz - outward.z * uy;
    let vy = outward.z * ux - outward.x * uz;
    let vz = outward.x * uy - outward.y * ux;

    const baseR = depth === 1 ? 7.5 : depth === 2 ? 5.4 : depth === 3 ? 4.0 : 3.2;
    const orbit = baseR + Math.min(Math.sqrt(kids.length) * 0.95, 8);
    const n = kids.length;
    // Leque aberto à frente do ramo (como o spread 2D), não esfera completa
    const spread = n <= 1 ? 0 : Math.min(Math.PI * 1.15, 0.55 + n * 0.38);
    const start = -spread / 2;
    const step = n <= 1 ? 0 : spread / (n - 1);

    kids.forEach((kidId, i) => {
      if (positions.has(kidId)) return;
      const a = n === 1 ? 0 : start + step * i;
      // leve elevação por índice para profundidade visual sem quebrar o raio
      const elev = ((i % 5) - 2) * 0.12;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      // ponto no cone: principalmente ao longo de outward + leque no plano u/v
      const along = orbit * 0.72;
      const side = orbit * 0.78;
      positions.set(kidId, {
        x: parentPos.x + outward.x * along + (ux * cosA + vx * sinA) * side,
        y: parentPos.y + outward.y * along + (uy * cosA + vy * sinA) * side + elev,
        z: parentPos.z + outward.z * along + (uz * cosA + vz * sinA) * side,
      });
      layoutSubtree(kidId, depth + 1);
    });
  }

  level1.forEach((id) => layoutSubtree(id, 1));

  nodes.forEach((n) => {
    if (!positions.has(n.id)) {
      positions.set(n.id, clusterFallback(n, nodes));
    }
  });

  let minY = Infinity;
  positions.forEach((p) => {
    minY = Math.min(minY, p.y);
  });
  if (!Number.isFinite(minY)) minY = 0;

  // Plano desce quando a árvore cresce para baixo; senão mantém altura padrão.
  const floorY = minY < DEFAULT_FLOOR_Y + FLOOR_CLEARANCE
    ? minY - FLOOR_CLEARANCE
    : DEFAULT_FLOOR_Y;

  const nodesOut = nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) || { x: 0, y: 0, z: 0 },
  }));

  return { nodes: nodesOut, floorY };
}

function clusterFallback(node, nodes) {
  const cats = [...new Set(nodes.map((n) => n.category))];
  const idx = cats.indexOf(node.category);
  const a = (idx / Math.max(cats.length, 1)) * Math.PI * 2;
  const r = 24 + hash(node.id) * 8;
  return {
    x: Math.cos(a) * r,
    y: (hash(node.id + "y") - 0.5) * 6,
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
  (links || []).forEach((l) => {
    if (l.source === nodeId) set.add(l.target);
    if (l.target === nodeId) set.add(l.source);
  });
  return set;
}

export function getProjectSlug() {
  const p = new URLSearchParams(window.location.search);
  return p.get("project") || "professional-scanner";
}

export function countConnections(nodeId, links) {
  return (links || []).filter((l) => l.source === nodeId || l.target === nodeId).length;
}

export function countDependencies(nodeId, links) {
  return (links || []).filter((l) => l.target === nodeId).length;
}
