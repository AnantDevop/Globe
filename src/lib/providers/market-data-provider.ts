import type { Market, MarketInstrument, ProviderHealth } from "@/features/markets/market-types";

/**
 * All market-data providers (mock, INDstocks, and any future provider)
 * implement this interface. The rest of the application — API routes,
 * hooks, and UI — depends only on this interface and the normalized
 * `Market`/`MarketInstrument` types, never on a provider's raw response
 * shape.
 */
export interface MarketDataProvider {
  getMarketData(marketIds?: string[]): Promise<Market[]>;
  getInstrumentQuote(marketId: string, instrumentId: string): Promise<MarketInstrument>;
  subscribeToUpdates?(
    onUpdate: (instrument: MarketInstrument) => void,
  ): Promise<() => void>;
  healthCheck(): Promise<ProviderHealth>;
}

export class InstrumentNotFoundError extends Error {
  constructor(marketId: string, instrumentId: string) {
    super(`Instrument "${instrumentId}" not found for market "${marketId}"`);
    this.name = "InstrumentNotFoundError";
  }
}

export class MarketNotFoundError extends Error {
  constructor(marketId: string) {
    super(`Market "${marketId}" not found`);
    this.name = "MarketNotFoundError";
  }
}
