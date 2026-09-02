"use client";

import { cn } from "@/lib/utils";

// ─── Base skeleton block ──────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded-md", className)}
      aria-hidden="true"
    />
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 15 }: TableSkeletonProps) {
  return (
    <div
      className="glass rounded-xl overflow-hidden"
      aria-label="Loading market data…"
      aria-busy="true"
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-4"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        opacity: 1 - (index % 4) * 0.1,
      }}
    >
      {/* Rank */}
      <Skeleton className="h-4 w-6 rounded flex-shrink-0" />

      {/* Icon + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>

      {/* Price */}
      <Skeleton className="h-4 w-20 rounded hidden sm:block" />

      {/* 24h change */}
      <Skeleton className="h-6 w-16 rounded-full" />

      {/* Market cap */}
      <Skeleton className="h-4 w-20 rounded hidden md:block" />

      {/* Sparkline */}
      <Skeleton className="h-8 w-20 rounded hidden lg:block" />
    </div>
  );
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

export function ChartSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading chart…" aria-busy="true">
      <div className="flex gap-3">
        <div className="flex flex-col justify-between py-2 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-14 rounded" />
          ))}
        </div>
        <Skeleton className="flex-1 h-48 rounded-xl" />
      </div>
      <div className="flex justify-between pl-16">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8 rounded" />
        ))}
      </div>
    </div>
  );
}

// ─── Coin card skeleton (mobile) ─────────────────────────────────────────────

export function CoinCardSkeleton() {
  return (
    <div
      className="glass rounded-xl p-4 space-y-3"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
    </div>
  );
}
