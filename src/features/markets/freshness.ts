import type { DataStatus, MarketInstrument } from "./market-types";

export interface FreshnessConfig {
  liveMaxAgeSeconds: number;
  delayedMaxAgeSeconds: number;
  staleAfterSeconds: number;
}

export const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  liveMaxAgeSeconds: 15,
  delayedMaxAgeSeconds: 300,
  staleAfterSeconds: 900,
};

export interface FreshnessInput {
  /** ISO 8601 timestamp of the quote, or null if no quote exists. */
  lastUpdatedAt: string | null;
  /** True if the provider itself flags this quote as delayed. */
  providerReportsDelayed?: boolean;
  /** True if this quote came from the mock provider. */
  isMock?: boolean;
  now?: Date;
  config?: FreshnessConfig;
}

/**
 * Derives a DataStatus from quote age. Mock data is always MOCK regardless
 * of age; a missing timestamp is always UNAVAILABLE.
 */
export function resolveDataStatus({
  lastUpdatedAt,
  providerReportsDelayed = false,
  isMock = false,
  now = new Date(),
  config = DEFAULT_FRESHNESS_CONFIG,
}: FreshnessInput): DataStatus {
  if (isMock) return "MOCK";
  if (!lastUpdatedAt) return "UNAVAILABLE";

  const updatedAt = new Date(lastUpdatedAt);
  if (Number.isNaN(updatedAt.getTime())) return "UNAVAILABLE";

  const ageSeconds = (now.getTime() - updatedAt.getTime()) / 1000;
  if (ageSeconds < 0) return "LIVE";

  if (ageSeconds > config.staleAfterSeconds) return "STALE";
  if (providerReportsDelayed || ageSeconds > config.liveMaxAgeSeconds) {
    return ageSeconds > config.delayedMaxAgeSeconds ? "STALE" : "DELAYED";
  }
  return "LIVE";
}

const SEVERITY: Record<DataStatus, number> = {
  UNAVAILABLE: 0,
  STALE: 1,
  DELAYED: 2,
  EOD: 3,
  MOCK: 4,
  LIVE: 5,
};

/**
 * Summarizes many instruments' dataStatus into one response-level status —
 * the least-fresh status present wins, so a response summary never claims
 * to be more current than its worst constituent quote.
 */
export function aggregateDataStatus(instruments: MarketInstrument[]): DataStatus {
  if (instruments.length === 0) return "UNAVAILABLE";
  return instruments.reduce<DataStatus>((worst, instrument) => {
    return SEVERITY[instrument.dataStatus] < SEVERITY[worst] ? instrument.dataStatus : worst;
  }, "LIVE");
}

/**
 * Response-level dataStatus: MOCK whenever the mock provider is active
 * (its per-instrument variety is intentional demo content, not a real
 * outage), otherwise the aggregate of actual instrument freshness.
 */
export function resolveResponseDataStatus(
  providerName: string,
  instruments: MarketInstrument[],
): DataStatus {
  if (providerName === "mock") return "MOCK";
  return aggregateDataStatus(instruments);
}
