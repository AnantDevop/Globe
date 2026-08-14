import { getEnv } from "@/lib/config/env";
import { IndstocksMarketDataProvider } from "./indstocks-market-data-provider";
import type { MarketDataProvider } from "./market-data-provider";
import { MockMarketDataProvider } from "./mock-market-data-provider";

let cachedProvider: MarketDataProvider | null = null;
let cachedProviderName: string | null = null;

/**
 * Selects the active provider from MARKET_DATA_PROVIDER. Production must
 * fail safe: if "indstocks" is selected, the IndstocksMarketDataProvider is
 * still used even without credentials — it returns UNAVAILABLE per market
 * rather than silently falling back to mock data.
 */
export function getMarketDataProvider(): MarketDataProvider {
  const env = getEnv();
  if (cachedProvider && cachedProviderName === env.provider) return cachedProvider;

  if (env.provider === "indstocks") {
    cachedProvider = new IndstocksMarketDataProvider();
  } else {
    if (env.appEnv === "production") {
      // The mock provider must never be reachable in production. This is a
      // configuration bug, not a runtime condition to recover from.
      throw new Error(
        'MARKET_DATA_PROVIDER is "mock" (or unset) in a production environment. ' +
          'Set MARKET_DATA_PROVIDER=indstocks (or a future real provider) before deploying.',
      );
    }
    cachedProvider = new MockMarketDataProvider();
  }

  cachedProviderName = env.provider;
  return cachedProvider;
}

/** Test-only: clears the memoized provider so env changes take effect. */
export function resetProviderCache(): void {
  cachedProvider = null;
  cachedProviderName = null;
}
