import type { DataStatus, Market, MarketDirection, MarketStatus } from "./market-types";

export const DIRECTION_COLOR: Record<MarketDirection, string> = {
  UP: "#22c55e",
  DOWN: "#ef4444",
  UNCHANGED: "#9ca3af",
};

export const DIRECTION_LABEL: Record<MarketDirection, string> = {
  UP: "Up",
  DOWN: "Down",
  UNCHANGED: "Unchanged",
};

export const DIRECTION_ICON: Record<MarketDirection, string> = {
  UP: "▲",
  DOWN: "▼",
  UNCHANGED: "▬",
};

export const MARKET_STATUS_LABEL: Record<MarketStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  PRE_MARKET: "Pre-market",
  POST_MARKET: "Post-market",
  HOLIDAY: "Holiday",
  UNAVAILABLE: "Unavailable",
};

export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  LIVE: "Live",
  DELAYED: "Delayed",
  STALE: "Stale",
  EOD: "End of day",
  MOCK: "Demo data",
  UNAVAILABLE: "Unavailable",
};

/**
 * Marker fill color follows the product's color rules: gray for
 * unavailable data, amber for delayed/stale, otherwise movement color
 * (green/red/neutral). Color is always paired with a text/icon label
 * elsewhere — never used as the only signal.
 */
export function markerColor(marketStatus: MarketStatus, dataStatus: DataStatus, direction: MarketDirection | null): string {
  if (dataStatus === "UNAVAILABLE" || marketStatus === "UNAVAILABLE") return "#6b7280";
  if (dataStatus === "DELAYED" || dataStatus === "STALE") return "#f59e0b";
  if (!direction) return "#9ca3af";
  return DIRECTION_COLOR[direction];
}

export function isMarketOpen(marketStatus: MarketStatus): boolean {
  return marketStatus === "OPEN";
}

export function formatValue(value: number | null, fractionDigits = 2): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatSignedValue(value: number | null, fractionDigits = 2): string {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatValue(value, fractionDigits)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Converts latitude/longitude (degrees) to a point on a unit sphere. */
export function latLonToVector3(latitude: number, longitude: number, radius: number): [number, number, number] {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export interface MarketMoveHighlight {
  marketId: string;
  country: string;
  instrumentName: string;
  percentageChange: number;
}

export interface MarketSummaryStats {
  openCount: number;
  closedCount: number;
  unavailableCount: number;
  strongestRiser: MarketMoveHighlight | null;
  largestFaller: MarketMoveHighlight | null;
  activeRegions: string[];
}

export function computeMarketSummary(markets: Market[]): MarketSummaryStats {
  let openCount = 0;
  let closedCount = 0;
  let unavailableCount = 0;
  let strongestRiser: MarketMoveHighlight | null = null;
  let largestFaller: MarketMoveHighlight | null = null;
  const activeRegions = new Set<string>();

  for (const market of markets) {
    if (market.marketStatus === "OPEN") {
      openCount += 1;
      activeRegions.add(market.region);
    } else if (market.marketStatus === "UNAVAILABLE") {
      unavailableCount += 1;
    } else {
      closedCount += 1;
    }

    for (const instrument of market.instruments) {
      if (instrument.percentageChange === null) continue;
      const highlight: MarketMoveHighlight = {
        marketId: market.id,
        country: market.country,
        instrumentName: instrument.name,
        percentageChange: instrument.percentageChange,
      };
      if (!strongestRiser || highlight.percentageChange > strongestRiser.percentageChange) {
        strongestRiser = highlight;
      }
      if (!largestFaller || highlight.percentageChange < largestFaller.percentageChange) {
        largestFaller = highlight;
      }
    }
  }

  return {
    openCount,
    closedCount,
    unavailableCount,
    strongestRiser,
    largestFaller,
    activeRegions: Array.from(activeRegions),
  };
}

export function formatLocalTime(iso: string | null, timeZone?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      timeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
