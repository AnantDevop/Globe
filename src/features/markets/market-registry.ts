/**
 * Configuration-driven market registry. Adding or changing a market's
 * location, session hours, or instruments should never require touching
 * globe/UI components — they all read from here.
 */

export interface InstrumentConfig {
  id: string;
  symbol: string;
  name: string;
  currency: string;
}

export interface TradingSessionConfig {
  /** IANA timezone the session times below are expressed in. */
  timezone: string;
  /** 24h "HH:mm" local exchange time. */
  openTime: string;
  /** 24h "HH:mm" local exchange time. */
  closeTime: string;
  /**
   * Trading weekdays, 0 = Sunday .. 6 = Saturday, in the session timezone.
   * Does not account for exchange holidays — see market-status.ts.
   */
  tradingDays: number[];
}

export interface MarketConfig {
  id: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  exchange: string;
  session: TradingSessionConfig;
  instruments: InstrumentConfig[];
}

const WEEKDAYS = [1, 2, 3, 4, 5];

export const MARKET_REGISTRY: MarketConfig[] = [
  {
    id: "india",
    country: "India",
    region: "Asia",
    city: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
    exchange: "NSE/BSE",
    session: {
      timezone: "Asia/Kolkata",
      openTime: "09:15",
      closeTime: "15:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "nifty-50", symbol: "NIFTY50", name: "Nifty 50", currency: "INR" },
      { id: "bank-nifty", symbol: "BANKNIFTY", name: "Bank Nifty", currency: "INR" },
      { id: "sensex", symbol: "SENSEX", name: "Sensex", currency: "INR" },
    ],
  },
  {
    id: "united-states",
    country: "United States",
    region: "Americas",
    city: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    exchange: "NYSE/Nasdaq",
    session: {
      timezone: "America/New_York",
      openTime: "09:30",
      closeTime: "16:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "sp-500", symbol: "SPX", name: "S&P 500", currency: "USD" },
      { id: "nasdaq-100", symbol: "NDX", name: "Nasdaq-100", currency: "USD" },
      { id: "dow-jones", symbol: "DJI", name: "Dow Jones", currency: "USD" },
    ],
  },
  {
    id: "japan",
    country: "Japan",
    region: "Asia",
    city: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    exchange: "TSE",
    session: {
      timezone: "Asia/Tokyo",
      openTime: "09:00",
      closeTime: "15:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "nikkei-225", symbol: "N225", name: "Nikkei 225", currency: "JPY" },
      { id: "topix", symbol: "TOPX", name: "TOPIX", currency: "JPY" },
    ],
  },
  {
    id: "hong-kong",
    country: "Hong Kong",
    region: "Asia",
    city: "Hong Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    exchange: "HKEX",
    session: {
      timezone: "Asia/Hong_Kong",
      openTime: "09:30",
      closeTime: "16:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "hang-seng", symbol: "HSI", name: "Hang Seng", currency: "HKD" },
    ],
  },
  {
    id: "china",
    country: "China",
    region: "Asia",
    city: "Shanghai",
    latitude: 31.2304,
    longitude: 121.4737,
    exchange: "SSE",
    session: {
      timezone: "Asia/Shanghai",
      openTime: "09:30",
      closeTime: "15:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "shanghai-composite", symbol: "SHCOMP", name: "Shanghai Composite", currency: "CNY" },
      { id: "csi-300", symbol: "CSI300", name: "CSI 300", currency: "CNY" },
    ],
  },
  {
    id: "south-korea",
    country: "South Korea",
    region: "Asia",
    city: "Seoul",
    latitude: 37.5665,
    longitude: 126.978,
    exchange: "KRX",
    session: {
      timezone: "Asia/Seoul",
      openTime: "09:00",
      closeTime: "15:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "kospi", symbol: "KOSPI", name: "KOSPI", currency: "KRW" }],
  },
  {
    id: "australia",
    country: "Australia",
    region: "Oceania",
    city: "Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
    exchange: "ASX",
    session: {
      timezone: "Australia/Sydney",
      openTime: "10:00",
      closeTime: "16:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "asx-200", symbol: "XJO", name: "S&P/ASX 200", currency: "AUD" },
    ],
  },
  {
    id: "united-kingdom",
    country: "United Kingdom",
    region: "Europe",
    city: "London",
    latitude: 51.5072,
    longitude: -0.1276,
    exchange: "LSE",
    session: {
      timezone: "Europe/London",
      openTime: "08:00",
      closeTime: "16:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "ftse-100", symbol: "UKX", name: "FTSE 100", currency: "GBP" }],
  },
  {
    id: "germany",
    country: "Germany",
    region: "Europe",
    city: "Frankfurt",
    latitude: 50.1109,
    longitude: 8.6821,
    exchange: "Xetra",
    session: {
      timezone: "Europe/Berlin",
      openTime: "09:00",
      closeTime: "17:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "dax", symbol: "DAX", name: "DAX", currency: "EUR" }],
  },
  {
    id: "france",
    country: "France",
    region: "Europe",
    city: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    exchange: "Euronext Paris",
    session: {
      timezone: "Europe/Paris",
      openTime: "09:00",
      closeTime: "17:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "cac-40", symbol: "PX1", name: "CAC 40", currency: "EUR" }],
  },
  {
    id: "eurozone",
    country: "Eurozone",
    region: "Europe",
    city: "Frankfurt/Brussels",
    latitude: 50.8503,
    longitude: 4.3517,
    exchange: "Euronext/Eurozone",
    session: {
      timezone: "Europe/Brussels",
      openTime: "09:00",
      closeTime: "17:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "euro-stoxx-50", symbol: "SX5E", name: "EURO STOXX 50", currency: "EUR" },
    ],
  },
  {
    id: "switzerland",
    country: "Switzerland",
    region: "Europe",
    city: "Zurich",
    latitude: 47.3769,
    longitude: 8.5417,
    exchange: "SIX",
    session: {
      timezone: "Europe/Zurich",
      openTime: "09:00",
      closeTime: "17:30",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "smi", symbol: "SMI", name: "SMI", currency: "CHF" }],
  },
  {
    id: "canada",
    country: "Canada",
    region: "Americas",
    city: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    exchange: "TSX",
    session: {
      timezone: "America/Toronto",
      openTime: "09:30",
      closeTime: "16:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "tsx-composite", symbol: "GSPTSE", name: "S&P/TSX Composite", currency: "CAD" },
    ],
  },
  {
    id: "brazil",
    country: "Brazil",
    region: "Americas",
    city: "São Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    exchange: "B3",
    session: {
      timezone: "America/Sao_Paulo",
      openTime: "10:00",
      closeTime: "17:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [{ id: "ibovespa", symbol: "IBOV", name: "Ibovespa", currency: "BRL" }],
  },
  {
    id: "singapore",
    country: "Singapore",
    region: "Asia",
    city: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    exchange: "SGX",
    session: {
      timezone: "Asia/Singapore",
      openTime: "09:00",
      closeTime: "17:00",
      tradingDays: WEEKDAYS,
    },
    instruments: [
      { id: "straits-times", symbol: "STI", name: "Straits Times Index", currency: "SGD" },
    ],
  },
];

export function getMarketConfig(marketId: string): MarketConfig | undefined {
  return MARKET_REGISTRY.find((market) => market.id === marketId);
}

export function getMarketConfigs(marketIds?: string[]): MarketConfig[] {
  if (!marketIds || marketIds.length === 0) return MARKET_REGISTRY;
  const requested = new Set(marketIds);
  return MARKET_REGISTRY.filter((market) => requested.has(market.id));
}
