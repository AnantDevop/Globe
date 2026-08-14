import { describe, expect, it } from "vitest";
import { getMarketStatus, HOLIDAY_CALENDAR } from "@/features/markets/market-status";
import type { MarketConfig } from "@/features/markets/market-registry";

const utcMarket: MarketConfig = {
  id: "test-utc",
  country: "Testland",
  region: "Test",
  city: "Testville",
  latitude: 0,
  longitude: 0,
  exchange: "TEST",
  session: {
    timezone: "UTC",
    openTime: "09:00",
    closeTime: "17:00",
    tradingDays: [1, 2, 3, 4, 5],
  },
  instruments: [{ id: "test-idx", symbol: "TST", name: "Test Index", currency: "USD" }],
};

const kolkataMarket: MarketConfig = {
  ...utcMarket,
  id: "test-kolkata",
  session: {
    timezone: "Asia/Kolkata",
    openTime: "09:15",
    closeTime: "15:30",
    tradingDays: [1, 2, 3, 4, 5],
  },
};

describe("getMarketStatus", () => {
  it("reports OPEN during regular session hours on a trading day", () => {
    // Wednesday 2026-08-12 12:00 UTC — within 09:00-17:00.
    const result = getMarketStatus(utcMarket, new Date("2026-08-12T12:00:00.000Z"));
    expect(result.status).toBe("OPEN");
    expect(result.nextCloseAt).not.toBeNull();
  });

  it("reports CLOSED outside regular session hours on a trading day", () => {
    const result = getMarketStatus(utcMarket, new Date("2026-08-12T20:00:00.000Z"));
    expect(result.status).toBe("CLOSED");
    expect(result.nextOpenAt).not.toBeNull();
  });

  it("reports CLOSED on a weekend", () => {
    // Saturday 2026-08-15
    const result = getMarketStatus(utcMarket, new Date("2026-08-15T12:00:00.000Z"));
    expect(result.status).toBe("CLOSED");
  });

  it("correctly converts session hours in a non-UTC timezone (Asia/Kolkata, UTC+5:30)", () => {
    // 09:15 IST = 03:45 UTC. Just after open.
    const open = getMarketStatus(kolkataMarket, new Date("2026-08-12T04:00:00.000Z"));
    expect(open.status).toBe("OPEN");

    // Just before 09:15 IST open.
    const beforeOpen = getMarketStatus(kolkataMarket, new Date("2026-08-12T03:00:00.000Z"));
    expect(beforeOpen.status).toBe("CLOSED");

    // 15:30 IST close = 10:00 UTC. Just after close.
    const afterClose = getMarketStatus(kolkataMarket, new Date("2026-08-12T10:30:00.000Z"));
    expect(afterClose.status).toBe("CLOSED");
  });

  it("reports HOLIDAY when the local date is in the holiday calendar", () => {
    HOLIDAY_CALENDAR[utcMarket.id] = ["2026-08-12"];
    try {
      const result = getMarketStatus(utcMarket, new Date("2026-08-12T12:00:00.000Z"));
      expect(result.status).toBe("HOLIDAY");
      expect(result.statusReason).toBe("Exchange holiday");
    } finally {
      delete HOLIDAY_CALENDAR[utcMarket.id];
    }
  });

  it("calculation is independent of any quote data (no instruments needed)", () => {
    const result = getMarketStatus({ ...utcMarket, instruments: [] }, new Date("2026-08-12T12:00:00.000Z"));
    expect(result.status).toBe("OPEN");
  });
});
