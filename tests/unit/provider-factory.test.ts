import { afterEach, describe, expect, it, vi } from "vitest";
import { IndstocksMarketDataProvider } from "@/lib/providers/indstocks-market-data-provider";
import { MockMarketDataProvider } from "@/lib/providers/mock-market-data-provider";
import { getMarketDataProvider, resetProviderCache } from "@/lib/providers/provider-factory";

afterEach(() => {
  vi.unstubAllEnvs();
  resetProviderCache();
});

describe("getMarketDataProvider", () => {
  it("returns the mock provider by default outside production", () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("MARKET_DATA_PROVIDER", "mock");
    expect(getMarketDataProvider()).toBeInstanceOf(MockMarketDataProvider);
  });

  it("returns the INDstocks provider when selected", () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("MARKET_DATA_PROVIDER", "indstocks");
    expect(getMarketDataProvider()).toBeInstanceOf(IndstocksMarketDataProvider);
  });

  it("throws rather than silently serving mock data in production", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("MARKET_DATA_PROVIDER", "mock");
    expect(() => getMarketDataProvider()).toThrow(/production/i);
  });

  it("never falls back to mock data when indstocks is selected but unconfigured", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("MARKET_DATA_PROVIDER", "indstocks");
    vi.stubEnv("INDSTOCKS_API_KEY", "");
    vi.stubEnv("INDSTOCKS_ACCESS_TOKEN", "");
    const provider = getMarketDataProvider();
    expect(provider).toBeInstanceOf(IndstocksMarketDataProvider);

    const markets = await provider.getMarketData(["india"]);
    const allUnavailable = markets[0].instruments.every((i) => i.dataStatus === "UNAVAILABLE");
    expect(allUnavailable).toBe(true);

    const health = await provider.healthCheck();
    expect(health.healthy).toBe(false);
    expect(health.message).toMatch(/NOT_CONFIGURED/);
  });
});
