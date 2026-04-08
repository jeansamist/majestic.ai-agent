"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard, Users, MessageSquare, BarChart3,
  UserCog, Settings, Shield, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const NAV_ITEMS = [
  { key: "overview",  label: "Dashboard",    href: "/dashboard/overview",  icon: LayoutDashboard },
  { key: "leads",     label: "Leads",        href: "/dashboard/leads",     icon: Users },
  { key: "chat",      label: "Chat History", href: "/dashboard/chat",      icon: MessageSquare },
  { key: "analytics", label: "Analytics",    href: "/dashboard/analytics", icon: BarChart3 },
  { key: "team",      label: "Team",         href: "/dashboard/team",      icon: UserCog },
  { key: "settings",  label: "Settings",     href: "/dashboard/settings",  icon: Settings },
];

interface SidebarNavProps {
  user: SessionUser;
  newLeadsCount?: number;
  agentName?: string;
  agentPhotoUrl?: string | null;
  open: boolean;
}

export function SidebarNav({
  user,
  newLeadsCount = 0,
  agentName = "Emma",
  agentPhotoUrl,
  open,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: open ? 220 : 0 }}
      transition={{ duration: 0.24, ease: "easeInOut" }}
      className="shrink-0 overflow-hidden border-r border-gold/18 bg-gradient-to-b from-[#0f1840] to-[#0c1228] flex flex-col sticky top-0 h-screen z-40"
    >
      <div className="flex w-[220px] flex-col h-full overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-gold/18 px-[18px] py-5 shrink-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c8900a] to-[#e8c040] text-lg shadow-[0_0_16px_rgba(212,168,46,0.3)]">
            🛡️
          </div>
          <div>
            <div className="font-bold text-gold-2 text-[15px] leading-tight">Majestic</div>
            <div className="text-[10px] tracking-[0.8px] text-white/25">Insurance Agency</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-l-[3px] px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "border-gold bg-gold/12 text-gold-2 font-semibold"
                    : "border-transparent text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
                {item.key === "leads" && newLeadsCount > 0 && (
                  <span className="ml-auto rounded-full bg-gold/18 px-2 py-0.5 text-[10px] font-bold text-gold-2">
                    {newLeadsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Active agent preview */}
        <div className="border-b border-gold/18 border-t px-4 py-3 shrink-0">
          <p className="mb-2 text-[10px] uppercase tracking-[0.8px] text-white/25">
            Active Agent
          </p>
          <div className="flex items-center gap-2.5">
            <div className="size-8 shrink-0 overflow-hidden rounded-full border-2 border-gold/30 bg-gold/10">
              {agentPhotoUrl ? (
                <Image src={agentPhotoUrl} alt={agentName} width={32} height={32} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-sm">🤖</div>
              )}
            </div>
            <div>
              <div className="text-[12px] font-medium text-white/90">{agentName}</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <div className="size-[5px] rounded-full bg-emerald-400" />
                Online
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-[17px] py-3 shrink-0">
          <div className="relative shrink-0">
            <div className="size-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 border-2 border-[#0c1228]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium text-white/90">{user.name}</div>
            <div className="text-[10px] text-emerald-400">
              {user.role.replace("_", " ")} · Online
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
