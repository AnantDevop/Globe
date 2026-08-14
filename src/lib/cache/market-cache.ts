import type { Market } from "@/features/markets/market-types";

interface CacheEntry {
  data: Market[];
  fetchedAt: number;
}

/**
 * Process-local last-known-good cache. Phase 1 runs a single instance, so
 * an in-memory cache is sufficient — see ADR-001 for when to move this to
 * Redis (multi-instance deploys).
 */
class MarketCache {
  private entries = new Map<string, CacheEntry>();

  set(key: string, data: Market[]): void {
    this.entries.set(key, { data, fetchedAt: Date.now() });
  }

  /** Returns the cached entry and its age in seconds, or null if absent. */
  get(key: string): { data: Market[]; ageSeconds: number } | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    return { data: entry.data, ageSeconds: (Date.now() - entry.fetchedAt) / 1000 };
  }

  size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const marketCache = new MarketCache();
