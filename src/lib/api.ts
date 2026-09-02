/**
 * CoinGecko API types and fetching utilities.
 *
 * Server-side fetchers (fetchCoinsFromCoinGecko, fetchCoinChart) are called
 * from API routes only — never directly from the browser.
 *
 * Client-side fetchers (getCoins, getCoinChart) hit our own proxy routes,
 * which keeps any future API keys server-side and avoids CORS issues.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  circulating_supply: number;
  sparkline_in_7d: {
    price: number[];
  };
}

export interface CoinMarketChart {
  prices: [number, number][];       // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Server-side ISR revalidation interval (seconds) */
export const COINS_CACHE_SECONDS = 60;

/** Number of coins to fetch */
export const COINS_PER_PAGE = 50;

// ─── Server-side fetchers ─────────────────────────────────────────────────────

/**
 * Fetches the top N coins by market cap from CoinGecko.
 * Called from /api/coins only.
 */
export async function fetchCoinsFromCoinGecko(
  page = 1,
  perPage = COINS_PER_PAGE
): Promise<Coin[]> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "7d",
  });

  const res = await fetch(
    `${COINGECKO_BASE}/coins/markets?${params.toString()}`,
    {
      next: { revalidate: COINS_CACHE_SECONDS },
      headers: {
        Accept: "application/json",
        // Uncomment if you have a CoinGecko Pro key:
        // "x-cg-pro-api-key": process.env.COINGECKO_API_KEY ?? "",
      },
    }
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limited by CoinGecko. Please wait a moment.");
    }
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetches historical price data for a single coin.
 * Called from /api/coins/[id]/chart only.
 */
export async function fetchCoinChart(
  coinId: string,
  days = 7
): Promise<CoinMarketChart> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
    interval: days <= 1 ? "hourly" : "daily",
  });

  const res = await fetch(
    `${COINGECKO_BASE}/coins/${coinId}/market_chart?${params.toString()}`,
    {
      next: { revalidate: 300 }, // 5-minute cache for chart data
      headers: { Accept: "application/json" },
    }
  );

  if (!res.ok) {
    throw new Error(`Chart fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── Client-side fetchers (hit our proxy) ────────────────────────────────────

/**
 * Fetches coins from our internal /api/coins proxy.
 * Safe to call from Client Components.
 */
export async function getCoins(): Promise<ApiResponse<Coin[]>> {
  try {
    const res = await fetch("/api/coins", { cache: "no-store" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        error: body.error ?? `Request failed: ${res.status}`,
        timestamp: Date.now(),
      };
    }

    const data: Coin[] = await res.json();
    return { data, error: null, timestamp: Date.now() };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetches chart data from our internal proxy.
 */
export async function getCoinChart(
  coinId: string,
  days = 7
): Promise<ApiResponse<CoinMarketChart>> {
  try {
    const res = await fetch(`/api/coins/${coinId}/chart?days=${days}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        error: body.error ?? `Request failed: ${res.status}`,
        timestamp: Date.now(),
      };
    }

    const data: CoinMarketChart = await res.json();
    return { data, error: null, timestamp: Date.now() };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}
