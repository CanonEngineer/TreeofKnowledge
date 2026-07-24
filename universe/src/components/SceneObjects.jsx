import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function StarField({ count = 6000 }) {
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
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.45} color="#a5d8ff" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function GridFloor() {
  return (
    <group position={[0, -14, 0]}>
      <gridHelper args={[160, 50, '#1d4ed8', '#0f172a']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export function NodeSphere({
  node,
  selected,
  hovered,
  highlighted,
  dimmed,
  animated,
  showLabel,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}) {
  const meshRef = useRef();
  const glowRef = useRef();
  const ringRef = useRef();
  const base = Math.max(0.55, node.size * (node.layer === 'root' ? 1.1 : 1));
  const targetScale = selected ? 1.35 : hovered ? 1.2 : highlighted ? 1.08 : 1;
  const opacity = dimmed ? 0.18 : 1;
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    // Sem floatY — desincronizava esfera do raio / label
    if (animated && (selected || hovered)) {
      meshRef.current.rotation.y += 0.012;
    }
    meshRef.current.scale.lerp(new THREE.Vector3(base * targetScale, base * targetScale, base * targetScale), 0.12);
    const mat = meshRef.current.material;
    mat.emissiveIntensity += ((selected ? 2.0 : hovered ? 1.5 : highlighted ? 0.9 : 0.55) - mat.emissiveIntensity) * 0.1;
    mat.opacity += (opacity - mat.opacity) * 0.12;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.35;
  });

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {(selected || hovered || node.layer === 'root') && (
        <mesh ref={glowRef} scale={[base * (node.layer === 'root' ? 1.55 : 2.2), base * (node.layer === 'root' ? 1.55 : 2.2), base * (node.layer === 'root' ? 1.55 : 2.2)]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={node.color} transparent opacity={selected ? 0.14 : 0.07} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} scale={[base * 1.7, base * 1.7, base * 1.7]}>
          <ringGeometry args={[0.85, 1, 48]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh
        ref={meshRef}
        scale={[base, base, base]}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onDoubleClick) onDoubleClick(node);
        }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(node); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onPointerOut(); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={1}
          roughness={0.2}
          metalness={0.75}
        />
      </mesh>
      <pointLight
        color={node.color}
        intensity={selected ? 2.4 : hovered ? 1.4 : 0.25}
        distance={base * 7}
      />
      {/* Label no MESMO grupo da esfera — mesmo ponto do raio */}
      {showLabel && (
        <Html
          position={[0, base + 0.35, 0]}
          center
          sprite
          distanceFactor={22}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span
            className={`node-label ${selected ? 'selected' : ''} ${node.layer || ''}`}
            style={{ borderColor: node.color, boxShadow: `0 0 10px ${node.color}44` }}
          >
            {node.label}
          </span>
        </Html>
      )}
    </group>
  );
}

/** Aresta em world-space (THREE.Line) — não usa Line2/screen-space do drei, que desalinha com Html. */
export function ConnectionBeam({ link, posMap, sizeMap, active, dimmed }) {
  const objRef = useRef();

  const { positions, color, opacity } = useMemo(() => {
    const start = posMap.get(link.source);
    const end = posMap.get(link.target);
    if (!start || !end) return { positions: null, color: '#475569', opacity: 0 };

    const s0 = new THREE.Vector3(start.x, start.y, start.z);
    const e0 = new THREE.Vector3(end.x, end.y, end.z);
    const dir = e0.clone().sub(s0);
    const dist = dir.length();
    if (dist < 0.01) return { positions: null, color: '#475569', opacity: 0 };
    dir.multiplyScalar(1 / dist);

    const rs = (sizeMap?.get(link.source) || 0.85) * 0.95;
    const re = (sizeMap?.get(link.target) || 0.85) * 0.95;
    const s = s0.clone().addScaledVector(dir, Math.min(rs, dist * 0.35));
    const e = e0.clone().addScaledVector(dir, -Math.min(re, dist * 0.35));

    return {
      positions: new Float32Array([s.x, s.y, s.z, e.x, e.y, e.z]),
      color: active ? '#60a5fa' : dimmed ? '#1e293b' : '#64748b',
      opacity: active ? 0.95 : dimmed ? 0.08 : 0.55,
    };
  }, [link.source, link.target, posMap, sizeMap, active, dimmed]);

  const line = useMemo(() => {
    if (!positions) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [positions, color, opacity]);

  useEffect(() => () => {
    if (!line) return;
    line.geometry.dispose();
    line.material.dispose();
  }, [line]);

  if (!line) return null;
  return <primitive ref={objRef} object={line} />;
}
