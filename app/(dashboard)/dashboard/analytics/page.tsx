"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { StatCard } from "@/components/dashboard/stat-card";
import { InterestBars } from "@/components/dashboard/interest-bars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUOTED: "Quoted", FOLLOW_UP: "Follow-up", CLOSED: "Closed",
};

const MOST_ASKED = [
  { q: "What types of insurance do you offer?", n: 24 },
  { q: "How do I get a quote?", n: 18 },
  { q: "How to file a claim?", n: 12 },
  { q: "Speak with an agent?", n: 9 },
];

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
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  const sourceEntries = Object.entries(data?.bySource ?? {});
  const totalLeads = data?.totalLeads ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your agent&apos;s performance over time</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Leads" value={data?.totalLeads ?? 0} delta={18} spark={[2, 3, 2, 4, 3, 5, 7]} index={0} />
        <StatCard label="Conversion Rate" value={`${data?.conversionRate ?? 0}%`} delta={5} index={1} />
        <StatCard label="Email Consent" value={`${data?.consentRate ?? 0}%`} index={2} />
        <StatCard label="Avg Chat Length" value={`${data?.avgMessagesPerConversation ?? 0} msgs`} index={3} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <Card size="sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Insurance Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InterestBars data={data?.byInterest ?? {}} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Platform Split</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-5">
            <div className="flex flex-col gap-3.5">
              {sourceEntries.map(([source, count]) => {
                const pct = Math.round((count / totalLeads) * 100);
                return (
                  <div key={source}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="capitalize">{source.toLowerCase().replace("_", " ")}</span>
                      <span className="font-semibold tabular-nums text-primary">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Most Asked</p>
              <div className="flex flex-col">
                {MOST_ASKED.map((item, i) => (
                  <div key={item.q}>
                    {i > 0 && <Separator className="my-1.5" />}
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-muted-foreground">{item.q}</span>
                      <span className="text-sm font-semibold tabular-nums shrink-0 ml-3">{item.n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline status */}
      <Card size="sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = data?.byStatus[status] ?? 0;
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={status} className="rounded-xl border bg-card p-4">
                  <p className="text-3xl font-bold tabular-nums">{count}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">{label}</Badge>
                  <Progress value={pct} className="mt-3 h-1" />
                  <p className="mt-1 text-xs text-muted-foreground">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
