import { describe, expect, it } from "vitest";
import { MARKET_REGISTRY } from "@/features/markets/market-registry";
import {
  InstrumentNotFoundError,
  MarketNotFoundError,
} from "@/lib/providers/market-data-provider";
import { MockMarketDataProvider } from "@/lib/providers/mock-market-data-provider";

describe("MockMarketDataProvider", () => {
  it("returns every configured market when no filter is given", async () => {
    const provider = new MockMarketDataProvider();
    const markets = await provider.getMarketData();
    expect(markets).toHaveLength(MARKET_REGISTRY.length);
  });

  it("filters to only the requested market ids", async () => {
    const provider = new MockMarketDataProvider();
    const markets = await provider.getMarketData(["india", "japan"]);
    expect(markets.map((m) => m.id).sort()).toEqual(["india", "japan"]);
  });

  it("labels every non-unavailable instrument as MOCK or STALE, never as real data", async () => {
    const provider = new MockMarketDataProvider();
    const markets = await provider.getMarketData();
    const statuses = new Set(markets.flatMap((m) => m.instruments.map((i) => i.dataStatus)));
    for (const status of statuses) {
      expect(["MOCK", "STALE", "UNAVAILABLE"]).toContain(status);
    }
  });

  it("demonstrates positive, negative, unchanged, and unavailable states across fixtures", async () => {
    const provider = new MockMarketDataProvider();
    const markets = await provider.getMarketData();
    const directions = new Set(markets.flatMap((m) => m.instruments.map((i) => i.direction)));
    expect(directions.has("UP")).toBe(true);
    expect(directions.has("DOWN")).toBe(true);
    expect(directions.has(null)).toBe(true); // unavailable instruments have null direction
  });

  it("never shows a null value as zero for unavailable instruments", async () => {
    const provider = new MockMarketDataProvider();
    const markets = await provider.getMarketData();
    const unavailable = markets
      .flatMap((m) => m.instruments)
      .filter((i) => i.dataStatus === "UNAVAILABLE");
    expect(unavailable.length).toBeGreaterThan(0);
    for (const instrument of unavailable) {
      expect(instrument.value).toBeNull();
      expect(instrument.value).not.toBe(0);
    }
  });

  it("getInstrumentQuote returns a quote for a known market/instrument", async () => {
    const provider = new MockMarketDataProvider();
    const quote = await provider.getInstrumentQuote("india", "nifty-50");
    expect(quote.id).toBe("nifty-50");
  });

  it("throws MarketNotFoundError for an unknown market", async () => {
    const provider = new MockMarketDataProvider();
    await expect(provider.getInstrumentQuote("atlantis", "x")).rejects.toBeInstanceOf(
      MarketNotFoundError,
    );
  });

  it("throws InstrumentNotFoundError for an unknown instrument on a known market", async () => {
    const provider = new MockMarketDataProvider();
    await expect(provider.getInstrumentQuote("india", "does-not-exist")).rejects.toBeInstanceOf(
      InstrumentNotFoundError,
    );
  });

  it("reports itself healthy", async () => {
    const provider = new MockMarketDataProvider();
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
    expect(health.provider).toBe("mock");
  });
});
