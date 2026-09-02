"use client";

import { useState, useEffect, useCallback } from "react";
import type { Coin } from "@/lib/api";

const STORAGE_KEY = "cryptosix_portfolio";

export interface PortfolioEntry {
  coinId: string;
  amount: number;
}

export interface UsePortfolioResult {
  holdings: Record<string, number>;
  setHolding: (coinId: string, amount: number) => void;
  totalValue: number;
  coinValue: (coin: Coin) => number;
  coinShare: (coin: Coin) => number; // % of total portfolio
  hasAny: boolean;
}

export function usePortfolio(coins: Coin[]): UsePortfolioResult {
  const [holdings, setHoldings] = useState<Record<string, number>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHoldings(JSON.parse(raw));
    } catch {
      // corrupted storage — start fresh
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    } catch {
      // storage full or blocked — fail silently
    }
  }, [holdings]);

  const setHolding = useCallback((coinId: string, amount: number) => {
    setHoldings((prev) => {
      if (amount <= 0) {
        const next = { ...prev };
        delete next[coinId];
        return next;
      }
      return { ...prev, [coinId]: amount };
    });
  }, []);

  const coinValue = useCallback(
    (coin: Coin) => (holdings[coin.id] ?? 0) * (coin.current_price ?? 0),
    [holdings]
  );

  const totalValue = coins.reduce((sum, c) => sum + coinValue(c), 0);

  const coinShare = useCallback(
    (coin: Coin) => {
      if (totalValue === 0) return 0;
      return (coinValue(coin) / totalValue) * 100;
    },
    [coinValue, totalValue]
  );

  const hasAny = Object.values(holdings).some((v) => v > 0);

  return { holdings, setHolding, totalValue, coinValue, coinShare, hasAny };
}
