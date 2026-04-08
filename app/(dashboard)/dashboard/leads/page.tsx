"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Download, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadStatus } from "@prisma/client";
import type { LeadRow } from "@/types";

function timeAgo(d: string | Date) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

const STATUSES = ["All", "NEW", "CONTACTED", "QUOTED", "FOLLOW_UP", "CLOSED"] as const;
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUOTED: "Quoted",
  FOLLOW_UP: "Follow-up", CLOSED: "Closed",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterInterest, setFilterInterest] = useState("All");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [exported, setExported] = useState(false);
  const [agentPhotoUrl, setAgentPhotoUrl] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "All") params.set("status", filterStatus);
      if (filterInterest !== "All") params.set("interest", filterInterest);
      const r = await axios.get(`/api/admin/leads?${params}`);
      const d = r.data as { leads: LeadRow[]; total: number };
      setLeads(d.leads);
      setTotal(d.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterInterest]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => {
    axios.get("/api/admin/agent-config")
      .then((r) => setAgentPhotoUrl((r.data as { photoUrl: string | null }).photoUrl))
      .catch(() => {});
  }, []);

  const updateStatus = async (id: string, status: LeadStatus) => {
    await axios.patch(`/api/admin/leads/${id}`, { status });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selectedLead?.id === id) setSelectedLead((l) => l ? { ...l, status } : l);
  };

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Interest", "Status", "Platform", "Date", "Consent"]];
    leads.forEach((l) =>
      rows.push([
        l.name ?? "", l.email ?? "", l.phone ?? "", l.interest ?? "",
        l.status, l.source, new Date(l.createdAt).toLocaleDateString(),
        l.consent ? "Yes" : "No",
      ])
    );
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads.csv"; a.click();
    setExported(true); setTimeout(() => setExported(false), 2000);
  };

  const interests = ["All", ...Array.from(new Set(leads.map((l) => l.interest).filter(Boolean) as string[]))];

  return (
    <div className={`transition-all ${selectedLead ? "mr-[460px]" : ""}`}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="mt-1 text-[13px] text-white/45">Manage all incoming leads in one place</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8900a] to-[#d4a820] px-4 py-2 text-[13px] font-bold text-[#06091a] transition-opacity hover:opacity-90 cursor-pointer"
        >
          {exported ? <Check className="size-4" /> : <Download className="size-4" />}
          {exported ? "Exported!" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/18 bg-white/4 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gold/18 bg-white/5 text-white placeholder-white/22"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold cursor-pointer transition-all ${
                filterStatus === s
                  ? "border-gold bg-gold/12 text-gold-2"
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}
            >
              {s === "All" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <Select value={filterInterest} onValueChange={setFilterInterest}>
          <SelectTrigger className="w-[140px] border-gold/18 bg-white/5 text-white/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {interests.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[12px] text-white/25">{total} results</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gold/18 bg-white/4">
        {/* Head */}
        <div className="grid grid-cols-[2.2fr_1.8fr_1fr_1fr_1fr_0.8fr_0.5fr] gap-3 border-b border-gold/12 bg-white/2 px-5 py-2.5">
          {["Lead", "Email", "Interest", "Status", "Platform", "Date", ""].map((h, i) => (
            <div key={i} className="text-[10px] uppercase tracking-[1px] text-white/25">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="m-3 h-14 rounded-xl bg-white/4" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-[13px] italic text-white/30">
            No leads match your filters
          </div>
        ) : (
          leads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedLead((s) => s?.id === lead.id ? null : lead)}
              className={`grid cursor-pointer grid-cols-[2.2fr_1.8fr_1fr_1fr_1fr_0.8fr_0.5fr] items-center gap-3 border-b border-gold/8 px-5 py-3.5 last:border-0 transition-colors hover:bg-white/[0.022] ${
                selectedLead?.id === lead.id ? "bg-gold/6" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LeadAvatar name={lead.name} interest={lead.interest} size="sm" />
                <div>
                  <div className="text-[13px] font-medium text-white/90">{lead.name ?? "—"}</div>
                  <div className="text-[11px] text-white/35">{lead.phone}</div>
                </div>
              </div>
              <div className="truncate text-[12px] text-white/50">{lead.email}</div>
              <div className="text-[12px] text-white/80">{lead.interest ?? "—"}</div>
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={lead.status}
                  onValueChange={(v) => updateStatus(lead.id, v as LeadStatus)}
                >
                  <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 text-[11px] font-semibold">
                    <StatusBadge status={lead.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-[12px] capitalize text-white/50">
                {lead.source.toLowerCase().replace("_", " ")}
              </div>
              <div className="text-[11px] text-white/25">{timeAgo(lead.createdAt)}</div>
              <div className="flex justify-center">
                <div className="flex size-[26px] items-center justify-center rounded-lg border border-gold/18 bg-gold/8 text-gold/50 text-[13px]">
                  →
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          agentPhotoUrl={agentPhotoUrl}
        />
      )}
    </div>
  );
}
