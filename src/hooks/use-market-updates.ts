"use client";

import useSWR from "swr";
import { marketSchema } from "@/features/markets/market-schema";
import type { Market } from "@/features/markets/market-types";

const POLL_INTERVAL_MS = 15_000;

interface SingleMarketResponse {
  data: Market;
  meta: { provider: string; generatedAt: string; dataStatus: string };
}

async function fetcher(url: string): Promise<SingleMarketResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  const json = await response.json();
  return {
    data: marketSchema.parse(json.data),
    meta: json.meta,
  };
}

/**
 * Polls a single market at a tighter interval than the global list — used
 * by the detail panel while it's open so a locked-open market stays fresh
 * without increasing the polling rate for markers the user isn't looking at.
 */
export function useMarketUpdates(marketId: string | null) {
  const { data, error, isLoading } = useSWR<SingleMarketResponse>(
    marketId ? `/api/markets/${marketId}` : null,
    fetcher,
    { refreshInterval: POLL_INTERVAL_MS, revalidateOnFocus: true },
  );

  return {
    market: data?.data ?? null,
    dataStatus: data?.meta.dataStatus ?? null,
    isLoading,
    error,
  };
}
