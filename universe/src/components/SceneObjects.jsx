import { useRef, useMemo, useEffect, useLayoutEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

const noopRaycast = () => null;

export function StarField({ count = 5000 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 90 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.004;
  });

  return (
    <points ref={ref} raycast={noopRaycast}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#a5d8ff" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function GridFloor({ floorY = -14 }) {
  const groupRef = useRef();

  useLayoutEffect(() => {
    groupRef.current?.traverse((child) => {
      child.raycast = noopRaycast;
    });
  }, [floorY]);

  return (
    <group ref={groupRef} position={[0, floorY, 0]}>
      <gridHelper args={[160, 50, '#1d4ed8', '#0f172a']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/** Textura 2D no WebGL — mesmo sistema de coordenadas das arestas (sem Html/CSS). */
function makeLabelTexture(text, borderColor, emphasis) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const padX = 14;
  const padY = 8;
  const font = emphasis ? '600 28px JetBrains Mono, Consolas, monospace' : '500 24px JetBrains Mono, Consolas, monospace';
  ctx.font = font;
  const label = text.length > 28 ? `${text.slice(0, 27)}…` : text;
  const tw = Math.ceil(ctx.measureText(label).width);
  const w = tw + padX * 2;
  const h = 36 + padY;
  canvas.width = w;
  canvas.height = h;

  ctx.fillStyle = emphasis ? 'rgba(15, 23, 42, 0.95)' : 'rgba(2, 6, 23, 0.88)';
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 6);
  ctx.fill();
  ctx.strokeStyle = borderColor || '#38bdf8';
  ctx.lineWidth = emphasis ? 2.5 : 1.5;
  roundRect(ctx, 1, 1, w - 2, h - 2, 6);
  ctx.stroke();
  ctx.font = font;
  ctx.fillStyle = '#f8fafc';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, padX, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const aspect = w / h;
  return { tex, aspect, worldH: emphasis ? 1.15 : 0.95 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function NodeSphereInner({
  node,
  selected,
  hovered,
  highlighted,
  dimmed,
  showLabel,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}) {
  const groupRef = useRef();
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  const layerScale = node.layer === 'root' ? 0.42 : node.layer === 'module' ? 0.38 : node.layer === 'file' ? 0.34 : 0.32;
  const layerMin = node.layer === 'root' ? 0.55 : node.layer === 'module' ? 0.46 : node.layer === 'file' ? 0.38 : 0.34;
  const core = Math.max(layerMin, (node.size || 0.85) * layerScale);
  const color = useMemo(() => new THREE.Color(node.color || '#38bdf8'), [node.color]);
  const opacity = dimmed ? 0.15 : 1;
  const labelEmphasis = selected || hovered;

  const labelGfx = useMemo(() => {
    if (!showLabel) return null;
    return makeLabelTexture(node.label || node.id, node.color, labelEmphasis);
  }, [showLabel, node.label, node.id, node.color, labelEmphasis]);

  useEffect(() => () => {
    labelGfx?.tex?.dispose();
  }, [labelGfx]);

  useEffect(() => {
    const s = selected ? 1.12 : hovered ? 1.06 : 1;
    targetScale.current.set(s, s, s);
  }, [selected, hovered]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!selected && !hovered && groupRef.current.scale.x === 1) return;
    groupRef.current.scale.lerp(targetScale.current, 0.15);
  });

  const labelW = labelGfx ? labelGfx.worldH * labelGfx.aspect : 1;
  const labelH = labelGfx ? labelGfx.worldH : 1;

  const handlePointerOver = (e) => {
    e.stopPropagation();
    onPointerOver(node);
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    onPointerOut(node);
  };

  return (
    <group ref={groupRef} position={[node.position.x, node.position.y, node.position.z]}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onDoubleClick) onDoubleClick(node);
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[core, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 2.2 : hovered ? 1.6 : highlighted ? 1.1 : 0.7}
          transparent
          opacity={opacity}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>

      {(selected || hovered || node.layer === 'root') && (
        <mesh scale={[core * 2.4, core * 2.4, core * 2.4]} raycast={noopRaycast}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}

      {labelGfx && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh
            position={[0, 0, core + 0.02]}
            renderOrder={2}
            raycast={noopRaycast}
            onClick={(e) => { e.stopPropagation(); onClick(node); }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (onDoubleClick) onDoubleClick(node);
            }}
          >
            <planeGeometry args={[labelW, labelH]} />
            <meshBasicMaterial
              map={labelGfx.tex}
              transparent
              opacity={opacity}
              depthTest
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

export const NodeSphere = memo(NodeSphereInner);

function ConnectionBeamInner({ link, posMap, sizeMap, active, dimmed }) {
  const lineRef = useRef(null);

  const geometry = useMemo(() => {
    const start = posMap.get(link.source);
    const end = posMap.get(link.target);
    if (!start || !end) return null;

    const s0 = new THREE.Vector3(start.x, start.y, start.z);
    const e0 = new THREE.Vector3(end.x, end.y, end.z);
    const dir = e0.clone().sub(s0);
    const dist = dir.length();
    if (dist < 0.01) return null;
    dir.multiplyScalar(1 / dist);

    const rs = Math.max(0.34, (sizeMap?.get(link.source) || 0.85) * 0.36);
    const re = Math.max(0.34, (sizeMap?.get(link.target) || 0.85) * 0.36);
    const s = s0.clone().addScaledVector(dir, rs);
    const e = e0.clone().addScaledVector(dir, -re);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([s.x, s.y, s.z, e.x, e.y, e.z]), 3)
    );
    return geo;
  }, [link.source, link.target, posMap, sizeMap]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({
      color: '#94a3b8',
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
    []
  );

  useEffect(() => () => {
    geometry?.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    if (!material) return;
    material.color.set(active ? '#7dd3fc' : dimmed ? '#1e293b' : '#94a3b8');
    material.opacity = active ? 1 : dimmed ? 0.07 : 0.65;
  }, [material, active, dimmed]);

  if (!geometry) return null;

  return (
    <line ref={lineRef} geometry={geometry} material={material} raycast={noopRaycast} />
  );
}

export const ConnectionBeam = memo(ConnectionBeamInner);
