"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft, Bell, LogOut } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import type { SessionUser } from "@/types";

interface TopbarProps {
  user: SessionUser;
  agentName?: string;
  agentPhotoUrl?: string | null;
  onToggleSidebar: () => void;
}

const NOTIFS = [
  { text: "New lead captured via website", time: "8m ago", dot: "#d4a82e" },
  { text: "Marcus Bell started a chat", time: "22m ago", dot: "#3b82f6" },
  { text: "Sandra Mensah filed a claim", time: "2h ago", dot: "#ef4444" },
];

export function Topbar({ user, agentName = "Emma", agentPhotoUrl, onToggleSidebar }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[58px] shrink-0 items-center gap-3 border-b border-gold/10 bg-[rgba(10,16,48,0.9)] px-6 backdrop-blur-2xl">
      <button
        onClick={onToggleSidebar}
        className="text-white/50 transition-colors hover:text-white/80 cursor-pointer"
      >
        <PanelLeft className="size-5" />
      </button>

      {/* Agent pill */}
      <div className="flex items-center gap-2 rounded-full border border-gold/15 bg-gold/6 px-3 py-1">
        <div className="size-[22px] overflow-hidden rounded-full border border-white/10 bg-gold/15 flex items-center justify-center shrink-0">
          {agentPhotoUrl ? (
            <Image src={agentPhotoUrl} alt={agentName} width={22} height={22} className="size-full object-cover" />
          ) : (
            <span className="text-[11px]">🤖</span>
          )}
        </div>
        <div className="size-[5px] rounded-full bg-emerald-400 shadow-[0_0_5px_#4ade80]" />
        <span className="text-[11px] font-semibold text-gold/50">{agentName}</span>
        <span className="text-[11px] text-white/25">· active</span>
      </div>

      <div className="flex-1 text-[12px] text-white/25">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative flex size-[34px] items-center justify-center rounded-xl border border-gold/18 bg-white/4 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500" />
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 w-[280px] overflow-hidden rounded-2xl border border-gold/18 bg-[#111836] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between border-b border-gold/10 px-4 py-3">
                <span className="font-bold text-white text-[15px]">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="text-white/40 hover:text-white cursor-pointer text-lg leading-none">×</button>
              </div>
              {NOTIFS.map((n, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 border-b border-gold/8 px-4 py-3 last:border-0"
                >
                  <div
                    className="mt-1.5 size-[7px] shrink-0 rounded-full"
                    style={{ background: n.dot }}
                  />
                  <div>
                    <div className="text-[12px] text-white/80 leading-snug">{n.text}</div>
                    <div className="mt-0.5 text-[10px] text-white/30">{n.time}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        <LogOut className="size-3.5" />
        Logout
      </button>
    </header>
  );
}
