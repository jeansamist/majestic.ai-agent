"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import type { ChatMessage } from "./message-list";
import { Suggestions } from "./suggestions";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatShellConfig {
  agentName?: string;
  agentTitle?: string;
  agentPhotoUrl?: string | null;
  greeting?: string;
  calendlyUrl?: string | null;
  conversationId?: string;
  agentPublicKey?: string;
  isEmbed?: boolean;
}

export function ChatShell({ config }: { config: ChatShellConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(config.conversationId);
  const [initialized, setInitialized] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    const init = async () => {
      try {
        let convId = config.conversationId;
        if (!convId) {
          const res = await axios.post("/api/public/agent/conversations", {
            agentPublicKey: config.agentPublicKey,
          });
          convId = res.data.conversationId as string;
          setConversationId(convId);
        }
        if (config.greeting) {
          setMessages([{ role: "assistant", content: config.greeting }]);
        }
      } catch {
        setMessages([{ role: "assistant", content: "Hi! I'm here to help. How can I assist you today?" }]);
      }
    };
    init();
  }, [config, initialized]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    try {
      const res = await axios.post("/api/public/agent/chat", { conversationId, message: trimmed });
      const { content, showCalendly } = res.data as { content: string; showCalendly: boolean };
      setMessages((prev) => [...prev, { role: "assistant", content, showCalendly }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong — please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [conversationId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleBooked = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Your appointment is confirmed! We'll have all your details ready." },
    ]);
  }, []);

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl",
        config.isEmbed ? "w-full h-full rounded-none" : "w-full max-w-3xl"
      )}
    >
      <ChatHeader
        agentName={config.agentName}
        agentTitle={config.agentTitle}
        agentPhotoUrl={config.agentPhotoUrl}
      />

      <MessageList
        messages={messages}
        loading={loading}
        agentPhotoUrl={config.agentPhotoUrl}
        agentName={config.agentName}
        calendlyUrl={config.calendlyUrl}
        onBooked={handleBooked}
      />

      <AnimatePresence>
        {showSuggestions && (
          <Suggestions onSelect={(s) => { setInput(s); inputRef.current?.focus(); }} />
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-3 border-t px-4 py-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring min-h-11 max-h-28"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          size="icon"
          className="shrink-0"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
