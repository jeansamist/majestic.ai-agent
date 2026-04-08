"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { CalendlyCard } from "./calendly-card";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  showCalendly?: boolean;
}

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  agentPhotoUrl?: string | null;
  agentName?: string;
  calendlyUrl?: string | null;
  onBooked?: (payload: unknown) => void;
}

export function MessageList({
  messages,
  loading,
  agentPhotoUrl,
  agentName,
  calendlyUrl,
  onBooked,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="majestic-scroll flex flex-col gap-4 overflow-y-auto px-6 py-6 h-[500px]">
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <div key={i}>
            <MessageBubble
              message={msg}
              agentPhotoUrl={agentPhotoUrl}
              agentName={agentName}
            />
            {msg.role === "assistant" && msg.showCalendly && calendlyUrl && (
              <div className="mt-3 pl-[46px]">
                <CalendlyCard
                  calendlyUrl={calendlyUrl}
                  agentPhotoUrl={agentPhotoUrl}
                  onBooked={onBooked}
                />
              </div>
            )}
          </div>
        ))}
      </AnimatePresence>

      {loading && (
        <div className="flex gap-2.5">
          <div className="size-9 shrink-0 rounded-full overflow-hidden border-2 border-gold/40 shadow-[0_0_10px_rgba(212,168,46,0.25)]">
            {agentPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agentPhotoUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gradient-to-br from-[#c8900a] to-[#e8c040]" />
            )}
          </div>
          <div className="rounded-2xl bg-white/5 border border-gold/14 rounded-bl-[5px]">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
