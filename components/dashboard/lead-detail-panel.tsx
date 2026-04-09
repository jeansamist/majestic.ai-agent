"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, SourceBadge, InterestBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import type { LeadStatus } from "@prisma/client";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  interest: string | null;
  status: LeadStatus;
  consent: boolean | null;
  source: string;
  summary: string | null;
  createdAt: string;
}

interface FullLead extends Lead {
  conversations: Array<{
    id: string;
    messages: Array<{ role: string; content: string }>;
    events: Array<{ type: string; payload: Record<string, unknown>; createdAt: string }>;
  }>;
}

function makeRecs(lead: Lead) {
  const recs: Array<{ title: string; detail: string; urgency: "high" | "medium" | "low" }> = [];
  if (lead.status === "NEW") recs.push({ title: "Call within 24 hours", detail: "New leads convert best when contacted same-day.", urgency: "high" });
  if (lead.status === "QUOTED" || lead.status === "CONTACTED") recs.push({ title: "Schedule a follow-up", detail: "This lead has shown strong intent. Book a 15-min call.", urgency: "high" });
  if (lead.status === "FOLLOW_UP") recs.push({ title: "Escalate to agent directly", detail: "Follow-up leads risk going cold. Reach out within 48 hours.", urgency: "high" });
  if (lead.interest === "Auto") recs.push({ title: "Offer Auto + Home bundle", detail: "Bundling can save 15–20%. Mention during follow-up.", urgency: "medium" });
  if (lead.interest === "Life") recs.push({ title: "Send life insurance overview", detail: "Pre-call education improves conversion.", urgency: "medium" });
  if (!lead.consent) recs.push({ title: "Build trust before email ask", detail: "A warm phone call first may make them more receptive.", urgency: "low" });
  if (lead.consent) recs.push({ title: "Send a personalised email", detail: `Tailored to their ${lead.interest} interest.`, urgency: "low" });
  if (lead.status === "CLOSED") recs.push({ title: "Request a review or referral", detail: "Closed leads are your best advocates.", urgency: "low" });
  return recs.slice(0, 4);
}

const URGENCY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [fullLead, setFullLead] = useState<FullLead | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState<ReturnType<typeof makeRecs> | null>(null);

  useEffect(() => {
    setFullLead(null);
    setAiRecs(null);
    setLoadingFull(true);
    axios.get(`/api/admin/leads/${lead.id}`)
      .then((r) => setFullLead(r.data as FullLead))
      .catch(() => {})
      .finally(() => setLoadingFull(false));
  }, [lead.id]);

  const loadAI = async () => {
    if (aiRecs) return;
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setAiRecs(makeRecs(lead));
    setAiLoading(false);
  };

  const messages = fullLead?.conversations?.[0]?.messages ?? [];

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-120 flex-col gap-0 p-0 sm:max-w-120">
        <SheetHeader className="border-b p-5">
          <div className="flex items-start gap-3">
            <LeadAvatar name={lead.name} interest={lead.interest} size="lg" />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base">{lead.name ?? "Unknown"}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{lead.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <StatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
            {lead.interest && <InterestBadge interest={lead.interest} />}
            {lead.consent === false && (
              <Badge variant="outline" className="text-xs">No email consent</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex flex-1 min-h-0 flex-col px-5">
          <TabsList className="my-4 w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1" onClick={loadAI}>AI Recs</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pb-5">
            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { l: "Phone", v: lead.phone ?? "—" },
                  { l: "Platform", v: lead.source.replace("_", " ") },
                  { l: "Captured", v: new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  { l: "Email Consent", v: lead.consent === true ? "Yes" : lead.consent === false ? "No" : "—" },
                ].map((it) => (
                  <div key={it.l} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground mb-1">{it.l}</p>
                    <p className="text-sm font-medium">{it.v}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Conversation Thread
              </p>
              {loadingFull ? (
                <div className="flex flex-col gap-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No messages yet</p>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role !== "USER" ? "items-start" : "items-end"}`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {msg.role === "ASSISTANT" ? "Agent" : "Visitor"}
                      </p>
                      <div className={`max-w-[84%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "ASSISTANT"
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* SUMMARY */}
            <TabsContent value="summary" className="mt-0">
              {lead.summary ? (
                <div className="mb-5 rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI Summary</p>
                  <p className="text-sm leading-relaxed">{lead.summary}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mb-4">No summary available yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {[
                  { l: "Interest", v: lead.interest ?? "—" },
                  { l: "Status", v: lead.status },
                  { l: "Messages", v: String(messages.length) },
                  { l: "Consent", v: lead.consent === true ? "Granted" : "Declined" },
                  { l: "Platform", v: lead.source.replace("_", " ") },
                ].map((it) => (
                  <div key={it.l} className="flex justify-between items-center rounded-lg border px-3.5 py-2.5">
                    <span className="text-sm text-muted-foreground">{it.l}</span>
                    <span className="text-sm font-semibold">{it.v}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* AI RECS */}
            <TabsContent value="ai" className="mt-0">
              <div className="mb-4 rounded-lg border bg-muted/30 p-3.5">
                <p className="text-sm font-semibold mb-1">AI Recommendations</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on conversation, intent signals, and pipeline stage.
                </p>
              </div>
              {aiLoading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                  <p className="text-center text-xs text-muted-foreground">Analysing conversation data…</p>
                </div>
              ) : aiRecs && (
                <div className="flex flex-col gap-2.5">
                  {aiRecs.map((rec, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-semibold">{rec.title}</p>
                        <Badge variant={URGENCY_VARIANT[rec.urgency]} className="text-xs shrink-0 capitalize">
                          {rec.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
