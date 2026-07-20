import { useCallback, useEffect, useMemo, useState } from 'react';
import GalaxyGraph from './components/GalaxyGraph';
import { LeftSidebar, SidePanel, Minimap } from './components/SidePanel';
import { getProjectSlug } from './utils/layout';

export default function App() {
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [paused, setPaused] = useState(false);
  const [resetCam, setResetCam] = useState(0);
  const [activeCategories, setActiveCategories] = useState(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  const slug = getProjectSlug();

  useEffect(() => {
    fetch(`./graphs/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Grafo não encontrado: ${slug}`);
        return r.json();
      })
      .then((data) => {
        setGraph(data);
        setActiveCategories(new Set(Object.keys(data.categories || {})));
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId]
  );

  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    const q = search.trim().toLowerCase();
    let nodes = graph.nodes.filter((n) => activeCategories.has(n.category));
    if (q) {
      nodes = nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          (n.file && n.file.toLowerCase().includes(q)) ||
          n.id.toLowerCase().includes(q)
      );
    }
    const ids = new Set(nodes.map((n) => n.id));
    const links = graph.links.filter((l) => ids.has(l.source) && ids.has(l.target));
    return { ...graph, nodes, links };
  }, [graph, activeCategories, search]);

  const toggleCategory = useCallback((key) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleViewCode = useCallback(
    (node) => {
      window.location.href = `../node.html?tree=${slug}&node=${encodeURIComponent(node.id)}`;
    },
    [slug]
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  if (error) {
    return (
      <div className="app-error">
        <h1>Galaxy 3D</h1>
        <p>{error}</p>
        <a href="../index.html">Voltar à árvore</a>
      </div>
    );
  }

  if (!filteredGraph) {
    return <div className="app-loading">Carregando universo…</div>;
  }

  return (
    <div className={`app ${fullscreen ? 'fullscreen' : ''}`}>
      <LeftSidebar
        graph={filteredGraph}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showLinks={showLinks}
        onToggleLinks={() => setShowLinks((v) => !v)}
        showParticles={showParticles}
        onToggleParticles={() => setShowParticles((v) => !v)}
        paused={paused}
        onTogglePause={() => setPaused((v) => !v)}
        onReset={() => { setResetCam((n) => n + 1); setSelectedId(null); }}
        search={search}
        onSearch={setSearch}
        filteredCount={filteredGraph.nodes.length}
      />

      <main className="canvas-wrap">
        <GalaxyGraph
          graph={filteredGraph}
          selectedId={selectedId}
          onSelect={(node) => setSelectedId(node.id === selectedId ? null : node.id)}
          showLabels={showLabels}
          showLinks={showLinks}
          showParticles={showParticles}
          activeCategories={activeCategories}
          resetCam={resetCam}
          paused={paused}
        />
        <button type="button" className="fs-btn" onClick={toggleFullscreen} title="Tela cheia">
          {fullscreen ? '⤓' : '⤢'}
        </button>
        <Minimap graph={filteredGraph} selectedId={selectedId} activeCategories={activeCategories} />
      </main>

      <SidePanel
        node={selectedNode}
        graph={filteredGraph}
        onClose={() => setSelectedId(null)}
        onViewCode={handleViewCode}
      />
    </div>
  );
}
