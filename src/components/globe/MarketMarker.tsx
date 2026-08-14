"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { Market } from "@/features/markets/market-types";
import { aggregateDataStatus } from "@/features/markets/freshness";
import { isMarketOpen, latLonToVector3, markerColor } from "@/features/markets/market-utils";

const GLOBE_RADIUS = 1.5;

interface MarketMarkerProps {
  market: Market;
  isActive: boolean;
  isLocked: boolean;
  reducedMotion: boolean;
  onHover: (marketId: string | null) => void;
  onSelect: (marketId: string) => void;
}

export function MarketMarker({
  market,
  isActive,
  isLocked,
  reducedMotion,
  onHover,
  onSelect,
}: MarketMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const position = latLonToVector3(market.latitude, market.longitude, GLOBE_RADIUS + 0.02);

  const dataStatus = aggregateDataStatus(market.instruments);
  const primaryDirection = market.instruments[0]?.direction ?? null;
  const color = markerColor(market.marketStatus, dataStatus, primaryDirection);
  const open = isMarketOpen(market.marketStatus);
  const baseSize = open ? 0.07 : 0.05;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (reducedMotion || !open) {
      meshRef.current.scale.setScalar(isActive ? 1.4 : 1);
      return;
    }
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.5) * 0.15;
    meshRef.current.scale.setScalar((isActive ? 1.4 : 1) * pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(market.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(market.id);
        }}
        aria-label={`${market.country} market marker`}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={open ? 0.9 : 0.25}
          opacity={market.marketStatus === "CLOSED" ? 0.6 : 1}
          transparent
        />
      </mesh>
      {isActive && !isLocked && (
        <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded bg-zinc-950/90 px-2 py-1 text-xs font-medium text-zinc-50 shadow-lg">
            {market.country}
          </div>
        </Html>
      )}
    </group>
  );
}
