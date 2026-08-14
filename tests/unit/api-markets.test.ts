// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marketsApiResponseSchema, marketSchema } from "@/features/markets/market-schema";

beforeEach(() => {
  vi.stubEnv("APP_ENV", "development");
  vi.stubEnv("MARKET_DATA_PROVIDER", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("GET /api/markets", () => {
  it("returns a response matching the documented shape", async () => {
    const { GET } = await import("@/app/api/markets/route");
    const response = await GET(new Request("http://localhost/api/markets"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(() => marketsApiResponseSchema.parse(json)).not.toThrow();
    expect(json.meta.provider).toBe("mock");
    expect(json.meta.dataStatus).toBeDefined();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("supports filtering by marketIds", async () => {
    const { GET } = await import("@/app/api/markets/route");
    const response = await GET(new Request("http://localhost/api/markets?marketIds=india,japan"));
    const json = await response.json();
    expect(json.data.map((m: { id: string }) => m.id).sort()).toEqual(["india", "japan"]);
  });
});

describe("GET /api/markets/[marketId]", () => {
  it("returns a single validated market for a known id", async () => {
    const { GET } = await import("@/app/api/markets/[marketId]/route");
    const response = await GET(new Request("http://localhost/api/markets/india"), {
      params: Promise.resolve({ marketId: "india" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(() => marketSchema.parse(json.data)).not.toThrow();
    expect(json.data.id).toBe("india");
  });

  it("returns a structured 404 for an unconfigured market", async () => {
    const { GET } = await import("@/app/api/markets/[marketId]/route");
    const response = await GET(new Request("http://localhost/api/markets/atlantis"), {
      params: Promise.resolve({ marketId: "atlantis" }),
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error.code).toBe("MARKET_NOT_FOUND");
  });
});
