"use client";

import { useEffect, useState } from "react";
import type { Coin } from "@/lib/api";

interface HeaderProps {
  initialCoins: Coin[];
}

export function Header({ initialCoins }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const gainers = initialCoins.filter(
    (c) => (c.price_change_percentage_24h ?? 0) >= 0
  ).length;
  const losers = initialCoins.length - gainers;

  return (
    <header
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        className="max-w-screen-2xl mx-auto px-6"
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-1)",
            }}
          >
            cryptoviz
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "var(--color-text-3)",
              textTransform: "uppercase",
            }}
          >
            by cadsix
          </span>
        </div>

        {/* Center stats */}
        {initialCoins.length > 0 && (
          <div
            className="hidden md:flex items-center"
            style={{ gap: 24, fontSize: 12, color: "var(--color-text-3)" }}
          >
            <StatItem label="Coins" value={`${initialCoins.length}`} />
            <Divider />
            <StatItem
              label="Gainers"
              value={`${gainers}`}
              valueColor="var(--color-up)"
            />
            <StatItem
              label="Losers"
              value={`${losers}`}
              valueColor="var(--color-down)"
            />
          </div>
        )}

        {/* Right: clock */}
        <div
          className="hidden sm:flex items-center"
          style={{ gap: 6, fontSize: 12 }}
        >
          {/* Live dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "var(--color-up)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span className="num" style={{ color: "var(--color-text-3)" }}>
            {now
              ? now.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              : "--:--:--"}
          </span>
        </div>
      </div>

      {/* ── Ticker strip ────────────────────────────────────────────────────── */}
      {initialCoins.length > 0 && (
        <TickerStrip coins={initialCoins.slice(0, 12)} />
      )}
    </header>
  );
}

function StatItem({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ color: "var(--color-text-3)" }}>{label}</span>
      <span
        className="num"
        style={{ color: valueColor ?? "var(--color-text-2)", fontWeight: 500 }}
      >
        {value}
      </span>
    </span>
  );
}

function Divider() {
  return (
    <span
      style={{
        width: 1,
        height: 12,
        backgroundColor: "var(--color-border-2)",
        display: "inline-block",
      }}
    />
  );
}

function TickerStrip({ coins }: { coins: Coin[] }) {
  const items = [...coins, ...coins];

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        height: 28,
        overflow: "hidden",
        position: "relative",
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          animation: "ticker 50s linear infinite",
        }}
      >
        {items.map((coin, i) => {
          const change = coin.price_change_percentage_24h ?? 0;
          const up = change >= 0;
          return (
            <span
              key={`${coin.id}-${i}`}
              style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "var(--color-text-2)",
                }}
              >
                {coin.symbol.toUpperCase()}
              </span>
              <span
                className="num"
                style={{ fontSize: 12, color: "var(--color-text-1)" }}
              >
                $
                {coin.current_price.toLocaleString("en-US", {
                  maximumFractionDigits: coin.current_price < 1 ? 4 : 2,
                  minimumFractionDigits: 2,
                })}
              </span>
              <span
                className="num"
                style={{
                  fontSize: 11,
                  color: up ? "var(--color-up)" : "var(--color-down)",
                }}
              >
                {up ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0) translateY(-50%); }
          to   { transform: translateX(-50%) translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
