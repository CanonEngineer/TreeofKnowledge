import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { zoomFromDistance } from '../utils/layout';

export function InitialCamera({ frames, graphKey }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!frames) return;
    camera.position.set(frames.overview.x, frames.overview.y, frames.overview.z);
    if (controls?.target) {
      controls.target.set(frames.center.x, frames.center.y, frames.center.z);
      controls.update();
    }
  }, [frames, graphKey, camera, controls]);

  return null;
}

export function ResetCamera({ trigger, frames }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!trigger || !frames) return;
    camera.position.set(frames.overview.x, frames.overview.y, frames.overview.z);
    if (controls?.target) {
      controls.target.set(frames.center.x, frames.center.y, frames.center.z);
      controls.update();
    }
  }, [trigger, frames, camera, controls]);

  return null;
}

export function CameraFocus({ target, frames }) {
  const { camera, controls } = useThree();
  const anim = useRef(null);

  useEffect(() => {
    if (!target || !frames) return;
    const detailZ = frames.detail.z - frames.center.z;
    const dest = new THREE.Vector3(
      target.x,
      target.y + 3,
      target.z + detailZ
    );
    const look = new THREE.Vector3(target.x, target.y, target.z);
    anim.current = { dest, look, t: 0 };
  }, [target, frames]);

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

export function ZoomTracker({ frames, onZoomChange }) {
  const { camera, controls } = useThree();
  const last = useRef(-1);

  useFrame(() => {
    if (!frames || !onZoomChange) return;
    const dist = camera.position.distanceTo(controls?.target || new THREE.Vector3(0, 0, 0));
    const pct = zoomFromDistance(dist, frames.overviewDistance);
    if (pct !== last.current) {
      last.current = pct;
      onZoomChange(pct);
    }
  });

  return null;
}
