import { cn } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  NEW: {
    label: "New",
    className: "bg-gold/12 text-gold border border-gold/30",
  },
  CONTACTED: {
    label: "Contacted",
    className: "bg-blue-500/12 text-blue-400 border border-blue-500/30",
  },
  QUOTED: {
    label: "Quoted",
    className: "bg-purple-500/12 text-purple-400 border border-purple-500/30",
  },
  FOLLOW_UP: {
    label: "Follow-up",
    className: "bg-amber-400/12 text-amber-400 border border-amber-400/30",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/30",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-white/50 whitespace-nowrap capitalize">
      {source.toLowerCase().replace("_", " ")}
    </span>
  );
}

export function InterestBadge({ interest }: { interest: string }) {
  const colors: Record<string, string> = {
    Auto: "bg-blue-500/15 text-blue-400 border-blue-500/35",
    Home: "bg-gold/12 text-gold border-gold/30",
    Life: "bg-pink-500/15 text-pink-400 border-pink-500/35",
    Boat: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
    Renters: "bg-purple-500/15 text-purple-400 border-purple-500/35",
    Business: "bg-amber-500/15 text-amber-400 border-amber-500/35",
  };
  const cls = colors[interest] ?? "bg-gold/12 text-gold border-gold/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        cls
      )}
    >
      {interest}
    </span>
  );
}
