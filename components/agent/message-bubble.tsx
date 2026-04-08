"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageBubbleProps {
  message: Message;
  agentPhotoUrl?: string | null;
  agentName?: string;
}

export function MessageBubble({ message, agentPhotoUrl, agentName = "Emma" }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className={cn(
        "size-9 shrink-0 rounded-full flex items-center justify-center overflow-hidden",
        isUser
          ? "bg-white/8 border border-white/15 text-sm"
          : "border-2 border-gold/40 shadow-[0_0_10px_rgba(212,168,46,0.25)]"
      )}>
        {isUser ? (
          <span>👤</span>
        ) : agentPhotoUrl ? (
          <Image
            src={agentPhotoUrl}
            alt={agentName}
            width={36}
            height={36}
            className="size-full object-cover"
            onError={() => {}}
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-[#c8900a] to-[#e8c040] flex items-center justify-center text-[#06091a] font-bold text-sm">
            {agentName[0]}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1 max-w-[72%]">
        <div className="text-[10px] uppercase tracking-[0.6px] text-white/30 font-medium px-1">
          {isUser ? "You" : agentName}
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-gradient-to-br from-[#c8900a] to-[#d4a820] text-[#06091a] font-semibold rounded-br-[5px]"
              : "bg-white/5 border border-gold/14 text-white/88 rounded-bl-[5px]"
          )}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
