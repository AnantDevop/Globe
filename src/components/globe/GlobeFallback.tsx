import type { Market } from "@/features/markets/market-types";
import { MARKET_STATUS_LABEL } from "@/features/markets/market-utils";

interface GlobeFallbackProps {
  markets: Market[];
  onSelect: (marketId: string) => void;
  reason?: string;
}

/**
 * Accessible, non-WebGL alternative to the 3D globe. Used both as a hard
 * fallback when WebGL is unavailable and as the keyboard-navigable market
 * list required for accessibility alongside the canvas.
 */
export function GlobeFallback({ markets, onSelect, reason }: GlobeFallbackProps) {
  return (
    <div className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      {reason && <p className="mb-3 text-sm text-amber-400">{reason}</p>}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Markets list">
        {markets.map((market) => (
          <li key={market.id}>
            <button
              type="button"
              onClick={() => onSelect(market.id)}
              className="flex w-full flex-col items-start rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm text-zinc-100 hover:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span className="font-medium">{market.country}</span>
              <span className="text-xs text-zinc-400">
                {market.exchange} · {MARKET_STATUS_LABEL[market.marketStatus]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
