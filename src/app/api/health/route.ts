import { healthApiResponseSchema } from "@/features/markets/market-schema";
import { marketCache } from "@/lib/cache/market-cache";
import { logger } from "@/lib/logging/logger";
import { getMarketDataProvider } from "@/lib/providers/provider-factory";

export const dynamic = "force-dynamic";

export async function GET() {
  let provider: { healthy: boolean; provider: string; message?: string };

  try {
    provider = await getMarketDataProvider().healthCheck();
  } catch (error) {
    logger.error("health_check_provider_error", {
      message: error instanceof Error ? error.message : String(error),
    });
    provider = { healthy: false, provider: "unknown", message: "Provider unavailable" };
  }

  const cache = { healthy: true, entries: marketCache.size() };
  const status = provider.healthy ? "ok" : "degraded";

  const body = healthApiResponseSchema.parse({
    status,
    timestamp: new Date().toISOString(),
    application: { healthy: true },
    provider,
    cache,
  });

  return Response.json(body, { status: provider.healthy ? 200 : 503 });
}
