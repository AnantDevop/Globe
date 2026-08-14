import type { DataStatus, MarketStatus } from "@/features/markets/market-types";
import { DATA_STATUS_LABEL, MARKET_STATUS_LABEL } from "@/features/markets/market-utils";

const MARKET_STATUS_DOT: Record<MarketStatus, string> = {
  OPEN: "bg-green-500",
  CLOSED: "bg-zinc-500",
  PRE_MARKET: "bg-amber-500",
  POST_MARKET: "bg-amber-500",
  HOLIDAY: "bg-zinc-500",
  UNAVAILABLE: "bg-zinc-600",
};

const DATA_STATUS_DOT: Record<DataStatus, string> = {
  LIVE: "bg-green-500",
  DELAYED: "bg-amber-500",
  STALE: "bg-amber-500",
  EOD: "bg-sky-500",
  MOCK: "bg-purple-500",
  UNAVAILABLE: "bg-zinc-600",
};

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-200">
      <span className={`h-1.5 w-1.5 rounded-full ${MARKET_STATUS_DOT[status]}`} aria-hidden="true" />
      {MARKET_STATUS_LABEL[status]}
    </span>
  );
}

export function DataStatusBadge({ status }: { status: DataStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-200">
      <span className={`h-1.5 w-1.5 rounded-full ${DATA_STATUS_DOT[status]}`} aria-hidden="true" />
      {DATA_STATUS_LABEL[status]}
    </span>
  );
}
