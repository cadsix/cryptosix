import { NextRequest, NextResponse } from "next/server";
import { fetchCoinChart } from "@/lib/api";

/**
 * GET /api/coins/[id]/chart?days=7
 *
 * Proxy for CoinGecko's market_chart endpoint.
 * Only called when a user opens the chart modal — not on initial page load.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "7", 10), 365);

  // Validate coin ID to prevent path traversal / injection
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid coin ID" }, { status: 400 });
  }

  try {
    const chart = await fetchCoinChart(id, days);

    return NextResponse.json(chart, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch chart data";
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
