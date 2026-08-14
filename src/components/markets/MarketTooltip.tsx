import type { Market } from "@/features/markets/market-types";
import {
  DIRECTION_ICON,
  DIRECTION_LABEL,
  formatLocalTime,
  formatPercent,
  formatSignedValue,
  formatValue,
} from "@/features/markets/market-utils";
import { DataStatusBadge, MarketStatusBadge } from "./MarketStatusBadge";

interface MarketTooltipProps {
  market: Market;
}

/** Compact hover summary — market name, status, and its primary instrument. */
export function MarketTooltip({ market }: MarketTooltipProps) {
  const primary = market.instruments[0] ?? null;

  return (
    <div
      role="status"
      className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-50">{market.country}</p>
          <p className="text-xs text-zinc-400">{market.exchange} · {market.city}</p>
        </div>
        <MarketStatusBadge status={market.marketStatus} />
      </div>

      {primary ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-zinc-400">{primary.name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-zinc-50">{formatValue(primary.value)}</span>
            {primary.direction && (
              <span
                className="text-sm font-medium"
                style={{
                  color:
                    primary.direction === "UP"
                      ? "#22c55e"
                      : primary.direction === "DOWN"
                        ? "#ef4444"
                        : "#9ca3af",
                }}
              >
                {DIRECTION_ICON[primary.direction]} {DIRECTION_LABEL[primary.direction]}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {formatSignedValue(primary.absoluteChange)} ({formatPercent(primary.percentageChange)})
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Updated {formatLocalTime(primary.lastUpdatedAt)}</span>
            <DataStatusBadge status={primary.dataStatus} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">No instrument data available.</p>
      )}

      <p className="mt-3 text-[11px] text-zinc-600">Click marker for full detail</p>
    </div>
  );
}
