import { NextResponse } from "next/server";
import { fetchCoinsFromCoinGecko, COINS_CACHE_SECONDS } from "@/lib/api";

/**
 * GET /api/coins
 *
 * Proxy for the CoinGecko /coins/markets endpoint.
 * Keeps API keys server-side, adds caching headers, and centralises
 * error/rate-limit handling.
 */
export async function GET() {
  try {
    const coins = await fetchCoinsFromCoinGecko();

    return NextResponse.json(coins, {
      status: 200,
      headers: {
        // Short max-age + stale-while-revalidate: clients see instant data
        // while a background revalidation runs silently.
        "Cache-Control": `public, s-maxage=${COINS_CACHE_SECONDS}, stale-while-revalidate=${COINS_CACHE_SECONDS * 2}`,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch coin data";
    const isRateLimit = message.toLowerCase().includes("rate limit");

    return NextResponse.json(
      { error: message },
      {
        status: isRateLimit ? 429 : 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
