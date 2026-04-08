"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import type { ChatMessage } from "./message-list";
import { Suggestions } from "./suggestions";
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

interface ChatShellProps {
  config: ChatShellConfig;
}

export function ChatShell({ config }: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    config.conversationId
  );
  const [initialized, setInitialized] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation and show greeting
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

        // Show greeting as first assistant message
        if (config.greeting) {
          setMessages([{ role: "assistant", content: config.greeting }]);
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: "Hi! I'm Emma — welcome to Majestic Insurance! How can I help you today?",
        }]);
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

    // Simulate typing delay for realism
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

    try {
      const res = await axios.post("/api/public/agent/chat", {
        conversationId,
        message: trimmed,
      });

      const { content, showCalendly } = res.data as {
        content: string;
        showCalendly: boolean;
      };

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, showCalendly },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong on my end — please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [conversationId, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleBooked = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Your appointment with Lisa is confirmed! 🎉 She'll have all your details ready so there's no need to repeat yourself.",
      },
    ]);
  }, []);

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-[28px] border border-gold/22 bg-white/[0.025] shadow-[0_50px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl",
        config.isEmbed ? "w-full h-full rounded-none" : "w-full max-w-[840px]"
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
      <div className="flex items-end gap-3 border-t border-gold/10 px-6 py-4">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="majestic-scroll flex-1 resize-none rounded-[18px] border border-gold/20 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/90 placeholder-white/27 outline-none transition-colors focus:border-gold/50 min-h-[50px] max-h-[120px]"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="flex size-[50px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8900a] to-[#e0b830] text-[#06091a] shadow-[0_4px_18px_rgba(200,144,10,0.32)] transition-all hover:scale-105 hover:shadow-[0_6px_24px_rgba(200,144,10,0.5)] disabled:opacity-44 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
        >
          <SendHorizonal className="size-5" />
        </button>
      </div>
    </motion.div>
  );
}
