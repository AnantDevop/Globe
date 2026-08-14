import { describe, expect, it } from "vitest";
import {
  formatPercent,
  formatSignedValue,
  formatValue,
  markerColor,
} from "@/features/markets/market-utils";

describe("formatting helpers never render null as zero", () => {
  it("formatValue renders null as an em dash", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(0)).not.toBe("—");
    expect(formatValue(0)).toBe("0.00");
  });

  it("formatSignedValue renders null as an em dash", () => {
    expect(formatSignedValue(null)).toBe("—");
  });

  it("formatPercent renders null as an em dash", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("markerColor", () => {
  it("is gray for unavailable data regardless of direction", () => {
    expect(markerColor("OPEN", "UNAVAILABLE", "UP")).toBe("#6b7280");
  });

  it("is amber for delayed or stale data", () => {
    expect(markerColor("OPEN", "DELAYED", "UP")).toBe("#f59e0b");
    expect(markerColor("OPEN", "STALE", "DOWN")).toBe("#f59e0b");
  });

  it("is green for rising, red for falling, gray for unchanged", () => {
    expect(markerColor("OPEN", "LIVE", "UP")).toBe("#22c55e");
    expect(markerColor("OPEN", "LIVE", "DOWN")).toBe("#ef4444");
    expect(markerColor("OPEN", "LIVE", "UNCHANGED")).toBe("#9ca3af");
  });
});
