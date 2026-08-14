import type { Market, MarketInstrument } from "@/features/markets/market-types";
import {
  DIRECTION_ICON,
  DIRECTION_LABEL,
  formatLocalTime,
  formatPercent,
  formatSignedValue,
  formatValue,
} from "@/features/markets/market-utils";
import { DataStatusBadge, MarketStatusBadge } from "./MarketStatusBadge";

interface MarketDetailPanelProps {
  market: Market;
  onClose: () => void;
}

function InstrumentRow({ instrument }: { instrument: MarketInstrument }) {
  const directionColor =
    instrument.direction === "UP"
      ? "#22c55e"
      : instrument.direction === "DOWN"
        ? "#ef4444"
        : "#9ca3af";

  return (
    <li className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-100">{instrument.name}</span>
        <DataStatusBadge status={instrument.dataStatus} />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-base font-semibold text-zinc-50">
          {formatValue(instrument.value)}
          {instrument.currency ? ` ${instrument.currency}` : ""}
        </span>
        {instrument.direction && (
          <span className="text-sm font-medium" style={{ color: directionColor }}>
            {DIRECTION_ICON[instrument.direction]} {DIRECTION_LABEL[instrument.direction]}
          </span>
        )}
        <span className="text-sm text-zinc-400">
          {formatSignedValue(instrument.absoluteChange)} ({formatPercent(instrument.percentageChange)})
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Updated {formatLocalTime(instrument.lastUpdatedAt)}
        {instrument.provider ? ` · ${instrument.provider}` : ""}
      </p>
    </li>
  );
}

export function MarketDetailPanel({ market, onClose }: MarketDetailPanelProps) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-50">{market.country}</h2>
          <p className="text-xs text-zinc-400">
            {market.exchange} · {market.city}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close market details"
          className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Close
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <MarketStatusBadge status={market.marketStatus} />
        {market.statusReason && <span className="text-xs text-zinc-500">{market.statusReason}</span>}
      </div>

      {(market.nextOpenAt || market.nextCloseAt) && (
        <p className="mt-2 text-xs text-zinc-500">
          {market.marketStatus === "OPEN" && market.nextCloseAt
            ? `Closes ${formatLocalTime(market.nextCloseAt, market.timezone)}`
            : market.nextOpenAt
              ? `Opens ${formatLocalTime(market.nextOpenAt, market.timezone)}`
              : null}
        </p>
      )}

      <ul className="mt-4 space-y-2" aria-label={`${market.country} instruments`}>
        {market.instruments.length > 0 ? (
          market.instruments.map((instrument) => (
            <InstrumentRow key={instrument.id} instrument={instrument} />
          ))
        ) : (
          <li className="text-xs text-zinc-500">No instruments configured for this market.</li>
        )}
      </ul>
    </div>
  );
}
