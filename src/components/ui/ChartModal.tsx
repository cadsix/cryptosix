"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getCoinChart } from "@/lib/api";
import type { Coin } from "@/lib/api";
import { formatPrice, formatPercent } from "@/lib/utils";
import { ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import Image from "next/image";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

interface ChartModalProps {
  coin: Coin | null;
  onClose: () => void;
}

interface PricePoint {
  ts: number;
  price: number;
  label: string;
}

export function ChartModal({ coin, onClose }: ChartModalProps) {
  const [days, setDays] = useState<number>(7);
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(
    async (coinId: string, d: number) => {
      setLoading(true);
      setError(null);
      const result = await getCoinChart(coinId, d);
      if (result.data) {
        const formatted = result.data.prices.map(([ts, price]) => ({
          ts,
          price,
          label: new Date(ts).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(d <= 1 ? { hour: "2-digit", minute: "2-digit" } : {}),
          }),
        }));
        setPoints(formatted);
      } else {
        setError(result.error ?? "Failed to load chart");
      }
      setLoading(false);
    },
    []
  );

  // Fetch whenever coin or range changes
  useEffect(() => {
    if (!coin) return;
    setPoints([]);
    fetchChart(coin.id, days);
  }, [coin, days, fetchChart]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!coin) return null;

  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;
  const chartColor = isPositive ? "#22c55e" : "#f43f5e";

  // Price range for Y axis
  const prices = points.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const pricePad = (maxPrice - minPrice) * 0.08;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 50,
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${coin.name} price chart`}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(760px, 95vw)",
          maxHeight: "90vh",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "scaleIn 0.15s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src={coin.image}
              alt={coin.name}
              width={28}
              height={28}
              style={{ borderRadius: "50%" }}
              unoptimized
            />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-text-1)",
                  lineHeight: 1.2,
                }}
              >
                {coin.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {coin.symbol}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              className="num"
              style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-1)" }}
            >
              {formatPrice(coin.current_price)}
            </span>
            <span
              className="num"
              style={{
                fontSize: 12,
                color: isPositive ? "var(--color-up)" : "var(--color-down)",
              }}
            >
              {formatPercent(coin.price_change_percentage_24h)} 24h
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                marginLeft: 12,
                fontSize: 16,
                color: "var(--color-text-3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                lineHeight: 1,
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Range tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            padding: "10px 20px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "4px 10px",
                cursor: "pointer",
                background: days === r.days ? "var(--color-surface-2)" : "none",
                border: "1px solid",
                borderColor: days === r.days ? "var(--color-border-2)" : "transparent",
                color: days === r.days ? "var(--color-text-1)" : "var(--color-text-3)",
                letterSpacing: "0.04em",
                transition: "color 0.1s, background 0.1s",
                marginRight: 2,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, padding: "16px 4px 8px 4px", minHeight: 240 }}>
          {loading ? (
            <div style={{ padding: "0 16px" }}>
              <ChartSkeleton />
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 8,
                color: "var(--color-text-3)",
                fontSize: 12,
              }}
            >
              <span>{error}</span>
              <button
                onClick={() => fetchChart(coin.id, days)}
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  border: "1px solid var(--color-border)",
                  background: "none",
                  color: "var(--color-text-2)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={points}
                margin={{ top: 4, right: 20, bottom: 0, left: 60 }}
              >
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="0"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#555555", fontFamily: "var(--font-geist-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />

                <YAxis
                  domain={[minPrice - pricePad, maxPrice + pricePad]}
                  tick={{ fontSize: 10, fill: "#555555", fontFamily: "var(--font-geist-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(1)}k`
                      : `$${v.toFixed(v < 1 ? 4 : 2)}`
                  }
                  width={56}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #242424",
                          padding: "6px 10px",
                          fontSize: 11,
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        <div style={{ color: "#888", marginBottom: 2 }}>{label}</div>
                        <div style={{ color: "#e8e8e8", fontWeight: 600 }}>
                          {formatPrice(payload[0].value as number)}
                        </div>
                      </div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  fill="url(#chartGrad)"
                  dot={false}
                  isAnimationActive={points.length < 100}
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          {[
            {
              label: "Market Cap",
              value: coin.market_cap
                ? `$${(coin.market_cap / 1e9).toFixed(2)}B`
                : "—",
            },
            {
              label: "24h Volume",
              value: coin.total_volume
                ? `$${(coin.total_volume / 1e9).toFixed(2)}B`
                : "—",
            },
            {
              label: "Rank",
              value: `#${coin.market_cap_rank}`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "10px 20px",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: 10, color: "var(--color-text-3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </div>
              <div className="num" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-1)" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
