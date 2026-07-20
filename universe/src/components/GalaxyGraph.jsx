import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
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
      <color attach="background" args={['#010409']} />
      <fog attach="fog" args={['#010409', 45, 160]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[30, 40, 20]} intensity={0.55} color="#93c5fd" />
      <pointLight position={[-30, 15, -25]} intensity={0.9} color="#818cf8" />
      <pointLight position={[0, -10, 30]} intensity={0.35} color="#22d3ee" />
      <StarField />
      <GridFloor />
      <ResetCamera trigger={resetCam} />
      <CameraFocus target={focusNode} offset={[0, 3, 18]} />

      {showLinks &&
        links.map((link, i) => {
          const connected = neighborSet?.has(link.source) && neighborSet.has(link.target);
          const active = showParticles && connected;
          const dimmed = hasFocus && !connected;
          const style = i % 7 === 0 ? 'communication' : i % 11 === 0 ? 'dataflow' : 'dependency';
          return (
            <ConnectionBeam
              key={`${link.source}-${link.target}`}
              link={{ ...link, type: style === 'dependency' ? link.type : style }}
              posMap={posMap}
              active={active || (connected && !hasFocus)}
              dimmed={dimmed}
              showParticles={showParticles}
              linkStyle={style}
            />
          );
        })}

      {laidOut.map((node) => {
        if (!activeCategories.has(node.category)) return null;
        const selected = node.id === selectedId;
        const hovered = node.id === hoveredId;
        const highlighted = neighborSet?.has(node.id) ?? false;
        const dimmed = hasFocus && !highlighted;
        const showLabel =
          showLabels &&
          (selected || hovered || node.layer === 'root' || node.layer === 'module' || (!hasFocus && node.layer === 'file'));

        return (
          <group key={node.id}>
            <NodeSphere
              node={node}
              selected={selected}
              hovered={hovered}
              highlighted={highlighted}
              dimmed={dimmed}
              animated={showAnimations}
              onClick={onSelect}
              onDoubleClick={(node) => {
                if (node.layer === 'root') return;
                onOpenCode(node);
              }}
              onPointerOver={onHover}
              onPointerOut={() => onHover(null)}
            />
            {showLabel && (
              <Html
                position={[node.position.x, node.position.y + node.size * 1.6 + 0.5, node.position.z]}
                center
                distanceFactor={14}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <span
                  className={`node-label ${selected ? 'selected' : ''} ${node.layer}`}
                  style={{ borderColor: node.color, boxShadow: `0 0 12px ${node.color}55` }}
                >
                  {node.label}
                </span>
              </Html>
            )}
          </group>
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={100}
        maxPolarAngle={Math.PI * 0.52}
        autoRotate={showAnimations && !hasFocus && !paused}
        autoRotateSpeed={0.35}
      />

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.85} intensity={1.35} radius={0.75} />
        <Vignette eskil offset={0.12} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function GalaxyGraph(props) {
  const [hoveredId, setHoveredId] = useState(null);
  const handleHover = useCallback((node) => setHoveredId(node?.id ?? null), []);

  return (
    <Canvas
      camera={{ position: [0, 8, 42], fov: 52 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      frameloop={props.paused ? 'never' : 'always'}
    >
      <Suspense fallback={null}>
        <Scene {...props} hoveredId={hoveredId} onHover={handleHover} />
      </Suspense>
    </Canvas>
  );
}
