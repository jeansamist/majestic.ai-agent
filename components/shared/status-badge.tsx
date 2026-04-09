import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  FOLLOW_UP: "Follow-up",
  CLOSED: "Closed",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("text-xs", className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <Badge variant="outline" className="text-xs capitalize">
      {source.toLowerCase().replace("_", " ")}
    </Badge>
  );
}

export function InterestBadge({ interest }: { interest: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      {interest}
    </Badge>
  );
}
