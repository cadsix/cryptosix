"use client";

import { formatPortfolioValue } from "@/lib/utils";
import type { Coin } from "@/lib/api";
import type { UsePortfolioResult } from "@/hooks/usePortfolio";

interface PortfolioBarProps {
  portfolio: UsePortfolioResult;
  coins: Coin[];
}

export function PortfolioBar({ portfolio, coins }: PortfolioBarProps) {
  const { totalValue, holdings, coinValue, hasAny } = portfolio;

  if (!hasAny) return null;

  // Top 3 holdings by value for the breakdown
  const top = coins
    .filter((c) => (holdings[c.id] ?? 0) > 0)
    .map((c) => ({ coin: c, value: coinValue(c) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const holdingCount = Object.keys(holdings).length;

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderBottom: "none",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      {/* Left: total */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--color-text-3)",
          }}
        >
          Portfolio
        </span>
        <span
          className="num"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-text-1)",
            letterSpacing: "-0.01em",
          }}
        >
          {formatPortfolioValue(totalValue)}
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
          {holdingCount} {holdingCount === 1 ? "asset" : "assets"}
        </span>
      </div>

      {/* Right: breakdown of top holdings */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {top.map(({ coin, value }) => (
          <div
            key={coin.id}
            style={{ display: "flex", alignItems: "baseline", gap: 5 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coin.image}
              alt={coin.name}
              width={14}
              height={14}
              style={{ borderRadius: "50%", marginBottom: -1 }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "var(--color-text-3)",
                textTransform: "uppercase",
              }}
            >
              {coin.symbol}
            </span>
            <span
              className="num"
              style={{ fontSize: 12, color: "var(--color-text-2)" }}
            >
              {formatPortfolioValue(value)}
            </span>
          </div>
        ))}
        {holdingCount > 4 && (
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>
            +{holdingCount - 4} more
          </span>
        )}
      </div>
    </div>
  );
}
