export type MarketStatus =
  | "OPEN"
  | "CLOSED"
  | "PRE_MARKET"
  | "POST_MARKET"
  | "HOLIDAY"
  | "UNAVAILABLE";

export type DataStatus =
  | "LIVE"
  | "DELAYED"
  | "STALE"
  | "EOD"
  | "MOCK"
  | "UNAVAILABLE";

export type MarketDirection = "UP" | "DOWN" | "UNCHANGED";

export interface MarketInstrument {
  id: string;
  symbol: string;
  name: string;
  value: number | null;
  previousClose: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  direction: MarketDirection | null;
  lastUpdatedAt: string | null;
  dataStatus: DataStatus;
  currency: string | null;
  provider: string | null;
}

export interface Market {
  id: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  exchange: string;
  instruments: MarketInstrument[];
  marketStatus: MarketStatus;
  nextOpenAt: string | null;
  nextCloseAt: string | null;
  statusReason: string | null;
}

export interface ProviderHealth {
  healthy: boolean;
  provider: string;
  message?: string;
}
