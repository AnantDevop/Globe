import { describe, expect, it } from "vitest";
import { aggregateDataStatus, resolveDataStatus } from "@/features/markets/freshness";
import type { MarketInstrument } from "@/features/markets/market-types";

const NOW = new Date("2026-08-14T12:00:00.000Z");

function instrument(overrides: Partial<MarketInstrument>): MarketInstrument {
  return {
    id: "x",
    symbol: "X",
    name: "X",
    value: 1,
    previousClose: 1,
    absoluteChange: 0,
    percentageChange: 0,
    direction: "UNCHANGED",
    lastUpdatedAt: NOW.toISOString(),
    dataStatus: "LIVE",
    currency: "USD",
    provider: "mock",
    ...overrides,
  };
}

describe("resolveDataStatus", () => {
  it("returns MOCK when isMock is true regardless of age", () => {
    const old = new Date(NOW.getTime() - 3_600_000).toISOString();
    expect(resolveDataStatus({ lastUpdatedAt: old, isMock: true, now: NOW })).toBe("MOCK");
  });

  it("returns UNAVAILABLE when lastUpdatedAt is null", () => {
    expect(resolveDataStatus({ lastUpdatedAt: null, now: NOW })).toBe("UNAVAILABLE");
  });

  it("returns LIVE within the live threshold", () => {
    const fresh = new Date(NOW.getTime() - 5_000).toISOString();
    expect(resolveDataStatus({ lastUpdatedAt: fresh, now: NOW })).toBe("LIVE");
  });

  it("returns DELAYED between live and delayed thresholds", () => {
    const delayed = new Date(NOW.getTime() - 60_000).toISOString();
    expect(resolveDataStatus({ lastUpdatedAt: delayed, now: NOW })).toBe("DELAYED");
  });

  it("returns STALE beyond the stale threshold", () => {
    const stale = new Date(NOW.getTime() - 20 * 60_000).toISOString();
    expect(resolveDataStatus({ lastUpdatedAt: stale, now: NOW })).toBe("STALE");
  });

  it("returns DELAYED when the provider flags delay even if within live age", () => {
    const fresh = new Date(NOW.getTime() - 2_000).toISOString();
    expect(
      resolveDataStatus({ lastUpdatedAt: fresh, providerReportsDelayed: true, now: NOW }),
    ).toBe("DELAYED");
  });
});

describe("aggregateDataStatus", () => {
  it("returns UNAVAILABLE for an empty instrument list", () => {
    expect(aggregateDataStatus([])).toBe("UNAVAILABLE");
  });

  it("returns the least-fresh status among instruments", () => {
    const instruments = [
      instrument({ dataStatus: "LIVE" }),
      instrument({ dataStatus: "STALE" }),
      instrument({ dataStatus: "DELAYED" }),
    ];
    expect(aggregateDataStatus(instruments)).toBe("STALE");
  });

  it("returns MOCK when all instruments are mock", () => {
    const instruments = [instrument({ dataStatus: "MOCK" }), instrument({ dataStatus: "MOCK" })];
    expect(aggregateDataStatus(instruments)).toBe("MOCK");
  });
});
