"use client";

import Image from "next/image";

interface ChatHeaderProps {
  agentName?: string;
  agentTitle?: string;
  agentPhotoUrl?: string | null;
  onLeadsClick?: () => void;
  leadsCount?: number;
}

export function ChatHeader({
  agentName = "Emma",
  agentTitle = "Majestic Insurance · Virtual Assistant",
  agentPhotoUrl,
  onLeadsClick,
  leadsCount = 0,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3.5 border-b border-gold/18 bg-gradient-to-r from-[#111836] to-[#0d1b3e] px-6 py-4">
      {/* Agent avatar */}
      <div className="size-[50px] shrink-0 rounded-full overflow-hidden border-2 border-gold/45 shadow-[0_0_20px_rgba(200,144,10,0.35)]">
        {agentPhotoUrl ? (
          <Image
            src={agentPhotoUrl}
            alt={agentName}
            width={50}
            height={50}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-[#c8900a] to-[#e8c040] flex items-center justify-center text-[#06091a] font-bold text-xl">
            🛡️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-gold-2 text-base leading-tight truncate">
          {agentName} · Majestic Insurance
        </h2>
        <p className="text-xs text-white/42 mt-0.5 truncate">
          <span className="inline-block size-[7px] rounded-full bg-emerald-400 shadow-[0_0_7px_#4ade80] animate-blink align-middle mr-1.5" />
          Online &nbsp;·&nbsp; {agentTitle}
        </p>
      </div>

      {/* Leads button (shown only to agents/admins via prop) */}
      {onLeadsClick !== undefined && (
        <div className="relative shrink-0">
          <button
            onClick={onLeadsClick}
            className="relative rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gold transition-all hover:bg-gold/22 cursor-pointer"
          >
            Leads
            {leadsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {leadsCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
