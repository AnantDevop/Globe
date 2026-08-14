"use client";

import useSWR from "swr";
import { marketsApiResponseSchema } from "@/features/markets/market-schema";
import type { MarketsApiResponse } from "@/types/api";

const POLL_INTERVAL_MS = 20_000;

async function fetcher(url: string): Promise<MarketsApiResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  const json = await response.json();
  return marketsApiResponseSchema.parse(json);
}

export function useMarkets() {
  const { data, error, isLoading, mutate } = useSWR<MarketsApiResponse>(
    "/api/markets",
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  return {
    markets: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    lastSyncedAt: data?.meta.generatedAt ?? null,
    refresh: mutate,
  };
}
