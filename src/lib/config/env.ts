export type MarketDataProviderName = "mock" | "indstocks";

export interface AppEnv {
  appEnv: "development" | "test" | "production";
  provider: MarketDataProviderName;
  appName: string;
  indstocks: {
    apiKey: string | null;
    accessToken: string | null;
  };
}

function readProviderName(raw: string | undefined): MarketDataProviderName {
  if (raw === "indstocks") return "indstocks";
  return "mock";
}

/**
 * Reads server-side configuration from environment variables. This module
 * must never be imported from a "use client" file — INDstocks credentials
 * pass through it.
 *
 * appEnv is deliberately driven by APP_ENV alone, not NODE_ENV. NODE_ENV is
 * always "production" in an optimized Next.js build (including a hosted
 * preview/demo deploy), which is a build-mode concept, not a statement
 * about whether real market data has been verified. Whether the strict
 * "never serve mock data" guard is active must be something this app
 * explicitly opts into via APP_ENV, so a demo deployment (mock provider,
 * clearly labeled) doesn't get blocked by Next's own build tooling.
 */
export function getEnv(): AppEnv {
  const appEnv =
    process.env.APP_ENV === "production"
      ? "production"
      : process.env.APP_ENV === "test" || process.env.NODE_ENV === "test"
        ? "test"
        : "development";

  return {
    appEnv,
    provider: readProviderName(process.env.MARKET_DATA_PROVIDER),
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Global Market Globe",
    indstocks: {
      apiKey: process.env.INDSTOCKS_API_KEY || null,
      accessToken: process.env.INDSTOCKS_ACCESS_TOKEN || null,
    },
  };
}
