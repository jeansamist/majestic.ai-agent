"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <Avatar className="size-8 shrink-0">
        {!isUser && <AvatarImage src={agentPhotoUrl ?? undefined} alt={agentName} />}
        <AvatarFallback className={cn("text-xs font-semibold", isUser ? "bg-muted" : "bg-primary text-primary-foreground")}>
          {isUser ? "You" : agentName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1 max-w-[72%]">
        <p className="text-[10px] font-medium text-muted-foreground px-1">
          {isUser ? "You" : agentName}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
