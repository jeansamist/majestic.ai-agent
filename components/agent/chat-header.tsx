"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
  agentName?: string;
  agentTitle?: string;
  agentPhotoUrl?: string | null;
  onLeadsClick?: () => void;
  leadsCount?: number;
}

export function ChatHeader({
  agentName = "Emma",
  agentTitle = "Virtual Assistant",
  agentPhotoUrl,
  onLeadsClick,
  leadsCount = 0,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3.5 border-b bg-card px-6 py-4">
      <Avatar className="size-12 border-2 border-primary/30">
        <AvatarImage src={agentPhotoUrl ?? undefined} alt={agentName} />
        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
          {agentName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm leading-tight truncate">{agentName}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-green-500 inline-block" />
          Online · {agentTitle}
        </p>
      </div>

      {onLeadsClick !== undefined && (
        <Button variant="outline" size="sm" onClick={onLeadsClick} className="relative gap-1.5 shrink-0">
          Leads
          {leadsCount > 0 && (
            <Badge className="size-4 p-0 flex items-center justify-center text-[10px] absolute -top-1.5 -right-1.5">
              {leadsCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}
