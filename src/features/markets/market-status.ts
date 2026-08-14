import type { MarketConfig } from "./market-registry";
import type { MarketStatus } from "./market-types";

/**
 * Exchange holiday calendar, keyed by market id, values are local
 * "YYYY-MM-DD" dates (in the market's own session timezone) on which the
 * exchange is closed.
 *
 * PHASE 1 DISCLAIMER: this calendar is intentionally empty. It exists so
 * holidays can be layered in later, but any date list used in production
 * MUST be validated against an authoritative exchange-calendar source
 * (e.g. the exchange's own published calendar or a licensed data feed).
 * Do not hand-populate this from memory/guesswork.
 */
export const HOLIDAY_CALENDAR: Record<string, string[]> = {};

export interface MarketStatusResult {
  status: MarketStatus;
  nextOpenAt: string | null;
  nextCloseAt: string | null;
  statusReason: string | null;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_NAMES.indexOf(parts.weekday ?? "Sun"),
  };
}

/** Converts a local wall-clock date/time in `timeZone` to a UTC instant. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 2; i += 1) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const asIfUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const diff = asIfUtc - Date.UTC(year, month - 1, day, hour, minute, 0);
    guess -= diff;
  }
  return new Date(guess);
}

function toLocalDateKey(parts: ZonedParts): string {
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

function isHoliday(marketId: string, dateKey: string): boolean {
  return HOLIDAY_CALENDAR[marketId]?.includes(dateKey) ?? false;
}

function isTradingDay(config: MarketConfig, weekday: number, dateKey: string): boolean {
  return (
    config.session.tradingDays.includes(weekday) &&
    !isHoliday(config.id, dateKey)
  );
}

/** Finds the open/close instants (UTC) of the next trading session strictly after `from`. */
function findNextSession(
  config: MarketConfig,
  from: Date,
): { openAt: Date; closeAt: Date } {
  const { timezone, openTime, closeTime } = config.session;
  const open = parseTime(openTime);
  const close = parseTime(closeTime);

  for (let offsetDays = 0; offsetDays <= 14; offsetDays += 1) {
    const candidateDate = new Date(from.getTime() + offsetDays * 86_400_000);
    const parts = getZonedParts(candidateDate, timezone);
    const dateKey = toLocalDateKey(parts);
    if (!isTradingDay(config, parts.weekday, dateKey)) continue;

    const openAt = zonedTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      open.hour,
      open.minute,
      timezone,
    );
    if (openAt.getTime() <= from.getTime()) continue;

    const closeAt = zonedTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      close.hour,
      close.minute,
      timezone,
    );
    return { openAt, closeAt };
  }

  // No trading day found in the next 14 days (e.g. misconfiguration) —
  // callers treat this as UNAVAILABLE rather than throwing.
  throw new Error(`No trading session found for market "${config.id}" within 14 days`);
}

/**
 * Market status is derived purely from the market's configured session
 * hours/timezone and holiday calendar — never from quote data. This keeps
 * status calculation independent from (and available even when) quote
 * retrieval fails.
 */
export function getMarketStatus(
  config: MarketConfig,
  now: Date = new Date(),
): MarketStatusResult {
  const { timezone, openTime, closeTime } = config.session;
  let parts: ZonedParts;
  try {
    parts = getZonedParts(now, timezone);
  } catch {
    return {
      status: "UNAVAILABLE",
      nextOpenAt: null,
      nextCloseAt: null,
      statusReason: `Unable to resolve timezone "${timezone}"`,
    };
  }

  const dateKey = toLocalDateKey(parts);
  const open = parseTime(openTime);
  const close = parseTime(closeTime);
  const minutesNow = parts.hour * 60 + parts.minute;
  const openMinutes = open.hour * 60 + open.minute;
  const closeMinutes = close.hour * 60 + close.minute;

  if (isHoliday(config.id, dateKey)) {
    try {
      const next = findNextSession(config, now);
      return {
        status: "HOLIDAY",
        nextOpenAt: next.openAt.toISOString(),
        nextCloseAt: next.closeAt.toISOString(),
        statusReason: "Exchange holiday",
      };
    } catch {
      return {
        status: "HOLIDAY",
        nextOpenAt: null,
        nextCloseAt: null,
        statusReason: "Exchange holiday",
      };
    }
  }

  const isOpenNow =
    config.session.tradingDays.includes(parts.weekday) &&
    minutesNow >= openMinutes &&
    minutesNow < closeMinutes;

  try {
    if (isOpenNow) {
      const closeAt = zonedTimeToUtc(
        parts.year,
        parts.month,
        parts.day,
        close.hour,
        close.minute,
        timezone,
      );
      const next = findNextSession(config, closeAt);
      return {
        status: "OPEN",
        nextOpenAt: next.openAt.toISOString(),
        nextCloseAt: closeAt.toISOString(),
        statusReason: null,
      };
    }

    const next = findNextSession(config, now);
    return {
      status: "CLOSED",
      nextOpenAt: next.openAt.toISOString(),
      nextCloseAt: next.closeAt.toISOString(),
      statusReason: null,
    };
  } catch (error) {
    return {
      status: "UNAVAILABLE",
      nextOpenAt: null,
      nextCloseAt: null,
      statusReason: error instanceof Error ? error.message : "Unknown status error",
    };
  }
}
