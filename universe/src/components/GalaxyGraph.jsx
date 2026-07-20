import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { StarField, GridFloor, NodeSphere, ConnectionBeam } from './SceneObjects';
import { ApplyOverviewCamera, ResetCamera, CameraFocus, ZoomTracker } from './CameraFocus';
import { computeLayout, computeGraphBounds, computeCameraFrames, getNeighbors } from '../utils/layout';

function Scene({
  graph,
  cameraFrames,
  cameraVersion,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  showLabels,
  showLinks,
  showParticles,
  showAnimations,
  activeCategories,
  resetCam,
  paused,
  onZoomChange,
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
      <fog attach="fog" args={['#010409', cameraFrames.overviewDistance * 0.6, cameraFrames.overviewDistance * 3.2]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[30, 40, 20]} intensity={0.55} color="#93c5fd" />
      <pointLight position={[-30, 15, -25]} intensity={0.9} color="#818cf8" />
      <pointLight position={[0, -10, 30]} intensity={0.35} color="#22d3ee" />
      <StarField />
      <GridFloor />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={cameraFrames.minDistance}
        maxDistance={cameraFrames.maxDistance}
        target={[cameraFrames.center.x, cameraFrames.center.y, cameraFrames.center.z]}
        maxPolarAngle={Math.PI * 0.52}
        autoRotate={showAnimations && !hasFocus && !paused}
        autoRotateSpeed={0.35}
      />

      <ApplyOverviewCamera frames={cameraFrames} version={cameraVersion} />
      <ResetCamera trigger={resetCam} frames={cameraFrames} />
      <CameraFocus target={focusNode} frames={cameraFrames} />
      <ZoomTracker frames={cameraFrames} onZoomChange={onZoomChange} />

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

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.85} intensity={1.35} radius={0.75} />
        <Vignette eskil offset={0.12} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function GalaxyGraph({ graph, onZoomChange, ...props }) {
  const [hoveredId, setHoveredId] = useState(null);
  const handleHover = useCallback((node) => setHoveredId(node?.id ?? null), []);

  const laidOut = useMemo(() => computeLayout(graph), [graph]);
  const cameraFrames = useMemo(() => {
    const aspect = typeof window !== 'undefined' ? window.innerWidth / Math.max(window.innerHeight, 1) : 16 / 9;
    return computeCameraFrames(computeGraphBounds(laidOut), 52, aspect);
  }, [laidOut]);

  const canvasKey = `${graph.slug}-${graph.nodes.length}`;

  return (
    <Canvas
      key={canvasKey}
      camera={{
        fov: 52,
        near: 0.1,
        far: Math.max(800, cameraFrames.overviewDistance * 5),
        position: [cameraFrames.overview.x, cameraFrames.overview.y, cameraFrames.overview.z],
      }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      frameloop={props.paused ? 'never' : 'always'}
    >
      <Suspense fallback={null}>
        <Scene
          {...props}
          graph={graph}
          cameraFrames={cameraFrames}
          cameraVersion={canvasKey}
          hoveredId={hoveredId}
          onHover={handleHover}
          onZoomChange={onZoomChange}
        />
      </Suspense>
    </Canvas>
  );
}
