import { describe, expect, it } from "vitest";
import { marketListSchema, marketSchema } from "@/features/markets/market-schema";
import type { Market } from "@/features/markets/market-types";

function validMarket(): Market {
  return {
    id: "india",
    country: "India",
    region: "Asia",
    city: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
    timezone: "Asia/Kolkata",
    exchange: "NSE/BSE",
    marketStatus: "OPEN" as const,
    nextOpenAt: null,
    nextCloseAt: new Date().toISOString(),
    statusReason: null,
    instruments: [
      {
        id: "nifty-50",
        symbol: "NIFTY50",
        name: "Nifty 50",
        value: 22000.5,
        previousClose: 21900.25,
        absoluteChange: 100.25,
        percentageChange: 0.46,
        direction: "UP" as const,
        lastUpdatedAt: new Date().toISOString(),
        dataStatus: "MOCK" as const,
        currency: "INR",
        provider: "mock",
      },
    ],
  };
}

describe("marketSchema", () => {
  it("accepts a well-formed market", () => {
    expect(() => marketSchema.parse(validMarket())).not.toThrow();
  });

  it("accepts null instrument values (unavailable quotes)", () => {
    const market = validMarket();
    market.instruments[0] = {
      ...market.instruments[0],
      value: null,
      previousClose: null,
      absoluteChange: null,
      percentageChange: null,
      direction: null,
      lastUpdatedAt: null,
      dataStatus: "UNAVAILABLE",
    };
    expect(() => marketSchema.parse(market)).not.toThrow();
  });

  it("rejects an invalid marketStatus enum value", () => {
    const market = { ...validMarket(), marketStatus: "TRADING" };
    expect(() => marketSchema.parse(market)).toThrow();
  });

  it("rejects out-of-range latitude", () => {
    const market = { ...validMarket(), latitude: 200 };
    expect(() => marketSchema.parse(market)).toThrow();
  });

  it("rejects a non-ISO lastUpdatedAt", () => {
    const market = validMarket();
    market.instruments[0] = { ...market.instruments[0], lastUpdatedAt: "not-a-date" };
    expect(() => marketSchema.parse(market)).toThrow();
  });

  it("validates a list of markets", () => {
    expect(() => marketListSchema.parse([validMarket(), validMarket()])).not.toThrow();
  });
});
