import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Stars({ count = 4000 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#88ccff" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

export function GridFloor() {
  return (
    <gridHelper args={[120, 40, '#1e3a5f', '#0f172a']} position={[0, -18, 0]} />
  );
}

export function NodeSphere({ node, selected, hovered, highlighted, dimmed, onClick, onPointerOver, onPointerOut }) {
  const meshRef = useRef();
  const targetScale = selected ? node.size * 1.35 : hovered ? node.size * 1.22 : highlighted ? node.size * 1.08 : node.size;
  const opacity = dimmed ? 0.15 : selected || hovered || highlighted ? 1 : 0.82;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    const mat = meshRef.current.material;
    mat.opacity += (opacity - mat.opacity) * 0.1;
    if (selected || hovered) {
      meshRef.current.rotation.y += 0.012;
    }
  });

  const color = new THREE.Color(node.color);

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      <mesh
        ref={meshRef}
        scale={[node.size, node.size, node.size]}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(node); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onPointerOut(); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.4 : hovered ? 1.1 : highlighted ? 0.75 : 0.35}
          transparent
          opacity={opacity}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
      {(selected || hovered) && (
        <mesh scale={[node.size * 1.5, node.size * 1.5, node.size * 1.5]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.12} wireframe />
        </mesh>
      )}
    </group>
  );
}

export function ConnectionBeam({ link, posMap, active, dimmed }) {
  const start = posMap.get(link.source);
  const end = posMap.get(link.target);
  const particleRef = useRef();
  if (!start || !end) return null;

  const curve = useMemo(() => {
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2 + 1.5,
      (start.z + end.z) / 2
    );
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(start.x, start.y, start.z),
      mid,
      new THREE.Vector3(end.x, end.y, end.z)
    );
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(32), [curve]);
  const color = active ? '#60a5fa' : dimmed ? '#1e293b' : '#334155';
  const opacity = active ? 0.95 : dimmed ? 0.08 : 0.35;

  useFrame(({ clock }) => {
    if (particleRef.current && active) {
      const t = (clock.elapsedTime * 0.35 + hash(link.source + link.target)) % 1;
      const p = curve.getPoint(t);
      particleRef.current.position.copy(p);
    }
  });

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={1} />
      </line>
      {active && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#93c5fd" />
        </mesh>
      )}
    </group>
  );
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
