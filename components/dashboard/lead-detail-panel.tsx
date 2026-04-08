"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import axios from "axios";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  const recs: Array<{ icon: string; title: string; detail: string; urgency: "high" | "medium" | "low" }> = [];
  if (lead.status === "NEW") recs.push({ icon: "📞", title: "Call within 24 hours", detail: "New leads convert best when contacted same-day.", urgency: "high" });
  if (lead.status === "QUOTED" || lead.status === "CONTACTED") recs.push({ icon: "📅", title: "Schedule a follow-up", detail: "This lead has shown strong intent. Book a 15-min call.", urgency: "high" });
  if (lead.status === "FOLLOW_UP") recs.push({ icon: "⚡", title: "Escalate to Lisa directly", detail: "Follow-up leads risk going cold. Reach out within 48 hours.", urgency: "high" });
  if (lead.interest === "Auto") recs.push({ icon: "🏠", title: "Offer Auto + Home bundle", detail: "Bundling can save 15–20%. Mention during follow-up.", urgency: "medium" });
  if (lead.interest === "Life") recs.push({ icon: "📧", title: "Send life insurance overview", detail: "Pre-call education improves conversion. Send a one-pager.", urgency: "medium" });
  if (!lead.consent) recs.push({ icon: "🤝", title: "Build trust before email ask", detail: "A warm phone call first may make them more receptive.", urgency: "low" });
  if (lead.consent) recs.push({ icon: "✉️", title: "Send a personalised email", detail: `Tailored email referencing their ${lead.interest} interest.`, urgency: "low" });
  if (lead.status === "CLOSED") recs.push({ icon: "⭐", title: "Request a review or referral", detail: "Closed leads are your best advocates.", urgency: "low" });
  return recs.slice(0, 4);
}

const URGENCY_STYLE = {
  high: "bg-red-500/10 text-red-400 border-red-500/25",
  medium: "bg-amber-400/10 text-amber-400 border-amber-400/25",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
};

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  agentPhotoUrl?: string | null;
}

export function LeadDetailPanel({ lead, onClose, agentPhotoUrl }: LeadDetailPanelProps) {
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
    <AnimatePresence>
      <motion.div
        key="panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 flex w-[460px] flex-col border-l border-gold/18 bg-gradient-to-b from-[#111836] to-[#0c1228] shadow-[-24px_0_60px_rgba(0,0,0,0.55)]"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gold/18 p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <LeadAvatar name={lead.name} interest={lead.interest} size="lg" />
              <div>
                <div className="font-bold text-white text-[17px]">{lead.name ?? "Unknown"}</div>
                <div className="text-[12px] text-white/50 mt-0.5">{lead.email}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
            {lead.interest && <InterestBadge interest={lead.interest} />}
            {lead.consent === false && (
              <span className="inline-flex rounded-full border border-white/10 bg-white/3 px-2 py-0.5 text-[11px] text-white/25">
                No email consent
              </span>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="w-full bg-white/4 rounded-xl p-1">
              <TabsTrigger value="overview" className="flex-1 rounded-lg text-xs">Overview</TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 rounded-lg text-xs">Summary</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 rounded-lg text-xs" onClick={loadAI}>✦ AI Recs</TabsTrigger>
            </TabsList>

            {/* Scrollable body */}
            <div className="majestic-scroll mt-4 max-h-[calc(100vh-200px)] overflow-y-auto">

              {/* OVERVIEW */}
              <TabsContent value="overview">
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {[
                    { l: "Phone", v: lead.phone ?? "—" },
                    { l: "Platform", v: lead.source.replace("_", " ") },
                    { l: "Captured", v: new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { l: "Email Consent", v: lead.consent === true ? "✓ Yes" : lead.consent === false ? "✗ No" : "—" },
                  ].map((it, i) => (
                    <div key={i} className="rounded-xl border border-gold/12 bg-white/3 px-3 py-2.5">
                      <div className="text-[10px] uppercase tracking-[0.8px] text-white/30 mb-1">{it.l}</div>
                      <div className="text-[13px] font-medium text-white/85">{it.v}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-[1px] text-white/25 mb-2.5">
                  Conversation Thread
                </div>
                {loadingFull ? (
                  <div className="flex flex-col gap-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 bg-white/4" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-white/30 italic">No messages yet</p>
                ) : (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-gold/12 bg-black/20 p-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role !== "USER" ? "items-start" : "items-end"}`}>
                        <div className="text-[9px] uppercase tracking-[0.6px] text-white/25 mb-1">
                          {msg.role === "ASSISTANT" ? "Emma" : "Visitor"}
                        </div>
                        <div className={`max-w-[84%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                          msg.role === "ASSISTANT"
                            ? "bg-white/5 border border-gold/12 text-white/85 rounded-tl-[4px]"
                            : "bg-gold/9 border border-gold/22 text-white/85 rounded-tr-[4px]"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* SUMMARY */}
              <TabsContent value="summary">
                {lead.summary ? (
                  <div className="mb-5 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/7 to-gold/2 p-4">
                    <div className="text-[10px] uppercase tracking-[1.2px] text-gold/50 mb-2">✦ AI-Generated Summary</div>
                    <p className="text-[13px] leading-relaxed text-white/85">{lead.summary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-white/30 italic mb-4">No summary available yet.</p>
                )}
                <div className="flex flex-col gap-2">
                  {[
                    { l: "Interest", v: lead.interest ?? "—" },
                    { l: "Status", v: lead.status },
                    { l: "Messages", v: String(messages.length) },
                    { l: "Consent", v: lead.consent === true ? "Granted" : "Declined" },
                    { l: "Platform", v: lead.source.replace("_", " ") },
                  ].map((it, i) => (
                    <div key={i} className="flex justify-between items-center rounded-xl border border-gold/10 bg-white/3 px-3.5 py-2.5">
                      <span className="text-[12px] text-white/50">{it.l}</span>
                      <span className="text-[12px] font-semibold text-white/85">{it.v}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* AI RECS */}
              <TabsContent value="ai">
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-purple-500/25 bg-purple-500/8 p-3.5">
                  <span className="text-xl shrink-0">✦</span>
                  <div>
                    <div className="text-[12px] font-bold text-purple-400 mb-1">
                      AI Recommendations for {lead.name ?? "this lead"}
                    </div>
                    <div className="text-[12px] text-white/50 leading-relaxed">
                      Based on conversation, intent signals, consent status, and pipeline stage.
                    </div>
                  </div>
                </div>

                {aiLoading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="relative h-[88px] overflow-hidden rounded-xl border border-gold/12 bg-white/3">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent animate-shimmer" />
                      </div>
                    ))}
                    <p className="text-center text-[12px] text-white/40 mt-1">Analysing conversation data…</p>
                  </div>
                ) : aiRecs && (
                  <div className="flex flex-col gap-2.5">
                    {aiRecs.map((rec, i) => (
                      <div key={i} className="rounded-xl border border-gold/12 bg-white/3 p-4">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl shrink-0">{rec.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="text-[13px] font-semibold text-white">{rec.title}</div>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${URGENCY_STYLE[rec.urgency]}`}>
                                {rec.urgency}
                              </span>
                            </div>
                            <p className="text-[12px] leading-relaxed text-white/50">{rec.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
