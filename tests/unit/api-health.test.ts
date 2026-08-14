// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { healthApiResponseSchema } from "@/features/markets/market-schema";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("GET /api/health", () => {
  it("reports healthy for the mock provider and never exposes secrets", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("MARKET_DATA_PROVIDER", "mock");
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(() => healthApiResponseSchema.parse(json)).not.toThrow();
    expect(JSON.stringify(json)).not.toMatch(/INDSTOCKS|api[_-]?key|access[_-]?token/i);
  });

  beforeEach(() => {
    vi.stubEnv("INDSTOCKS_API_KEY", "");
    vi.stubEnv("INDSTOCKS_ACCESS_TOKEN", "");
  });

  it("reports degraded (503) when indstocks is selected but not configured", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("MARKET_DATA_PROVIDER", "indstocks");
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.status).toBe("degraded");
    expect(json.provider.healthy).toBe(false);
  });
});
