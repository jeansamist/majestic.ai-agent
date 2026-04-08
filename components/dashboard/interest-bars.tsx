"use client";

const INTEREST_COLORS: Record<string, string> = {
  Auto: "#3b82f6",
  Home: "#d4a82e",
  Life: "#ec4899",
  Boat: "#10b981",
  Renters: "#a78bfa",
  Business: "#f59e0b",
};

interface InterestBarsProps {
  data: Record<string, number>;
}

export function InterestBars({ data }: InterestBarsProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;

  if (entries.length === 0) {
    return <p className="text-sm text-white/30 italic">No data yet</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([type, count]) => {
        const color = INTEREST_COLORS[type] ?? "#d4a82e";
        const pct = Math.round((count / max) * 100);
        return (
          <div key={type}>
            <div className="mb-1.5 flex justify-between">
              <span className="text-[12px] text-white/90">{type}</span>
              <span className="text-[12px] font-semibold" style={{ color }}>
                {count}
              </span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
