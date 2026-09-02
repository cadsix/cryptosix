"use client";

import { timeAgo } from "@/lib/utils";

interface LiveIndicatorProps {
  lastUpdated: Date | null;
  countdown: number;
  isRefreshing: boolean;
}

export function LiveIndicator({
  lastUpdated,
  countdown,
  isRefreshing,
}: LiveIndicatorProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--color-text-3)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: isRefreshing
            ? "#f59e0b"
            : "var(--color-up)",
          display: "inline-block",
          flexShrink: 0,
          opacity: isRefreshing ? 0.9 : 0.8,
        }}
      />

      {isRefreshing ? (
        <span>updating</span>
      ) : lastUpdated ? (
        <span>
          {timeAgo(lastUpdated)}&ensp;·&ensp;
          <span
            style={{
              color: countdown <= 10 ? "#f59e0b" : "var(--color-text-3)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {countdown}s
          </span>
        </span>
      ) : (
        <span>connecting</span>
      )}
    </span>
  );
}
