import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MutableRefObject } from 'react';

const v = new THREE.Vector3();

/**
 * Projects world points to screen space every frame and moves the matching
 * DOM elements (absolutely positioned over the canvas). Points behind the
 * camera are hidden. A dependable replacement for per-element <Html> portals.
 */
export function ScreenAnchors({
  points,
  els,
}: {
  points: MutableRefObject<([number, number, number] | null)[]>;
  els: MutableRefObject<(HTMLElement | null)[]>;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    points.current.forEach((p, i) => {
      const el = els.current[i];
      if (!el) return;
      if (!p) {
        el.style.display = 'none';
        return;
      }
      v.set(p[0], p[1], p[2]).project(camera);
      if (v.z > 1 || v.z < -1) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    });
  });
  return null;
}
