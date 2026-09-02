import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { StarField, GridFloor, NodeSphere, ConnectionBeam } from './SceneObjects';
import { CameraFocus, ResetCamera } from './CameraFocus';
import { computeLayout, getNeighbors } from '../utils/layout';

function Scene({
  graph,
  selectedId,
  hoveredId,
  onSelect,
  onOpenCode,
  onHover,
  showLabels,
  showLinks,
  showParticles,
  showAnimations,
  activeCategories,
  resetCam,
  paused,
}) {
  const laidOut = useMemo(() => computeLayout(graph), [graph]);
  const posMap = useMemo(() => new Map(laidOut.map((n) => [n.id, n.position])), [laidOut]);
  const sizeMap = useMemo(
    () => new Map(laidOut.map((n) => [n.id, Math.max(0.55, n.size * (n.layer === 'root' ? 1.1 : 1))])),
    [laidOut]
  );
  const links = graph.links || [];
  const visibleIds = useMemo(() => {
    const ids = new Set();
    laidOut.forEach((node) => {
      if (activeCategories.has(node.category)) ids.add(node.id);
    });
    return ids;
  }, [laidOut, activeCategories]);

  const visibleLinks = useMemo(
    () => links.filter((link) => visibleIds.has(link.source) && visibleIds.has(link.target)),
    [links, visibleIds]
  );

  const focusNode = useMemo(() => {
    if (!selectedId) return null;
    const n = laidOut.find((x) => x.id === selectedId);
    return n ? n.position : null;
  }, [selectedId, laidOut]);

  const neighborSet = useMemo(
    () => (selectedId || hoveredId ? getNeighbors(selectedId || hoveredId, visibleLinks) : null),
    [selectedId, hoveredId, visibleLinks]
  );

  const hasFocus = Boolean(selectedId || hoveredId);

  return (
    <>
      <color attach="background" args={['#010409']} />
      <fog attach="fog" args={['#010409', 50, 150]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[30, 40, 20]} intensity={0.6} color="#93c5fd" />
      <pointLight position={[-30, 15, -25]} intensity={0.55} color="#818cf8" />
      <StarField />
      <GridFloor />
      <ResetCamera trigger={resetCam} />
      <CameraFocus target={focusNode} offset={[0, 4, 20]} />

      {showLinks &&
        visibleLinks.map((link, i) => {
          const connected = neighborSet?.has(link.source) && neighborSet.has(link.target);
          const active = Boolean(showParticles && connected);
          const dimmed = hasFocus && !connected;
          return (
            <ConnectionBeam
              key={`${link.source}-${link.target}-${i}`}
              link={link}
              posMap={posMap}
              sizeMap={sizeMap}
              active={active || (connected && !hasFocus)}
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
        // Com foco: só labels dos vizinhos (menos caos). Sem foco: root/module + arquivos.
        const showLabel =
          showLabels &&
          (selected ||
            hovered ||
            node.layer === 'root' ||
            node.layer === 'module' ||
            (!hasFocus && node.layer === 'file') ||
            (hasFocus && highlighted));

        return (
          <NodeSphere
            key={node.id}
            node={node}
            selected={selected}
            hovered={hovered}
            highlighted={highlighted}
            dimmed={dimmed}
            showLabel={showLabel}
            onClick={onSelect}
            onDoubleClick={(n) => {
              if (n.layer === 'root') return;
              onOpenCode(n);
            }}
            onPointerOver={onHover}
            onPointerOut={() => onHover(null)}
          />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={110}
        maxPolarAngle={Math.PI * 0.49}
        autoRotate={showAnimations && !hasFocus && !paused}
        autoRotateSpeed={0.28}
      />
    </>
  );
}

export default function GalaxyGraph(props) {
  const [hoveredId, setHoveredId] = useState(null);
  const handleHover = useCallback((node) => setHoveredId(node?.id ?? null), []);

  return (
    <Canvas
      camera={{ position: [0, 12, 48], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      frameloop={props.paused ? 'never' : 'always'}
    >
      <Suspense fallback={null}>
        <Scene {...props} hoveredId={hoveredId} onHover={handleHover} />
      </Suspense>
    </Canvas>
  );
}
