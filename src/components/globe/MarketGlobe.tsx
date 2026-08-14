"use client";

import { Stars, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useSyncExternalStore } from "react";
import type { Market } from "@/features/markets/market-types";
import type { GlobeInteractionState } from "@/hooks/use-globe-interaction";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { GlobeControls, type OrbitControlsHandle } from "./GlobeControls";
import { GlobeFallback } from "./GlobeFallback";
import { MarketMarker } from "./MarketMarker";

const GLOBE_RADIUS = 1.5;

// Public equirectangular Earth textures from the three-globe demo assets
// (widely used, CORS-enabled static files) — real country/continent
// geography instead of a flat placeholder color.
const EARTH_COLOR_MAP_URL = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_BUMP_MAP_URL = "https://unpkg.com/three-globe/example/img/earth-topology.png";

let cachedWebglSupport: boolean | null = null;

function hasWebGL(): boolean {
  if (cachedWebglSupport !== null) return cachedWebglSupport;
  try {
    const canvas = document.createElement("canvas");
    cachedWebglSupport = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    cachedWebglSupport = false;
  }
  return cachedWebglSupport;
}

// WebGL support never changes during a session, so this is a one-shot
// external-store read (via useSyncExternalStore) rather than a subscription.
function subscribeNoop(): () => void {
  return () => {};
}

function getServerSnapshot(): boolean {
  return false;
}

function Earth() {
  const [colorMap, bumpMap] = useTexture([EARTH_COLOR_MAP_URL, EARTH_BUMP_MAP_URL]);
  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.03}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      {/* Faint atmosphere glow around the rim. */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.06, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} side={1} />
      </mesh>
    </>
  );
}

function GlobeScene({
  markets,
  interaction,
  reducedMotion,
  controlsRef,
}: {
  markets: Market[];
  interaction: GlobeInteractionState;
  reducedMotion: boolean;
  controlsRef: React.RefObject<OrbitControlsHandle | null>;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 3, 5]} intensity={1.6} />
      <Stars
        radius={90}
        depth={50}
        count={reducedMotion ? 1500 : 4000}
        factor={3}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.6}
      />
      <Earth />
      {markets.map((market) => (
        <MarketMarker
          key={market.id}
          market={market}
          isActive={interaction.activeMarketId === market.id}
          isLocked={interaction.isLocked && interaction.selectedMarketId === market.id}
          reducedMotion={reducedMotion}
          onHover={interaction.onHover}
          onSelect={interaction.onSelect}
        />
      ))}
      <GlobeControls controlsRef={controlsRef} autoRotate={!reducedMotion && !interaction.isLocked} />
    </>
  );
}

interface MarketGlobeProps {
  markets: Market[];
  interaction: GlobeInteractionState;
}

export function MarketGlobe({ markets, interaction }: MarketGlobeProps) {
  const webglSupported = useSyncExternalStore(subscribeNoop, hasWebGL, getServerSnapshot);
  const reducedMotion = usePrefersReducedMotion();
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  if (!webglSupported) {
    return (
      <GlobeFallback
        markets={markets}
        onSelect={interaction.onSelect}
        reason="Your browser doesn't support WebGL, so the 3D globe can't render here. Showing markets as a list instead."
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="relative h-[42vh] min-h-[360px] w-full overflow-hidden rounded-xl border border-zinc-800/60 sm:h-[55vh] sm:min-h-[480px]"
        style={{
          touchAction: "none",
          background: "radial-gradient(ellipse at 50% 40%, #0b1730 0%, #05070d 70%, #000000 100%)",
        }}
      >
        {webglSupported && (
          <Canvas
            camera={{ position: [0, 0, 3.4], fov: 45 }}
            aria-label="Interactive 3D globe showing global stock market locations"
          >
            <Suspense fallback={null}>
              <GlobeScene
                markets={markets}
                interaction={interaction}
                reducedMotion={reducedMotion}
                controlsRef={controlsRef}
              />
            </Suspense>
          </Canvas>
        )}
        <button
          type="button"
          onClick={() => controlsRef.current?.reset()}
          className="absolute bottom-3 right-3 rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-100 backdrop-blur hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Reset view
        </button>
      </div>

      <details className="w-full rounded-lg border border-zinc-800 bg-zinc-950">
        <summary className="cursor-pointer select-none px-4 py-2 text-sm font-medium text-zinc-200">
          View markets as a list (keyboard accessible)
        </summary>
        <div className="p-3">
          <GlobeFallback markets={markets} onSelect={interaction.onSelect} />
        </div>
      </details>
    </div>
  );
}
