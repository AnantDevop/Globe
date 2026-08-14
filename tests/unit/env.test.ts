import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "@/lib/config/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("falls back to a non-production env when APP_ENV is unset", () => {
    vi.stubEnv("APP_ENV", "");
    expect(getEnv().appEnv).not.toBe("production");
  });

  it("is production only when APP_ENV is explicitly set to production", () => {
    vi.stubEnv("APP_ENV", "production");
    expect(getEnv().appEnv).toBe("production");
  });

  it("is NOT production just because Next's build sets NODE_ENV=production", () => {
    // Simulates a hosted demo deploy: Next.js always builds with
    // NODE_ENV=production, but that alone must not trip the strict
    // "never serve mock data" guard — only an explicit APP_ENV=production does.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ENV", "");
    expect(getEnv().appEnv).not.toBe("production");
  });

  it("defaults the provider to mock for an unrecognized value", () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "something-else");
    expect(getEnv().provider).toBe("mock");
  });
});
