"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCoins, type Coin } from "@/lib/api";

const REFRESH_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? "60000",
  10
);

export interface UseCoinsResult {
  coins: Coin[];
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  /** seconds until next auto-refresh */
  countdown: number;
  /** manually trigger a refresh */
  refresh: () => void;
}

export function useCoins(initialCoins: Coin[] = []): UseCoinsResult {
  const [coins, setCoins] = useState<Coin[]>(initialCoins);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialCoins.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialCoins.length > 0 ? new Date() : null
  );
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  // Use a ref so the refresh callback always sees the latest value
  const countdownRef = useRef(REFRESH_INTERVAL / 1000);

  const fetchCoins = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const result = await getCoins();

    if (result.data) {
      setCoins(result.data);
      setLastUpdated(new Date());
      setError(null);
    } else {
      setError(result.error ?? "Failed to fetch data");
    }

    setIsLoading(false);
    setIsRefreshing(false);

    // Reset countdown after every fetch
    countdownRef.current = REFRESH_INTERVAL / 1000;
    setCountdown(REFRESH_INTERVAL / 1000);
  }, []);

  // Initial fetch if no server-side data was passed
  useEffect(() => {
    if (initialCoins.length === 0) {
      fetchCoins(false);
    }
  }, [fetchCoins, initialCoins.length]);

  // Auto-refresh interval
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      fetchCoins(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshTimer);
  }, [fetchCoins]);

  // Countdown ticker — fires every second
  useEffect(() => {
    const ticker = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  const refresh = useCallback(() => fetchCoins(false), [fetchCoins]);

  return {
    coins,
    error,
    isLoading,
    isRefreshing,
    lastUpdated,
    countdown,
    refresh,
  };
}
