import { countConnections, countDependencies } from '../utils/layout';

const LAYER_LABEL = {
  root: 'Módulo Core',
  module: 'Módulo',
  file: 'Arquivo',
  function: 'Função',
};

export function TopBar({ graph }) {
  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <span className="top-bar-icon">◆</span>
        <div>
          <h1>{graph.name.toUpperCase()}</h1>
          <p>React Three Fiber · Galaxy Mode</p>
        </div>
      </div>
      <div className="top-bar-meta">
        <span className="meta-chip">{graph.nodeCount} nós</span>
        <span className="meta-chip live">● Ativo</span>
      </div>
    </header>
  );
}

export function SidePanel({ node, graph, onClose, onViewCode, onReset }) {
  if (!node) {
    return (
      <aside className="side-panel">
        <div className="panel-section">
          <h3 className="panel-title">Nó Selecionado</h3>
          <p className="panel-empty-text">
            Clique em uma esfera iluminada para explorar módulos, arquivos e funções do projeto.
          </p>
        </div>
        <div className="panel-section">
          <h4>Ações</h4>
          <button type="button" className="action-btn" onClick={onReset}>Reiniciar Vista</button>
        </div>
        <div className="panel-hints">
          <p>Arraste · rotacionar</p>
          <p>Scroll · zoom</p>
          <p>Hover · destacar conexões</p>
        </div>
      </aside>
    );
  }

  const connections = countConnections(node.id, graph.links);
  const dependencies = countDependencies(node.id, graph.links);
  const childCount = graph.links.filter((l) => l.source === node.id).length;

  return (
    <aside className="side-panel active">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Fechar">×</button>

      <div className="panel-section">
        <h3 className="panel-title">Nó Selecionado</h3>
        <div className="panel-node-header">
          <span className="status-dot" style={{ background: node.color, boxShadow: `0 0 10px ${node.color}` }} />
          <div>
            <h2>{node.label}</h2>
            <span className="panel-type">{LAYER_LABEL[node.layer] || node.layer}</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h4>Descrição</h4>
        <p className="panel-desc">{node.description || 'Componente do grafo de dependências do projeto.'}</p>
      </div>

      <div className="panel-section">
        <h4>Informações</h4>
        <div className="info-grid">
          <div className="info-item">
            <span>Status</span>
            <strong className="status-active">● Ativo</strong>
          </div>
          <div className="info-item">
            <span>Conexões</span>
            <strong>{connections}</strong>
          </div>
          <div className="info-item">
            <span>Dependências</span>
            <strong>{dependencies}</strong>
          </div>
          <div className="info-item">
            <span>Filhos</span>
            <strong>{childCount}</strong>
          </div>
          <div className="info-item">
            <span>Categoria</span>
            <strong style={{ color: node.color }}>{node.categoryLabel}</strong>
          </div>
          {node.file && (
            <div className="info-item full">
              <span>Arquivo</span>
              <code>{node.file}</code>
            </div>
          )}
        </div>
      </div>

      <div className="panel-section">
        <h4>Ações</h4>
        <button type="button" className="action-btn primary" onClick={() => onViewCode(node)}>
          Ver Código
        </button>
        <button type="button" className="action-btn" onClick={onReset}>Reiniciar Vista</button>
        {graph.repoUrl && (
          <a href={graph.repoUrl} target="_blank" rel="noreferrer" className="action-btn ghost">
            Ver Repositório
          </a>
        )}
        {graph.demoUrl && (
          <a href={graph.demoUrl} target="_blank" rel="noreferrer" className="action-btn ghost">
            Abrir Demo
          </a>
        )}
      </div>
    </aside>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </label>
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
  showAnimations,
  onToggleAnimations,
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
        <p className="sidebar-kicker">Tree of Knowledge</p>
      </header>

      <section className="sidebar-block">
        <h3>Categorias</h3>
        <div className="category-list">
          {Object.entries(cats).map(([key, cat]) => (
            <label key={key} className="cat-row">
              <input type="checkbox" checked={activeCategories.has(key)} onChange={() => onToggleCategory(key)} />
              <span className="cat-dot" style={{ background: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="sidebar-block">
        <h3>Controles</h3>
        <div className="control-grid">
          <button type="button" className="ctrl-btn" title="Rotacionar — arraste no canvas">↻</button>
          <button type="button" className="ctrl-btn" title="Zoom — scroll">⊕</button>
          <button type="button" className="ctrl-btn" title="Pan — botão direito">✥</button>
          <button type="button" className="ctrl-btn" onClick={onReset} title="Reiniciar">⟲</button>
          <button type="button" className="ctrl-btn" onClick={onTogglePause} title={paused ? 'Retomar' : 'Pausar'}>
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      </section>

      <section className="sidebar-block">
        <h3>Filtros</h3>
        <Toggle checked={showLinks} onChange={onToggleLinks} label="Mostrar Conexões" />
        <Toggle checked={showLabels} onChange={onToggleLabels} label="Mostrar Rótulos" />
        <Toggle checked={showParticles} onChange={onToggleParticles} label="Partículas (fluxo)" />
        <Toggle checked={showAnimations} onChange={onToggleAnimations} label="Animações" />
      </section>

      <section className="sidebar-block">
        <h3>Pesquisa</h3>
        <input
          type="search"
          placeholder="Módulo ou arquivo..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        <p className="filter-count">{filteredCount} nós visíveis</p>
      </section>

      <section className="sidebar-block legend">
        <h3>Legenda</h3>
        <p><span className="leg-line solid" /> Dependência direta</p>
        <p><span className="leg-line dashed" /> Comunicação</p>
        <p><span className="leg-line dotted" /> Fluxo de dados</p>
        <p className="size-legend">○ função · ● módulo · ◉ raiz</p>
      </section>
    </aside>
  );
}

export function Minimap({ laidOut, selectedId, links, activeCategories }) {
  const visible = laidOut.filter((n) => activeCategories.has(n.category));
  if (!visible.length) return null;

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  visible.forEach((n) => {
    minX = Math.min(minX, n.position.x);
    maxX = Math.max(maxX, n.position.x);
    minZ = Math.min(minZ, n.position.z);
    maxZ = Math.max(maxZ, n.position.z);
  });
  const w = maxX - minX || 1;
  const h = maxZ - minZ || 1;

  const ids = new Set(visible.map((n) => n.id));
  const visLinks = (links || []).filter((l) => ids.has(l.source) && ids.has(l.target));

  return (
    <div className="minimap">
      <span className="minimap-title">Mapa</span>
      <svg viewBox="0 0 100 100" className="minimap-svg">
        {visLinks.map((l) => {
          const a = visible.find((n) => n.id === l.source);
          const b = visible.find((n) => n.id === l.target);
          if (!a || !b) return null;
          const x1 = ((a.position.x - minX) / w) * 88 + 6;
          const y1 = ((a.position.z - minZ) / h) * 88 + 6;
          const x2 = ((b.position.x - minX) / w) * 88 + 6;
          const y2 = ((b.position.z - minZ) / h) * 88 + 6;
          return <line key={`${l.source}-${l.target}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="0.4" />;
        })}
        {visible.map((n) => {
          const cx = ((n.position.x - minX) / w) * 88 + 6;
          const cy = ((n.position.z - minZ) / h) * 88 + 6;
          const r = n.layer === 'root' ? 2.8 : n.layer === 'module' ? 1.8 : 0.9;
          return (
            <circle
              key={n.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={n.id === selectedId ? '#fff' : n.color}
              opacity={n.id === selectedId ? 1 : 0.75}
            />
          );
        })}
      </svg>
    </div>
  );
}
