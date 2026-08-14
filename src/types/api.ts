import type { z } from "zod";
import type {
  healthApiResponseSchema,
  marketsApiResponseSchema,
} from "@/features/markets/market-schema";

export type MarketsApiResponse = z.infer<typeof marketsApiResponseSchema>;
export type HealthApiResponse = z.infer<typeof healthApiResponseSchema>;
