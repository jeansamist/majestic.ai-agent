import { cn } from "@/lib/utils";

const INTEREST_COLORS: Record<string, string> = {
  Auto: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  Home: "bg-gold/20 text-gold border-gold/40",
  Life: "bg-pink-500/20 text-pink-400 border-pink-500/40",
  Boat: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Renters: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  Business: "bg-amber-500/20 text-amber-400 border-amber-500/40",
};

export function LeadAvatar({
  name,
  interest,
  size = "md",
  className,
}: {
  name: string | null;
  interest?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const colorCls =
    (interest && INTEREST_COLORS[interest]) ??
    "bg-gold/20 text-gold border-gold/40";

  const sizeCls = {
    sm: "size-8 text-xs",
    md: "size-9 text-sm",
    lg: "size-11 text-base",
  }[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-bold",
        colorCls,
        sizeCls,
        className
      )}
    >
      {initials}
    </div>
  );
}
