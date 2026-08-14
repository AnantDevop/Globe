import { z } from "zod";

export const marketStatusSchema = z.enum([
  "OPEN",
  "CLOSED",
  "PRE_MARKET",
  "POST_MARKET",
  "HOLIDAY",
  "UNAVAILABLE",
]);

export const dataStatusSchema = z.enum([
  "LIVE",
  "DELAYED",
  "STALE",
  "EOD",
  "MOCK",
  "UNAVAILABLE",
]);

export const marketDirectionSchema = z.enum(["UP", "DOWN", "UNCHANGED"]);

export const marketInstrumentSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  value: z.number().finite().nullable(),
  previousClose: z.number().finite().nullable(),
  absoluteChange: z.number().finite().nullable(),
  percentageChange: z.number().finite().nullable(),
  direction: marketDirectionSchema.nullable(),
  lastUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  dataStatus: dataStatusSchema,
  currency: z.string().nullable(),
  provider: z.string().nullable(),
});

export const marketSchema = z.object({
  id: z.string().min(1),
  country: z.string().min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
  exchange: z.string().min(1),
  instruments: z.array(marketInstrumentSchema),
  marketStatus: marketStatusSchema,
  nextOpenAt: z.iso.datetime({ offset: true }).nullable(),
  nextCloseAt: z.iso.datetime({ offset: true }).nullable(),
  statusReason: z.string().nullable(),
});

export const marketListSchema = z.array(marketSchema);

export const providerHealthSchema = z.object({
  healthy: z.boolean(),
  provider: z.string(),
  message: z.string().optional(),
});

export const marketsApiResponseSchema = z.object({
  data: marketListSchema,
  meta: z.object({
    provider: z.string(),
    generatedAt: z.iso.datetime({ offset: true }),
    dataStatus: dataStatusSchema,
  }),
});

export const healthApiResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  timestamp: z.iso.datetime({ offset: true }),
  application: z.object({ healthy: z.boolean() }),
  provider: providerHealthSchema,
  cache: z
    .object({
      healthy: z.boolean(),
      entries: z.number().int().nonnegative(),
    })
    .nullable(),
});
