"use client";

import { MarketGlobe } from "@/components/globe/MarketGlobe";
import { MarketDetailPanel } from "@/components/markets/MarketDetailPanel";
import { MarketSummary } from "@/components/markets/MarketSummary";
import { MarketTooltip } from "@/components/markets/MarketTooltip";
import { DATA_STATUS_LABEL } from "@/features/markets/market-utils";
import { useGlobeInteraction } from "@/hooks/use-globe-interaction";
import { useMarketUpdates } from "@/hooks/use-market-updates";
import { useMarkets } from "@/hooks/use-markets";

export default function Home() {
  const { markets, meta, isLoading, error, lastSyncedAt } = useMarkets();
  const interaction = useGlobeInteraction();
  const { market: liveSelectedMarket } = useMarketUpdates(interaction.selectedMarketId);

  const hoveredMarket =
    !interaction.isLocked && interaction.activeMarketId
      ? markets.find((market) => market.id === interaction.activeMarketId) ?? null
      : null;

  const lockedMarket = interaction.selectedMarketId
    ? liveSelectedMarket ?? markets.find((market) => market.id === interaction.selectedMarketId) ?? null
    : null;

  return (
    <div className="flex w-full flex-1 flex-col gap-6 pb-6">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-50">Global Market Globe</h1>
        <p className="mt-1 text-sm text-zinc-400">
          A read-only view of major stock-market indices around the world. Rotate and zoom the
          globe, then hover or tap a market for details.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300"
          >
            Couldn&apos;t reach the market-data API. Retrying automatically — showing the most
            recent data available.
          </div>
        )}
      </div>

      {/* Full-bleed globe hero — takes roughly half the viewport height. */}
      <div className="relative w-full px-0 sm:px-4">
        <div className="mx-auto w-full max-w-7xl">
          <MarketGlobe markets={markets} interaction={interaction} />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <MarketSummary markets={markets} />

        <aside className="flex flex-col gap-4" aria-label="Market details">
          {lockedMarket ? (
            <MarketDetailPanel market={lockedMarket} onClose={interaction.onClose} />
          ) : hoveredMarket ? (
            <MarketTooltip market={hoveredMarket} />
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
              Hover or tap a marker on the globe to see market details.
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500">
            <p>
              <span className="font-medium text-zinc-300">Data status: </span>
              {meta ? DATA_STATUS_LABEL[meta.dataStatus] : isLoading ? "Loading…" : "—"}
            </p>
            <p className="mt-1">
              <span className="font-medium text-zinc-300">Provider: </span>
              {meta?.provider ?? "—"}
            </p>
            <p className="mt-1">
              <span className="font-medium text-zinc-300">Last synced: </span>
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : "—"}
            </p>
            <p className="mt-3 border-t border-zinc-800 pt-3 text-zinc-600">
              Index data is provided for informational purposes only and is not investment advice.
              Demo/mock data is clearly labeled. See{" "}
              <a href="/about" className="underline hover:text-zinc-400">
                About &amp; Data
              </a>{" "}
              for details on data freshness and providers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
