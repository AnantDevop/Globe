"use client";

import { OrbitControls } from "@react-three/drei";
import type { ComponentRef, RefObject } from "react";

export type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

interface GlobeControlsProps {
  controlsRef: RefObject<OrbitControlsHandle | null>;
  autoRotate: boolean;
}

export function GlobeControls({ controlsRef, autoRotate }: GlobeControlsProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minDistance={2.2}
      maxDistance={6}
      autoRotate={autoRotate}
      autoRotateSpeed={0.4}
    />
  );
}
