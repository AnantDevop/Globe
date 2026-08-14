import type { Market } from "@/features/markets/market-types";
import { computeMarketSummary, formatPercent } from "@/features/markets/market-utils";

interface MarketSummaryProps {
  markets: Market[];
}

export function MarketSummary({ markets }: MarketSummaryProps) {
  const stats = computeMarketSummary(markets);

  return (
    <section
      aria-label="Market summary"
      className="grid w-full max-w-2xl grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-3"
    >
      <div>
        <p className="text-xs text-zinc-500">Open</p>
        <p className="text-xl font-semibold text-green-400">{stats.openCount}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Closed</p>
        <p className="text-xl font-semibold text-zinc-300">{stats.closedCount}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Unavailable</p>
        <p className="text-xl font-semibold text-zinc-500">{stats.unavailableCount}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className="text-xs text-zinc-500">Strongest riser</p>
        {stats.strongestRiser ? (
          <p className="text-sm font-medium text-green-400">
            {stats.strongestRiser.instrumentName} ({stats.strongestRiser.country}){" "}
            {formatPercent(stats.strongestRiser.percentageChange)}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </div>
      <div>
        <p className="text-xs text-zinc-500">Largest faller</p>
        {stats.largestFaller ? (
          <p className="text-sm font-medium text-red-400">
            {stats.largestFaller.instrumentName} ({stats.largestFaller.country}){" "}
            {formatPercent(stats.largestFaller.percentageChange)}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </div>
      <div>
        <p className="text-xs text-zinc-500">Active session</p>
        <p className="text-sm font-medium text-zinc-200">
          {stats.activeRegions.length > 0 ? stats.activeRegions.join(", ") : "No markets open"}
        </p>
      </div>
    </section>
  );
}
