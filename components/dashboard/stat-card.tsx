"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
}

function Sparkline({ data, color = "#d4a82e" }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-2.5 h-7 w-full opacity-65"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  spark?: number[];
  color?: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  spark,
  color = "#d4a82e",
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl border border-gold/18 bg-white/4 p-5"
    >
      <div className="mb-2.5 text-[11px] font-medium uppercase tracking-[1.1px] text-white/50">
        {label}
      </div>
      <div className="text-[34px] font-bold leading-none text-white" style={{ fontFamily: "serif" }}>
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-semibold",
              delta >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {delta >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {sub && <span className="text-[11px] text-white/25">{sub}</span>}
      </div>
      {spark && <Sparkline data={spark} color={color} />}
    </motion.div>
  );
}
