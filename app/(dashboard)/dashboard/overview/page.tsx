"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard/stat-card";
import { InterestBars } from "@/components/dashboard/interest-bars";
import { StatusBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary, LeadRow } from "@/types";

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function OverviewPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/dashboard/summary")
      .then((r) => setData(r.data as DashboardSummary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[90px] rounded-2xl bg-white/4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[130px] rounded-2xl bg-white/4" />)}
        </div>
      </div>
    );
  }

  const weekDelta = data && data.leadsLastWeek > 0
    ? Math.round(((data.leadsThisWeek - data.leadsLastWeek) / data.leadsLastWeek) * 100)
    : 0;

  const newLeads = data?.recentLeads.filter((l) => l.status === "NEW") ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-gold/18 bg-gradient-to-r from-gold/8 to-gold/2 p-6"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[90px] opacity-5">🛡️</div>
        <div className="text-[11px] uppercase tracking-[1.2px] text-gold/50 mb-1.5">Good morning</div>
        <div className="text-[26px] font-bold text-white mb-1">Welcome back, Lisa 👋</div>
        <div className="text-[13px] text-white/50">
          Here&apos;s what&apos;s happening with your Majestic Insurance agent today.
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Leads This Week" value={data?.leadsThisWeek ?? 0} delta={weekDelta} sub="vs last week" spark={[2, 3, 2, 4, 3, 5, 7]} index={0} />
        <StatCard label="Total Conversations" value={data?.totalConversations ?? 0} delta={12} index={1} color="#3b82f6" />
        <StatCard label="Appointments Set" value={data?.appointmentsSet ?? 0} color="#a78bfa" index={2} />
        <StatCard label="Closed Leads" value={data?.closedLeads ?? 0} delta={5} color="#10b981" index={3} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-3">
        <div className="rounded-2xl border border-gold/18 bg-white/4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-white text-[17px]">Top Insurance Types</h3>
            <span className="text-[11px] text-white/25">This week</span>
          </div>
          <InterestBars data={data?.byInterest ?? {}} />
        </div>

        <div className="rounded-2xl border border-gold/18 bg-white/4 p-5">
          <h3 className="font-bold text-white text-[17px] mb-4">New Leads</h3>
          {newLeads.length === 0 ? (
            <p className="text-sm text-white/30 italic">No new leads</p>
          ) : (
            <div className="flex flex-col">
              {newLeads.slice(0, 4).map((lead, i) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-2.5 border-b border-gold/8 py-2.5 last:border-0"
                >
                  <div className="size-[7px] shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-medium text-white/90">{lead.name ?? "Unknown"}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{lead.interest} · {lead.source.replace("_", " ").toLowerCase()}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-white/25">{timeAgo(String(lead.createdAt))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent leads table */}
      <div className="overflow-hidden rounded-2xl border border-gold/18 bg-white/4">
        <div className="flex items-center justify-between border-b border-gold/12 px-5 py-4">
          <h3 className="font-bold text-white text-[17px]">Recent Leads</h3>
          <span className="inline-flex rounded-full border border-gold/25 bg-gold/12 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
            {data?.totalLeads ?? 0} total
          </span>
        </div>
        {(data?.recentLeads ?? []).slice(0, 5).map((lead: LeadRow, i: number) => (
          <div
            key={lead.id}
            className="grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr] items-center gap-3 border-b border-gold/8 px-5 py-3.5 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <LeadAvatar name={lead.name} interest={lead.interest} size="sm" />
              <div>
                <div className="text-[13px] font-medium text-white/90">{lead.name ?? "—"}</div>
                <div className="text-[11px] text-white/40">{lead.email}</div>
              </div>
            </div>
            <div className="text-[12px] text-white/70">{lead.interest ?? "—"}</div>
            <StatusBadge status={lead.status} />
            <div className="text-[11px] text-white/30">{timeAgo(String(lead.createdAt))}</div>
            <div className="text-[11px] text-white/30 capitalize">
              {lead.source.toLowerCase().replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
