"use client";

import { Progress } from "@/components/ui/progress";

interface InterestBarsProps {
  data: Record<string, number>;
}

export function InterestBars({ data }: InterestBarsProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No data yet</p>;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {entries.map(([type, count]) => {
        const pct = Math.round((count / max) * 100);
        return (
          <div key={type}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-foreground">{type}</span>
              <span className="font-semibold tabular-nums text-primary">{count}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
