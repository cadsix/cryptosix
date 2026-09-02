"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Image from "next/image";
import type { Coin } from "@/lib/api";
import { useCoins } from "@/hooks/useCoins";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Sparkline } from "@/components/ui/Sparkline";
import { ChartModal } from "@/components/ui/ChartModal";
import { PortfolioBar } from "@/components/ui/PortfolioBar";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  formatPrice,
  formatPercent,
  formatMarketCap,
  formatPortfolioValue,
  debounce,
} from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | "market_cap_rank"
  | "current_price"
  | "price_change_percentage_24h"
  | "market_cap";
type SortDir = "asc" | "desc";

interface CoinTableProps {
  initialCoins: Coin[];
  initialError: string | null;
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="8"
      height="10"
      viewBox="0 0 8 10"
      fill="none"
      style={{
        display: "inline",
        marginLeft: 4,
        verticalAlign: "middle",
        opacity: active ? 1 : 0.25,
      }}
    >
      <path
        d="M4 1L7 4H1L4 1Z"
        fill={active && dir === "asc" ? "currentColor" : "#555555"}
      />
      <path
        d="M4 9L1 6H7L4 9Z"
        fill={active && dir === "desc" ? "currentColor" : "#555555"}
      />
    </svg>
  );
}

// ─── Search icon ──────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{ display: "block" }}
    >
      <circle cx="6" cy="6" r="4" />
      <path d="M9.5 9.5L12.5 12.5" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CoinTable({ initialCoins, initialError }: CoinTableProps) {
  const {
    coins,
    error,
    isLoading,
    isRefreshing,
    lastUpdated,
    countdown,
    refresh,
  } = useCoins(initialCoins);

  const portfolio = usePortfolio(coins);

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const debouncedSetSearch = useRef(
    debounce((v: unknown) => setSearch(v as string), 300)
  ).current;

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawSearch(e.target.value);
      debouncedSetSearch(e.target.value);
    },
    [debouncedSetSearch]
  );

  const clearSearch = useCallback(() => {
    setRawSearch("");
    setSearch("");
  }, []);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "market_cap_rank" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const displayed = useMemo(() => {
    let list = [...coins];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = (a[sortKey] ?? 0) as number;
      const bv = (b[sortKey] ?? 0) as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [coins, search, sortKey, sortDir]);

  // Flash rows on price change
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const next: Record<string, "up" | "down"> = {};
    coins.forEach((c) => {
      const prev = prevPrices.current[c.id];
      if (prev !== undefined && prev !== c.current_price) {
        next[c.id] = c.current_price > prev ? "up" : "down";
      }
      prevPrices.current[c.id] = c.current_price;
    });
    if (Object.keys(next).length > 0) {
      setFlashMap(next);
      const t = setTimeout(() => setFlashMap({}), 900);
      return () => clearTimeout(t);
    }
  }, [coins]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return <TableSkeleton rows={15} />;

  // ── Error ─────────────────────────────────────────────────────────────────
  const displayError = error ?? initialError;
  if (displayError && coins.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 4 }}>
          Failed to load market data
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-3)", marginBottom: 16 }}>
          {displayError}
        </p>
        <button
          onClick={refresh}
          style={{
            fontSize: 12,
            padding: "6px 14px",
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border-2)",
            color: "var(--color-text-1)",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Portfolio summary bar (only visible when holdings exist) ──────── */}
      <PortfolioBar portfolio={portfolio} coins={coins} />

      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 240, flex: "0 0 auto" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-3)",
                pointerEvents: "none",
              }}
            >
              <SearchIcon />
            </span>
            <input
              type="search"
              value={rawSearch}
              onChange={handleSearch}
              placeholder="Filter by name or ticker"
              aria-label="Search cryptocurrencies"
              style={{
                width: 220,
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-1)",
                fontSize: 12,
                padding: "6px 28px 6px 30px",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border-2)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
            {rawSearch && (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-3)",
                  fontSize: 11,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: count + live + refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
            <span style={{ color: "var(--color-text-3)" }}>
              {search
                ? `${displayed.length} / ${coins.length}`
                : `${coins.length} assets`}
            </span>
            <LiveIndicator
              lastUpdated={lastUpdated}
              countdown={countdown}
              isRefreshing={isRefreshing}
            />
            <button
              onClick={refresh}
              disabled={isRefreshing}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: isRefreshing
                  ? "var(--color-text-3)"
                  : "var(--color-text-2)",
                cursor: isRefreshing ? "default" : "pointer",
                letterSpacing: "0.03em",
              }}
            >
              {isRefreshing ? "updating..." : "refresh"}
            </button>
          </div>
        </div>

        {/* ── Desktop table ─────────────────────────────────────────────────── */}
        <div className="hidden sm:block" style={{ overflowX: "auto" }}>
          <table className="data-table" aria-label="Cryptocurrency prices">
            <thead>
              <tr>
                <Th
                  onClick={() => handleSort("market_cap_rank")}
                  active={sortKey === "market_cap_rank"}
                  dir={sortDir}
                  width={48}
                  sortable
                >
                  #
                </Th>
                <Th align="left">Name</Th>
                <Th
                  onClick={() => handleSort("current_price")}
                  active={sortKey === "current_price"}
                  dir={sortDir}
                  align="right"
                  sortable
                >
                  Price
                </Th>
                <Th
                  onClick={() => handleSort("price_change_percentage_24h")}
                  active={sortKey === "price_change_percentage_24h"}
                  dir={sortDir}
                  align="right"
                  sortable
                >
                  24h
                </Th>
                <Th
                  onClick={() => handleSort("market_cap")}
                  active={sortKey === "market_cap"}
                  dir={sortDir}
                  align="right"
                  sortable
                >
                  Mkt Cap
                </Th>
                <Th align="right" width={96}>
                  7d
                </Th>
                <Th align="right" width={130}>
                  Holdings
                </Th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState query={search} onClear={clearSearch} />
                  </td>
                </tr>
              ) : (
                displayed.map((coin) => (
                  <CoinRow
                    key={coin.id}
                    coin={coin}
                    flash={flashMap[coin.id]}
                    holding={portfolio.holdings[coin.id] ?? 0}
                    holdingValue={portfolio.coinValue(coin)}
                    onSetHolding={(amt) => portfolio.setHolding(coin.id, amt)}
                    onOpenChart={() => setSelectedCoin(coin)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile list ───────────────────────────────────────────────────── */}
        <div className="sm:hidden">
          {displayed.length === 0 ? (
            <EmptyState query={search} onClear={clearSearch} />
          ) : (
            displayed.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                flash={flashMap[coin.id]}
                holding={portfolio.holdings[coin.id] ?? 0}
                holdingValue={portfolio.coinValue(coin)}
                onSetHolding={(amt) => portfolio.setHolding(coin.id, amt)}
                onOpenChart={() => setSelectedCoin(coin)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chart modal ───────────────────────────────────────────────────────── */}
      <ChartModal
        coin={selectedCoin}
        onClose={() => setSelectedCoin(null)}
      />
    </>
  );
}

// ─── Th helper ────────────────────────────────────────────────────────────────

function Th({
  children,
  onClick,
  active = false,
  dir = "asc",
  align = "left",
  width,
  sortable = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
  align?: "left" | "right";
  width?: number;
  sortable?: boolean;
}) {
  return (
    <th
      className={sortable ? "sortable" : ""}
      onClick={onClick}
      style={{
        textAlign: align,
        width,
        color: active ? "var(--color-text-2)" : undefined,
      }}
    >
      {children}
      {sortable && <SortIndicator active={active} dir={dir} />}
    </th>
  );
}

// ─── Desktop row ──────────────────────────────────────────────────────────────

function CoinRow({
  coin,
  flash,
  holding,
  holdingValue,
  onSetHolding,
  onOpenChart,
}: {
  coin: Coin;
  flash?: "up" | "down";
  holding: number;
  holdingValue: number;
  onSetHolding: (amt: number) => void;
  onOpenChart: () => void;
}) {
  const change = coin.price_change_percentage_24h ?? 0;
  const isPositive = change >= 0;
  const is7dPositive = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;

  return (
    <tr
      style={{
        backgroundColor:
          flash === "up"
            ? "var(--color-up-bg)"
            : flash === "down"
            ? "var(--color-down-bg)"
            : undefined,
        transition: "background-color 0.9s ease",
      }}
    >
      {/* Rank */}
      <td>
        <span
          className="num"
          style={{ fontSize: 12, color: "var(--color-text-3)" }}
        >
          {coin.market_cap_rank}
        </span>
      </td>

      {/* Name — clicking opens chart */}
      <td
        onClick={onOpenChart}
        style={{ cursor: "pointer" }}
        title={`View ${coin.name} chart`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image
            src={coin.image}
            alt={coin.name}
            width={24}
            height={24}
            style={{ borderRadius: "50%", flexShrink: 0 }}
            unoptimized
          />
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: "var(--color-text-1)",
              }}
            >
              {coin.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {coin.symbol}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td style={{ textAlign: "right" }}>
        <span
          className="num"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color:
              flash === "up"
                ? "var(--color-up)"
                : flash === "down"
                ? "var(--color-down)"
                : "var(--color-text-1)",
            transition: "color 0.9s ease",
          }}
        >
          {formatPrice(coin.current_price)}
        </span>
      </td>

      {/* 24h change */}
      <td style={{ textAlign: "right" }}>
        <span
          className="num"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isPositive ? "var(--color-up)" : "var(--color-down)",
          }}
        >
          {formatPercent(change)}
        </span>
      </td>

      {/* Market cap */}
      <td style={{ textAlign: "right" }}>
        <span
          className="num"
          style={{ fontSize: 12, color: "var(--color-text-2)" }}
        >
          {formatMarketCap(coin.market_cap)}
        </span>
      </td>

      {/* Sparkline */}
      <td style={{ textAlign: "right" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Sparkline
            data={coin.sparkline_in_7d?.price ?? []}
            positive={is7dPositive}
          />
        </div>
      </td>

      {/* Holdings input */}
      <td style={{ textAlign: "right" }}>
        <HoldingCell
          coinSymbol={coin.symbol}
          holding={holding}
          holdingValue={holdingValue}
          price={coin.current_price}
          onSetHolding={onSetHolding}
        />
      </td>
    </tr>
  );
}

// ─── Holdings input cell ──────────────────────────────────────────────────────

function HoldingCell({
  coinSymbol,
  holding,
  holdingValue,
  price,
  onSetHolding,
}: {
  coinSymbol: string;
  holding: number;
  holdingValue: number;
  price: number;
  onSetHolding: (amt: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(holding > 0 ? String(holding) : "");

  // Keep raw in sync if holding changes externally (e.g. on refresh)
  useEffect(() => {
    if (!focused) {
      setRaw(holding > 0 ? String(holding) : "");
    }
  }, [holding, focused]);

  const commit = () => {
    const parsed = parseFloat(raw);
    onSetHolding(isNaN(parsed) ? 0 : parsed);
    setFocused(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number"
          min="0"
          step="any"
          value={raw}
          placeholder="0"
          aria-label={`${coinSymbol} holdings`}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          style={{
            width: 80,
            background: focused ? "var(--color-bg)" : "transparent",
            border: "1px solid",
            borderColor: focused ? "var(--color-border-2)" : "transparent",
            color: "var(--color-text-1)",
            fontSize: 12,
            padding: "3px 6px",
            textAlign: "right",
            outline: "none",
            fontFamily: "var(--font-geist-mono)",
            fontVariantNumeric: "tabular-nums",
            transition: "border-color 0.1s, background 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!focused)
              e.currentTarget.style.borderColor = "var(--color-border)";
          }}
          onMouseLeave={(e) => {
            if (!focused) e.currentTarget.style.borderColor = "transparent";
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "var(--color-text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            width: 32,
            textAlign: "left",
          }}
        >
          {coinSymbol}
        </span>
      </div>
      {holdingValue > 0 && (
        <span
          className="num"
          style={{ fontSize: 10, color: "var(--color-text-3)" }}
        >
          {formatPortfolioValue(holdingValue)}
        </span>
      )}
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function CoinCard({
  coin,
  flash,
  holding,
  holdingValue,
  onSetHolding,
  onOpenChart,
}: {
  coin: Coin;
  flash?: "up" | "down";
  holding: number;
  holdingValue: number;
  onSetHolding: (amt: number) => void;
  onOpenChart: () => void;
}) {
  const change = coin.price_change_percentage_24h ?? 0;
  const isPositive = change >= 0;
  const is7dPositive = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-border)",
        backgroundColor:
          flash === "up"
            ? "var(--color-up-bg)"
            : flash === "down"
            ? "var(--color-down-bg)"
            : undefined,
        transition: "background-color 0.9s ease",
      }}
    >
      <span
        className="num"
        style={{
          fontSize: 11,
          color: "var(--color-text-3)",
          width: 20,
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        {coin.market_cap_rank}
      </span>

      {/* Icon — tap opens chart */}
      <div onClick={onOpenChart} style={{ cursor: "pointer", flexShrink: 0 }}>
        <Image
          src={coin.image}
          alt={coin.name}
          width={32}
          height={32}
          style={{ borderRadius: "50%", display: "block" }}
          unoptimized
        />
      </div>

      {/* Name */}
      <div
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={onOpenChart}
      >
        <div
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: "var(--color-text-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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

      {/* Price + change */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          className="num"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color:
              flash === "up"
                ? "var(--color-up)"
                : flash === "down"
                ? "var(--color-down)"
                : "var(--color-text-1)",
            transition: "color 0.9s ease",
          }}
        >
          {formatPrice(coin.current_price)}
        </div>
        <div
          className="num"
          style={{
            fontSize: 11,
            color: isPositive ? "var(--color-up)" : "var(--color-down)",
          }}
        >
          {formatPercent(change)}
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ flexShrink: 0 }}>
        <Sparkline
          data={coin.sparkline_in_7d?.price ?? []}
          positive={is7dPositive}
          width={52}
          height={28}
        />
      </div>

      {/* Holdings input */}
      <div style={{ flexShrink: 0 }}>
        <input
          type="number"
          min="0"
          step="any"
          value={holding > 0 ? String(holding) : ""}
          placeholder="0"
          aria-label={`${coin.symbol} holdings`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onSetHolding(isNaN(v) ? 0 : v);
          }}
          style={{
            width: 60,
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-1)",
            fontSize: 11,
            padding: "4px 6px",
            textAlign: "right",
            outline: "none",
            fontFamily: "var(--font-geist-mono)",
          }}
        />
        {holdingValue > 0 && (
          <div
            className="num"
            style={{
              fontSize: 10,
              color: "var(--color-text-3)",
              textAlign: "right",
              marginTop: 2,
            }}
          >
            {formatPortfolioValue(holdingValue)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-text-2)",
          marginBottom: 4,
        }}
      >
        No results for &ldquo;{query}&rdquo;
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--color-text-3)",
          marginBottom: 12,
        }}
      >
        Try the full name or ticker symbol
      </p>
      <button
        onClick={onClear}
        style={{
          fontSize: 11,
          padding: "4px 12px",
          border: "1px solid var(--color-border)",
          backgroundColor: "transparent",
          color: "var(--color-text-2)",
          cursor: "pointer",
        }}
      >
        Clear filter
      </button>
    </div>
  );
}
