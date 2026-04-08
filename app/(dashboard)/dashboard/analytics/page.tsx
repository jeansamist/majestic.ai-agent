"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { StatCard } from "@/components/dashboard/stat-card";
import { InterestBars } from "@/components/dashboard/interest-bars";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  totalLeads: number;
  totalConversations: number;
  conversionRate: number;
  consentRate: number;
  avgMessagesPerConversation: number;
  byStatus: Record<string, number>;
  byInterest: Record<string, number>;
  bySource: Record<string, number>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NEW:         { bg: "bg-gold/12",      text: "text-gold",      border: "border-gold/30" },
  CONTACTED:   { bg: "bg-blue-500/12",  text: "text-blue-400",  border: "border-blue-500/30" },
  QUOTED:      { bg: "bg-purple-500/12",text: "text-purple-400",border: "border-purple-500/30" },
  FOLLOW_UP:   { bg: "bg-amber-400/12", text: "text-amber-400", border: "border-amber-400/30" },
  CLOSED:      { bg: "bg-emerald-500/12",text: "text-emerald-400",border: "border-emerald-500/30" },
};
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUOTED: "Quoted",
  FOLLOW_UP: "Follow-up", CLOSED: "Closed",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/analytics")
      .then((r) => setData(r.data as AnalyticsData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[130px] rounded-2xl bg-white/4" />)}
        </div>
      </div>
    );
  }

  const sourceEntries = Object.entries(data?.bySource ?? {});
  const totalLeads = data?.totalLeads ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-[13px] text-white/45">Track your agent&apos;s performance over time</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Leads" value={data?.totalLeads ?? 0} delta={18} spark={[2, 3, 2, 4, 3, 5, 7]} index={0} />
        <StatCard label="Conversion Rate" value={`${data?.conversionRate ?? 0}%`} delta={5} color="#10b981" index={1} />
        <StatCard label="Email Consent" value={`${data?.consentRate ?? 0}%`} color="#3b82f6" index={2} />
        <StatCard label="Avg Chat Length" value={`${data?.avgMessagesPerConversation ?? 0} msgs`} color="#a78bfa" index={3} />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <div className="rounded-2xl border border-gold/18 bg-white/4 p-5">
          <h3 className="mb-5 font-bold text-white text-[17px]">Insurance Type Breakdown</h3>
          <InterestBars data={data?.byInterest ?? {}} />
        </div>

        <div className="rounded-2xl border border-gold/18 bg-white/4 p-5">
          <h3 className="mb-5 font-bold text-white text-[17px]">Platform Split</h3>
          {sourceEntries.map(([source, count], i) => (
            <div key={source} className="mb-5">
              <div className="mb-2 flex justify-between">
                <span className="text-[13px] capitalize text-white/80">
                  {source.toLowerCase().replace("_", " ")}
                </span>
                <span className="text-[13px] font-semibold text-gold">
                  {Math.round((count / totalLeads) * 100)}%
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-white/6">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((count / totalLeads) * 100)}%`,
                    background: i === 0 ? "#d4a82e" : "#3b82f6",
                  }}
                />
              </div>
            </div>
          ))}

          <div className="my-4 border-t border-gold/10" />
          <div className="text-[10px] uppercase tracking-[1px] text-white/25 mb-3">Most Asked</div>
          {["What types do you offer?", "How do I get a quote?", "How to file a claim?", "Speak with Lisa?"].map(
            (q, i) => (
              <div key={q} className="flex justify-between border-b border-gold/8 py-1.5 last:border-0">
                <span className="text-[12px] text-white/50">{q}</span>
                <span className="text-[12px] font-semibold text-gold">{[24, 18, 12, 9][i]}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Pipeline status */}
      <div className="rounded-2xl border border-gold/18 bg-white/4 p-5">
        <h3 className="mb-4 font-bold text-white text-[17px]">Pipeline Status</h3>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(STATUS_COLORS).map(([status, style]) => {
            const count = data?.byStatus[status] ?? 0;
            return (
              <div
                key={status}
                className={`rounded-2xl border ${style.border} ${style.bg} p-4 text-center`}
              >
                <div className={`text-[28px] font-bold ${style.text}`} style={{ fontFamily: "serif" }}>
                  {count}
                </div>
                <div className="mt-1 text-[11px] text-white/40">{STATUS_LABELS[status]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
