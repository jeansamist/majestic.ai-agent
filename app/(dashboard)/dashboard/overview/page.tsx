"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard/stat-card";
import { InterestBars } from "@/components/dashboard/interest-bars";
import { StatusBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
      >
        <Card size="sm">
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Good morning</p>
            <p className="text-2xl font-bold mb-1">Welcome back, Lisa</p>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your agent today.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Leads This Week" value={data?.leadsThisWeek ?? 0} delta={weekDelta} sub="vs last week" spark={[2, 3, 2, 4, 3, 5, 7]} index={0} />
        <StatCard label="Total Conversations" value={data?.totalConversations ?? 0} delta={12} index={1} />
        <StatCard label="Appointments Set" value={data?.appointmentsSet ?? 0} index={2} />
        <StatCard label="Closed Leads" value={data?.closedLeads ?? 0} delta={5} index={3} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
        <Card size="sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Top Insurance Types</CardTitle>
            <CardAction>
              <span className="text-xs text-muted-foreground">This week</span>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-4">
            <InterestBars data={data?.byInterest ?? {}} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>New Leads</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {newLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No new leads</p>
            ) : (
              <div className="flex flex-col">
                {newLeads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2.5 py-2.5 last:pb-0">
                    <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{lead.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lead.interest} · {lead.source.replace("_", " ").toLowerCase()}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(String(lead.createdAt))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads table */}
      <Card size="sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Recent Leads</CardTitle>
          <CardAction>
            <Badge variant="secondary">{data?.totalLeads ?? 0} total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.recentLeads ?? []).slice(0, 5).map((lead: LeadRow, i: number) => (
            <div key={lead.id}>
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr] items-center gap-3 px-6 py-3">
                <div className="flex items-center gap-2.5">
                  <LeadAvatar name={lead.name} interest={lead.interest} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{lead.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{lead.interest ?? "—"}</p>
                <StatusBadge status={lead.status} />
                <p className="text-xs text-muted-foreground">{timeAgo(String(lead.createdAt))}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {lead.source.toLowerCase().replace("_", " ")}
                </p>
              </div>
              {i < 4 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
