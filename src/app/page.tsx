import { Suspense } from "react";
import { fetchCoinsFromCoinGecko } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { CoinTable } from "@/components/coins/CoinTable";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default async function HomePage() {
  let initialCoins = null;
  let initialError: string | null = null;

  try {
    initialCoins = await fetchCoinsFromCoinGecko();
  } catch (err) {
    initialError =
      err instanceof Error ? err.message : "Failed to load market data";
  }

  return (
    <>
      <Header initialCoins={initialCoins ?? []} />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px 24px 48px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Spot prices · USD
          </h1>
        </div>

        <Suspense fallback={<TableSkeleton rows={15} />}>
          <CoinTable
            initialCoins={initialCoins ?? []}
            initialError={initialError}
          />
        </Suspense>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--color-text-3)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>
          Data via{" "}
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-text-2)", textDecoration: "underline" }}
          >
            CoinGecko
          </a>
          . Refreshes every 60s.
        </span>
        <span>
          Built by{" "}
          <a
            href="https://github.com/cadsix"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-text-2)", textDecoration: "underline" }}
          >
            cadsix
          </a>
        </span>
      </footer>
    </>
  );
}
