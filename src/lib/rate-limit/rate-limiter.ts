interface Bucket {
  tokens: number;
  lastRefillAt: number;
}

export interface RateLimitConfig {
  maxTokens: number;
  refillIntervalMs: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxTokens: 60,
  refillIntervalMs: 60_000,
};

/**
 * In-memory per-key token bucket. Sufficient for a single-instance Phase 1
 * deploy — see ADR-001 for the Redis-backed upgrade path once the app runs
 * on multiple instances.
 */
class RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(private config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG) {}

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.config.maxTokens, lastRefillAt: now };

    const elapsed = now - bucket.lastRefillAt;
    if (elapsed > this.config.refillIntervalMs) {
      bucket.tokens = this.config.maxTokens;
      bucket.lastRefillAt = now;
    }

    if (bucket.tokens <= 0) {
      this.buckets.set(key, bucket);
      return { allowed: false, remaining: 0 };
    }

    bucket.tokens -= 1;
    this.buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  reset(): void {
    this.buckets.clear();
  }
}

export const rateLimiter = new RateLimiter();

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
