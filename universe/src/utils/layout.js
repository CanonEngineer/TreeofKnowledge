/** Posicionamento em clusters (modo galaxy) + filhos em esfera ao redor do pai */
export function computeLayout(graph) {
  const { nodes, links } = graph;
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]));
  const children = new Map();
  nodes.forEach((n) => {
    if (n.parent) {
      if (!children.has(n.parent)) children.set(n.parent, []);
      children.get(n.parent).push(n.id);
    }
  });

  const positions = new Map();
  const clusterCenters = {};
  const cats = [...new Set(nodes.map((n) => n.category))];
  const R = 28;
  cats.forEach((cat, i) => {
    const a = (i / cats.length) * Math.PI * 2;
    clusterCenters[cat] = { x: Math.cos(a) * R, y: (Math.sin(i * 1.3) * 4), z: Math.sin(a) * R };
  });

  const root = nodes.find((n) => n.layer === 'root') || nodes[0];
  positions.set(root.id, { x: 0, y: 0, z: 0 });

  function placeOnSphere(cx, cy, cz, ids, radius) {
    ids.forEach((id, i) => {
      const node = byId.get(id);
      if (!node || positions.has(id)) return;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / ids.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      positions.set(id, {
        x: cx + radius * Math.sin(phi) * Math.cos(theta),
        y: cy + radius * Math.cos(phi) * 0.6,
        z: cz + radius * Math.sin(phi) * Math.sin(theta),
      });
    });
  }

  nodes.forEach((n) => {
    if (n.layer === 'root') return;
    if (positions.has(n.id)) return;
    const c = clusterCenters[n.category] || { x: 0, y: 0, z: 0 };
    const jitter = hash(n.id) * 6;
    positions.set(n.id, {
      x: c.x + (hash(n.id + 'x') - 0.5) * jitter,
      y: c.y + (hash(n.id + 'y') - 0.5) * jitter * 0.5,
      z: c.z + (hash(n.id + 'z') - 0.5) * jitter,
    });
  });

  const groups = [...new Set(nodes.filter((n) => n.layer === 'module').map((n) => n.id))];
  groups.forEach((gid) => {
    const gpos = positions.get(gid);
    if (!gpos) return;
    const kids = (children.get(gid) || []).filter((id) => byId.get(id)?.layer !== 'module');
    placeOnSphere(gpos.x, gpos.y, gpos.z, kids, 4 + Math.min(kids.length * 0.15, 6));
  });

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) || { x: 0, y: 0, z: 0 },
  }));
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
