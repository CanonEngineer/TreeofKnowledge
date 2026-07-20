import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
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
  onClick,
  onPointerOver,
  onPointerOut,
}) {
  const meshRef = useRef();
  const glowRef = useRef();
  const ringRef = useRef();
  const base = node.size * (node.layer === 'root' ? 1.15 : 1);
  const targetScale = selected ? base * 1.4 : hovered ? base * 1.25 : highlighted ? base * 1.1 : base;
  const opacity = dimmed ? 0.12 : 1;
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const floatY = animated && !dimmed ? Math.sin(t * 1.2 + hash(node.id) * 10) * 0.15 : 0;
    meshRef.current.position.y = floatY;
    if (glowRef.current) glowRef.current.position.y = floatY;
    if (ringRef.current) {
      ringRef.current.position.y = floatY;
      ringRef.current.rotation.z = t * 0.35;
    }

    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    const mat = meshRef.current.material;
    mat.emissiveIntensity += ((selected ? 2.2 : hovered ? 1.6 : highlighted ? 1.0 : 0.45) - mat.emissiveIntensity) * 0.08;
    mat.opacity += (opacity - mat.opacity) * 0.1;

    if (selected || hovered) meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {(selected || hovered || node.layer === 'root') && (
        <mesh ref={glowRef} scale={[base * 2.8, base * 2.8, base * 2.8]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={node.color} transparent opacity={selected ? 0.14 : 0.08} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} scale={[base * 1.8, base * 1.8, base * 1.8]}>
          <ringGeometry args={[0.85, 1, 48]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh
        ref={meshRef}
        scale={[base, base, base]}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(node); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onPointerOut(); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          transparent
          opacity={1}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
      <pointLight
        color={node.color}
        intensity={selected ? 3 : hovered ? 1.8 : highlighted ? 0.8 : 0.15}
        distance={base * 8}
      />
    </group>
  );
}

export function ConnectionBeam({ link, posMap, active, dimmed, showParticles, linkStyle }) {
  const start = posMap.get(link.source);
  const end = posMap.get(link.target);
  const p0 = useRef();
  const p1 = useRef();
  const p2 = useRef();

  const { curve, points } = useMemo(() => {
    if (!start || !end) return { curve: null, points: [] };
    const s = new THREE.Vector3(start.x, start.y, start.z);
    const e = new THREE.Vector3(end.x, end.y, end.z);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    mid.y += 1.2 + s.distanceTo(e) * 0.08;
    const c = new THREE.QuadraticBezierCurve3(s, mid, e);
    return { curve: c, points: c.getPoints(48).map((p) => [p.x, p.y, p.z]) };
  }, [start, end]);

  const color = active ? '#60a5fa' : dimmed ? '#1e293b' : '#475569';
  const opacity = active ? 1 : dimmed ? 0.06 : 0.42;
  const dashed = linkStyle === 'communication' || link.type === 'communication';

  useFrame(({ clock }) => {
    if (!showParticles || !active || !curve) return;
    [p0, p1, p2].forEach((ref, i) => {
      if (!ref.current) return;
      const t = (clock.elapsedTime * 0.28 + i * 0.33 + hash(link.source + link.target)) % 1;
      ref.current.position.copy(curve.getPoint(t));
    });
  });

  if (!curve || !points.length) return null;

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={active ? 2.2 : 1}
        transparent
        opacity={opacity}
        dashed={dashed}
        dashSize={0.8}
        gapSize={0.45}
      />
      {active && showParticles && (
        <>
          <mesh ref={p0}><sphereGeometry args={[0.22, 8, 8]} /><meshBasicMaterial color="#bfdbfe" /></mesh>
          <mesh ref={p1}><sphereGeometry args={[0.18, 8, 8]} /><meshBasicMaterial color="#93c5fd" /></mesh>
          <mesh ref={p2}><sphereGeometry args={[0.14, 8, 8]} /><meshBasicMaterial color="#dbeafe" /></mesh>
        </>
      )}
    </group>
  );
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
