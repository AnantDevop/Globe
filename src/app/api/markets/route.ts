import { resolveResponseDataStatus } from "@/features/markets/freshness";
import { marketListSchema } from "@/features/markets/market-schema";
import { ApiError, toApiErrorBody } from "@/lib/errors/api-error";
import { logger } from "@/lib/logging/logger";
import { marketCache } from "@/lib/cache/market-cache";
import { getMarketDataProvider } from "@/lib/providers/provider-factory";
import { withRetry } from "@/lib/providers/retry";
import { getClientKey, rateLimiter } from "@/lib/rate-limit/rate-limiter";

export const dynamic = "force-dynamic";

const CACHE_KEY = "all-markets";

export async function GET(request: Request) {
  const clientKey = getClientKey(request);
  const { allowed } = rateLimiter.check(clientKey);
  if (!allowed) {
    const { status, body } = toApiErrorBody(
      new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down."),
    );
    return Response.json(body, { status });
  }

  const { searchParams } = new URL(request.url);
  const marketIdsParam = searchParams.get("marketIds");
  const marketIds = marketIdsParam ? marketIdsParam.split(",").filter(Boolean) : undefined;

  try {
    const provider = getMarketDataProvider();
    const rawMarkets = await withRetry(() => provider.getMarketData(marketIds));
    const markets = marketListSchema.parse(rawMarkets);

    if (!marketIds) marketCache.set(CACHE_KEY, markets);

    const allInstruments = markets.flatMap((market) => market.instruments);
    const providerHealth = await provider.healthCheck().catch(() => null);
    const providerName = providerHealth?.provider ?? "unknown";

    return Response.json({
      data: markets,
      meta: {
        provider: providerName,
        generatedAt: new Date().toISOString(),
        dataStatus: resolveResponseDataStatus(providerName, allInstruments),
      },
    });
  } catch (error) {
    logger.error("markets_fetch_failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    const cached = marketCache.get(CACHE_KEY);
    if (cached) {
      return Response.json({
        data: cached.data,
        meta: {
          provider: "cache",
          generatedAt: new Date().toISOString(),
          dataStatus: "STALE",
          cacheAgeSeconds: Math.round(cached.ageSeconds),
        },
        warning: "Live provider fetch failed; showing last-known-good data.",
      });
    }

    const { status, body } = toApiErrorBody(
      new ApiError(503, "PROVIDER_UNAVAILABLE", "Market data is temporarily unavailable."),
    );
    return Response.json(body, { status });
  }
}
