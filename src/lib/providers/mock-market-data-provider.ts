import { getMarketConfig, getMarketConfigs, type InstrumentConfig, type MarketConfig } from "@/features/markets/market-registry";
import { getMarketStatus } from "@/features/markets/market-status";
import type { Market, MarketDirection, MarketInstrument } from "@/features/markets/market-types";
import {
  InstrumentNotFoundError,
  MarketNotFoundError,
  type MarketDataProvider,
} from "./market-data-provider";

const PROVIDER_NAME = "mock";

/** Deterministic string hash so fixtures are stable across runs/tests. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const DIRECTIONS: MarketDirection[] = ["UP", "DOWN", "UNCHANGED"];

/**
 * Deterministically synthesizes one instrument fixture per instrument id.
 * Cycles through five demo scenarios so the UI can be developed against
 * every state the product needs to render: rising, falling, unchanged,
 * stale, and unavailable.
 */
function buildInstrumentFixture(
  config: InstrumentConfig,
  now: Date,
): MarketInstrument {
  const bucket = hashString(config.id) % 5;
  const base = 100 + (hashString(config.symbol) % 50_000) / 10;

  if (bucket === 4) {
    // UNAVAILABLE demo case — no quote exists at all.
    return {
      id: config.id,
      symbol: config.symbol,
      name: config.name,
      value: null,
      previousClose: null,
      absoluteChange: null,
      percentageChange: null,
      direction: null,
      lastUpdatedAt: null,
      dataStatus: "UNAVAILABLE",
      currency: config.currency,
      provider: PROVIDER_NAME,
    };
  }

  const direction = DIRECTIONS[bucket % 3];
  const magnitude = 0.25 + (hashString(config.name) % 300) / 100; // 0.25%..3.25%
  const percentageChange =
    direction === "UP" ? magnitude : direction === "DOWN" ? -magnitude : 0;
  const previousClose = Math.round(base * 100) / 100;
  const value = Math.round(previousClose * (1 + percentageChange / 100) * 100) / 100;
  const absoluteChange = Math.round((value - previousClose) * 100) / 100;

  const isStaleDemo = bucket === 3;
  const lastUpdatedAt = isStaleDemo
    ? new Date(now.getTime() - 30 * 60_000).toISOString() // 30 min old
    : new Date(now.getTime() - (hashString(config.id + "t") % 10_000)).toISOString();

  return {
    id: config.id,
    symbol: config.symbol,
    name: config.name,
    value,
    previousClose,
    absoluteChange,
    percentageChange: Math.round(percentageChange * 100) / 100,
    direction,
    lastUpdatedAt,
    dataStatus: isStaleDemo ? "STALE" : "MOCK",
    currency: config.currency,
    provider: PROVIDER_NAME,
  };
}

function buildMarketFixture(config: MarketConfig, now: Date): Market {
  const status = getMarketStatus(config, now);
  return {
    id: config.id,
    country: config.country,
    region: config.region,
    city: config.city,
    latitude: config.latitude,
    longitude: config.longitude,
    timezone: config.session.timezone,
    exchange: config.exchange,
    instruments: config.instruments.map((instrument) => buildInstrumentFixture(instrument, now)),
    marketStatus: status.status,
    nextOpenAt: status.nextOpenAt,
    nextCloseAt: status.nextCloseAt,
    statusReason: status.statusReason,
  };
}

export class MockMarketDataProvider implements MarketDataProvider {
  async getMarketData(marketIds?: string[]): Promise<Market[]> {
    const now = new Date();
    return getMarketConfigs(marketIds).map((config) => buildMarketFixture(config, now));
  }

  async getInstrumentQuote(marketId: string, instrumentId: string): Promise<MarketInstrument> {
    const config = getMarketConfig(marketId);
    if (!config) throw new MarketNotFoundError(marketId);

    const instrumentConfig = config.instruments.find((instrument) => instrument.id === instrumentId);
    if (!instrumentConfig) throw new InstrumentNotFoundError(marketId, instrumentId);

    return buildInstrumentFixture(instrumentConfig, new Date());
  }

  async healthCheck() {
    return { healthy: true, provider: PROVIDER_NAME, message: "Mock provider always healthy" };
  }
}
