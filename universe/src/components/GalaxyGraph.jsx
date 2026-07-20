import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Stars, GridFloor, NodeSphere, ConnectionBeam } from './SceneObjects';
import { CameraFocus, ResetCamera } from './CameraFocus';
import { computeLayout, getNeighbors } from '../utils/layout';

function Scene({
  graph,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  showLabels,
  showLinks,
  showParticles,
  activeCategories,
  resetCam,
}) {
  const laidOut = useMemo(() => computeLayout(graph), [graph]);
  const posMap = useMemo(() => new Map(laidOut.map((n) => [n.id, n.position])), [laidOut]);
  const links = graph.links || [];

  const focusNode = useMemo(() => {
    if (!selectedId) return null;
    const n = laidOut.find((x) => x.id === selectedId);
    return n ? n.position : null;
  }, [selectedId, laidOut]);

  const neighborSet = useMemo(
    () => (selectedId || hoveredId ? getNeighbors(selectedId || hoveredId, links) : null),
    [selectedId, hoveredId, links]
  );

  const hasFocus = Boolean(selectedId || hoveredId);

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 60, 180]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[20, 30, 20]} intensity={1.2} color="#60a5fa" />
      <pointLight position={[-25, -10, -15]} intensity={0.6} color="#a78bfa" />
      <Stars />
      <GridFloor />
      <ResetCamera trigger={resetCam} />
      <CameraFocus target={focusNode} />

      {showLinks &&
        links.map((link) => {
          const active =
            showParticles &&
            neighborSet &&
            (neighborSet.has(link.source) && neighborSet.has(link.target));
          const dimmed = hasFocus && !active;
          return (
            <ConnectionBeam
              key={`${link.source}-${link.target}`}
              link={link}
              posMap={posMap}
              active={active}
              dimmed={dimmed}
            />
          );
        })}

      {laidOut.map((node) => {
        if (!activeCategories.has(node.category)) return null;
        const selected = node.id === selectedId;
        const hovered = node.id === hoveredId;
        const highlighted = neighborSet?.has(node.id) ?? false;
        const dimmed = hasFocus && !highlighted;
        return (
          <group key={node.id}>
            <NodeSphere
              node={node}
              selected={selected}
              hovered={hovered}
              highlighted={highlighted}
              dimmed={dimmed}
              onClick={onSelect}
              onPointerOver={onHover}
              onPointerOut={() => onHover(null)}
            />
            {showLabels && (selected || hovered || node.layer === 'root' || node.layer === 'module') && (
              <Html
                position={[node.position.x, node.position.y + node.size + 0.8, node.position.z]}
                center
                distanceFactor={18}
                style={{ pointerEvents: 'none' }}
              >
                <span className="node-label">{node.label}</span>
              </Html>
            )}
          </group>
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={120}
        maxPolarAngle={Math.PI * 0.48}
      />
    </>
  );
}

export default function GalaxyGraph({
  graph,
  selectedId,
  onSelect,
  showLabels,
  showLinks,
  showParticles,
  activeCategories,
  resetCam,
  paused,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const handleHover = useCallback((node) => setHoveredId(node?.id ?? null), []);

  return (
    <Canvas
      camera={{ position: [0, 12, 48], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      frameloop={paused ? 'never' : 'always'}
    >
      <Suspense fallback={null}>
        <Scene
          graph={graph}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={handleHover}
          showLabels={showLabels}
          showLinks={showLinks}
          showParticles={showParticles}
          activeCategories={activeCategories}
          resetCam={resetCam}
        />
      </Suspense>
    </Canvas>
  );
}
