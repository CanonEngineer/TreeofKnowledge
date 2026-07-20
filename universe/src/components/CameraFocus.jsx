import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraFocus({ target, offset = [0, 4, 22] }) {
  const { camera, controls } = useThree();
  const anim = useRef(null);

  useEffect(() => {
    if (!target) return;
    const dest = new THREE.Vector3(target.x + offset[0], target.y + offset[1], target.z + offset[2]);
    const look = new THREE.Vector3(target.x, target.y, target.z);
    anim.current = { dest, look, t: 0 };
  }, [target, offset]);

  useFrame(() => {
    if (!anim.current) return;
    anim.current.t = Math.min(1, anim.current.t + 0.04);
    const ease = 1 - Math.pow(1 - anim.current.t, 3);
    camera.position.lerp(anim.current.dest, ease * 0.08);
    if (controls?.target) {
      controls.target.lerp(anim.current.look, ease * 0.1);
      controls.update();
    }
    if (anim.current.t >= 1) anim.current = null;
  });

  return null;
}

export function ResetCamera({ trigger }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!trigger) return;
    camera.position.set(0, 12, 48);
    if (controls?.target) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [trigger, camera, controls]);
  return null;
}
