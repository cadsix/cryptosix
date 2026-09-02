"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

interface SparklineProps {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ data, positive, width = 80, height = 32 }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} />;
  }

  // Use every Nth point to keep the sparkline crisp at small sizes
  const stride = Math.max(1, Math.floor(data.length / 40));
  const points = data
    .filter((_, i) => i % stride === 0)
    .map((price, i) => ({ i, price }));

  const color = positive ? "#22c55e" : "#f43f5e";

  return (
    <div style={{ width, height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
            strokeOpacity={0.85}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const val = payload[0].value as number;
              return (
                <div
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #242424",
                    padding: "2px 6px",
                    fontSize: 11,
                    color: "#e8e8e8",
                    pointerEvents: "none",
                  }}
                >
                  ${val.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </div>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
