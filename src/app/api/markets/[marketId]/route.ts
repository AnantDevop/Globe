import { getMarketConfig } from "@/features/markets/market-registry";
import { resolveResponseDataStatus } from "@/features/markets/freshness";
import { marketSchema } from "@/features/markets/market-schema";
import { ApiError, toApiErrorBody } from "@/lib/errors/api-error";
import { logger } from "@/lib/logging/logger";
import { getMarketDataProvider } from "@/lib/providers/provider-factory";
import { withRetry } from "@/lib/providers/retry";
import { getClientKey, rateLimiter } from "@/lib/rate-limit/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/markets/[marketId]">,
) {
  const clientKey = getClientKey(request);
  const { allowed } = rateLimiter.check(clientKey);
  if (!allowed) {
    const { status, body } = toApiErrorBody(
      new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down."),
    );
    return Response.json(body, { status });
  }

  const { marketId } = await ctx.params;

  if (!getMarketConfig(marketId)) {
    const { status, body } = toApiErrorBody(
      new ApiError(404, "MARKET_NOT_FOUND", `Market "${marketId}" is not configured.`),
    );
    return Response.json(body, { status });
  }

  try {
    const provider = getMarketDataProvider();
    const [rawMarket] = await withRetry(() => provider.getMarketData([marketId]));
    if (!rawMarket) {
      const { status, body } = toApiErrorBody(
        new ApiError(404, "MARKET_NOT_FOUND", `Market "${marketId}" is not configured.`),
      );
      return Response.json(body, { status });
    }

    const market = marketSchema.parse(rawMarket);
    const providerHealth = await provider.healthCheck().catch(() => null);
    const providerName = providerHealth?.provider ?? "unknown";

    return Response.json({
      data: market,
      meta: {
        provider: providerName,
        generatedAt: new Date().toISOString(),
        dataStatus: resolveResponseDataStatus(providerName, market.instruments),
      },
    });
  } catch (error) {
    logger.error("market_fetch_failed", {
      marketId,
      message: error instanceof Error ? error.message : String(error),
    });
    const { status, body } = toApiErrorBody(
      new ApiError(503, "PROVIDER_UNAVAILABLE", "Market data is temporarily unavailable."),
    );
    return Response.json(body, { status });
  }
}
