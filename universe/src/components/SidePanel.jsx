export function SidePanel({ node, graph, onClose, onViewCode }) {
  if (!node) {
    return (
      <aside className="side-panel empty">
        <h3>Nó selecionado</h3>
        <p>Clique em uma esfera para explorar módulos, arquivos e funções do projeto.</p>
        <ul className="hint-list">
          <li>Arraste para rotacionar · scroll para zoom</li>
          <li>Hover destaca conexões</li>
          <li>Filtre categorias na barra lateral</li>
        </ul>
      </aside>
    );
  }

  const childCount = graph.links.filter((l) => l.source === node.id).length;
  const parentLink = graph.links.find((l) => l.target === node.id);

  return (
    <aside className="side-panel">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Fechar">
        ×
      </button>
      <div className="panel-badge" style={{ background: node.color }}>
        {node.categoryLabel}
      </div>
      <h2>{node.label}</h2>
      <p className="panel-desc">{node.description || 'Sem descrição.'}</p>

      <dl className="panel-meta">
        <div>
          <dt>Camada</dt>
          <dd>{node.layer}</dd>
        </div>
        <div>
          <dt>Conexões</dt>
          <dd>{childCount + (parentLink ? 1 : 0)}</dd>
        </div>
        {node.file && (
          <div>
            <dt>Arquivo</dt>
            <dd><code>{node.file}</code></dd>
          </div>
        )}
      </dl>

      <div className="panel-actions">
        <button type="button" className="btn primary" onClick={() => onViewCode(node)}>
          Ver código
        </button>
        {graph.repoUrl && (
          <a href={graph.repoUrl} target="_blank" rel="noreferrer" className="btn ghost">
            Repositório
          </a>
        )}
      </div>
    </aside>
  );
}

export function LeftSidebar({
  graph,
  activeCategories,
  onToggleCategory,
  showLabels,
  onToggleLabels,
  showLinks,
  onToggleLinks,
  showParticles,
  onToggleParticles,
  paused,
  onTogglePause,
  onReset,
  search,
  onSearch,
  filteredCount,
}) {
  const cats = graph.categories || {};

  return (
    <aside className="left-sidebar">
      <header className="sidebar-header">
        <a href="../index.html" className="back-link">← Árvore 2D</a>
        <h1>{graph.name}</h1>
        <p className="subtitle">Galaxy 3D · {filteredCount} nós visíveis</p>
      </header>

      <section>
        <h3>Pesquisa</h3>
        <input
          type="search"
          placeholder="Buscar módulo ou arquivo..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
      </section>

      <section>
        <h3>Categorias</h3>
        <div className="category-list">
          {Object.entries(cats).map(([key, cat]) => (
            <label key={key} className="cat-toggle">
              <input
                type="checkbox"
                checked={activeCategories.has(key)}
                onChange={() => onToggleCategory(key)}
              />
              <span className="cat-dot" style={{ background: cat.color }} />
              {cat.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Controles</h3>
        <div className="control-btns">
          <button type="button" className="btn sm" onClick={onReset}>Reiniciar câmera</button>
          <button type="button" className="btn sm" onClick={onTogglePause}>
            {paused ? 'Retomar' : 'Pausar'}
          </button>
        </div>
      </section>

      <section>
        <h3>Filtros visuais</h3>
        <label className="cat-toggle">
          <input type="checkbox" checked={showLinks} onChange={onToggleLinks} />
          Conexões
        </label>
        <label className="cat-toggle">
          <input type="checkbox" checked={showLabels} onChange={onToggleLabels} />
          Rótulos
        </label>
        <label className="cat-toggle">
          <input type="checkbox" checked={showParticles} onChange={onToggleParticles} />
          Partículas (fluxo)
        </label>
      </section>

      <section className="legend">
        <h3>Legenda</h3>
        <p><span className="leg-line solid" /> Dependência direta</p>
        <p><span className="leg-dot" /> Pacote de dados animado</p>
        <p>● pequeno · função · ●● médio · módulo · ●●● grande · raiz</p>
      </section>
    </aside>
  );
}

export function Minimap({ graph, selectedId, activeCategories }) {
  const nodes = graph.nodes.filter((n) => activeCategories.has(n.category));
  if (!nodes.length) return null;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  nodes.forEach((n) => {
    const x = hash(n.id) * 80 - 40;
    const z = hash(n.id + 'z') * 80 - 40;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  });
  const w = maxX - minX || 1;
  const h = maxZ - minZ || 1;

  return (
    <div className="minimap">
      <span className="minimap-title">Mapa</span>
      <svg viewBox="0 0 100 100" className="minimap-svg">
        {nodes.map((n) => {
          const cx = ((hash(n.id) * 80 - 40 - minX) / w) * 90 + 5;
          const cy = ((hash(n.id + 'z') * 80 - 40 - minZ) / h) * 90 + 5;
          const r = n.layer === 'root' ? 3 : n.layer === 'module' ? 2 : 1;
          return (
            <circle
              key={n.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={n.id === selectedId ? '#fff' : n.color}
              opacity={n.id === selectedId ? 1 : 0.65}
            />
          );
        })}
      </svg>
    </div>
  );
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
