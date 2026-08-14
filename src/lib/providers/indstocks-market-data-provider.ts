import { getMarketConfig, getMarketConfigs } from "@/features/markets/market-registry";
import { getMarketStatus } from "@/features/markets/market-status";
import type { Market, MarketInstrument } from "@/features/markets/market-types";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/logging/logger";
import {
  InstrumentNotFoundError,
  MarketNotFoundError,
  type MarketDataProvider,
} from "./market-data-provider";

const PROVIDER_NAME = "indstocks";

/**
 * INDstocks/INDmoney adapter skeleton.
 *
 * STATUS: not wired to a real endpoint. INDstocks' exact international
 * index coverage, authentication flow, and response shapes are not
 * confirmed as of this writing. This adapter intentionally:
 *   - never invents an endpoint URL, request shape, or symbol mapping,
 *   - returns NOT_CONFIGURED / UNAVAILABLE instead of guessing,
 *   - keeps all credentials server-side (read via getEnv(), never exposed
 *     to the client bundle or returned in API responses).
 *
 * TODO(indstocks): once API documentation is available, fill in:
 *   1. Base URL / auth flow (API key header? OAuth bearer? both?).
 *   2. The actual request shape for `getMarketData` (batch endpoint vs.
 *      per-instrument calls).
 *   3. A verified mapping from this app's InstrumentConfig.symbol values
 *      (see src/features/markets/market-registry.ts) to INDstocks'
 *      instrument identifiers — do not assume symbols match.
 *   4. Whether INDstocks exposes non-Indian (international) indices at
 *      all; if not, this provider may only ever be able to serve the
 *      "india" market, and other markets should stay UNAVAILABLE under
 *      this provider until a second provider is added.
 *   5. Real-time vs delayed data semantics per plan tier, to correctly
 *      set `dataStatus` (LIVE vs DELAYED) instead of always MOCK/UNAVAILABLE.
 *   6. A `subscribeToUpdates` implementation if INDstocks offers a
 *      WebSocket/streaming feed.
 */
export class IndstocksMarketDataProvider implements MarketDataProvider {
  private isConfigured(): boolean {
    const env = getEnv();
    return Boolean(env.indstocks.apiKey && env.indstocks.accessToken);
  }

  async getMarketData(marketIds?: string[]): Promise<Market[]> {
    const configured = this.isConfigured();
    const now = new Date();

    return getMarketConfigs(marketIds).map((config) => {
      const status = getMarketStatus(config, now);

      const instruments: MarketInstrument[] = config.instruments.map((instrument) => ({
        id: instrument.id,
        symbol: instrument.symbol,
        name: instrument.name,
        value: null,
        previousClose: null,
        absoluteChange: null,
        percentageChange: null,
        direction: null,
        lastUpdatedAt: null,
        dataStatus: "UNAVAILABLE",
        currency: instrument.currency,
        provider: PROVIDER_NAME,
      }));

      if (!configured) {
        logger.warn("indstocks_not_configured", { marketId: config.id });
      }

      return {
        id: config.id,
        country: config.country,
        region: config.region,
        city: config.city,
        latitude: config.latitude,
        longitude: config.longitude,
        timezone: config.session.timezone,
        exchange: config.exchange,
        instruments,
        marketStatus: status.status,
        nextOpenAt: status.nextOpenAt,
        nextCloseAt: status.nextCloseAt,
        statusReason: configured
          ? status.statusReason
          : "INDstocks provider not configured (missing credentials or unmapped instruments)",
      };
    });
  }

  async getInstrumentQuote(marketId: string, instrumentId: string): Promise<MarketInstrument> {
    const config = getMarketConfig(marketId);
    if (!config) throw new MarketNotFoundError(marketId);

    const instrumentConfig = config.instruments.find((instrument) => instrument.id === instrumentId);
    if (!instrumentConfig) throw new InstrumentNotFoundError(marketId, instrumentId);

    // TODO(indstocks): replace with a real per-instrument quote request
    // once the endpoint and symbol mapping are confirmed.
    return {
      id: instrumentConfig.id,
      symbol: instrumentConfig.symbol,
      name: instrumentConfig.name,
      value: null,
      previousClose: null,
      absoluteChange: null,
      percentageChange: null,
      direction: null,
      lastUpdatedAt: null,
      dataStatus: "UNAVAILABLE",
      currency: instrumentConfig.currency,
      provider: PROVIDER_NAME,
    };
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        provider: PROVIDER_NAME,
        message: "NOT_CONFIGURED: missing INDSTOCKS_API_KEY / INDSTOCKS_ACCESS_TOKEN",
      };
    }

    // TODO(indstocks): replace with a real lightweight health/ping call
    // once an endpoint is confirmed. Until then, configured-but-unverified
    // credentials are reported as unhealthy rather than assumed good.
    return {
      healthy: false,
      provider: PROVIDER_NAME,
      message: "UNAVAILABLE: INDstocks endpoint integration not yet implemented",
    };
  }
}
