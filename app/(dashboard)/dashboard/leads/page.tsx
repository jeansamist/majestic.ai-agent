"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Download, Check, ChevronRight, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadStatus } from "@prisma/client";
import type { LeadRow, QuoteRequest } from "@/types";

function timeAgo(d: string | Date) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

const STATUSES = ["All", "NEW", "CONTACTED", "QUOTED", "FOLLOW_UP", "CLOSED"] as const;
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUOTED: "Quoted", FOLLOW_UP: "Follow-up", CLOSED: "Closed",
};

// ── Quote detail modal ────────────────────────────────────────────────────────

function QuoteModal({
  lead,
  quote,
  onClose,
  onStatusChange,
}: {
  lead: LeadRow;
  quote: QuoteRequest;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const markQuoted = async () => {
    await onStatusChange(lead.id, LeadStatus.QUOTED);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <LeadAvatar name={lead.name} interest={lead.interest} size="md" />
              <div>
                <DialogTitle className="text-base">{lead.name ?? "Unknown visitor"}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{lead.email ?? "No email"}</p>
              </div>
            </div>
            <Badge variant="destructive" className="shrink-0 text-xs animate-pulse">
              Urgent
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Quote Request
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coverage type</p>
                <p className="text-sm font-semibold capitalize">{quote.coverage_type}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Details provided</p>
                <p className="text-sm leading-relaxed">{quote.details}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Current status", v: STATUS_LABELS[lead.status] ?? lead.status },
              { l: "Captured", v: timeAgo(lead.createdAt) },
              { l: "Email consent", v: lead.consent === true ? "Yes" : lead.consent === false ? "No" : "—" },
              { l: "Platform", v: lead.source.toLowerCase().replace(/_/g, " ") },
            ].map((it) => (
              <div key={it.l} className="rounded-lg border bg-muted/20 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">{it.l}</p>
                <p className="text-sm font-medium capitalize">{it.v}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            {lead.status !== LeadStatus.QUOTED && (
              <Button className="flex-1" onClick={markQuoted}>
                <Check className="size-4 mr-1.5" />
                Mark as Quoted
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="size-4 mr-1.5" />
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterInterest, setFilterInterest] = useState("All");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [quoteModal, setQuoteModal] = useState<{ lead: LeadRow; quote: QuoteRequest } | null>(null);
  const [exported, setExported] = useState(false);
  // Track which quote leads the admin has already seen (persists until page reload)
  const [viewedQuotes, setViewedQuotes] = useState<Set<string>>(new Set());
  const markQuoteViewed = (leadId: string) =>
    setViewedQuotes((prev) => new Set([...prev, leadId]));

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
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, filterStatus, filterInterest]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    await axios.patch(`/api/admin/leads/${id}`, { status });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead((l) => l ? { ...l, status } : l);
  };

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Interest", "Status", "Platform", "Date", "Consent", "Quote Request"]];
    leads.forEach((l) => rows.push([
      l.name ?? "", l.email ?? "", l.phone ?? "", l.interest ?? "",
      l.status, l.source, new Date(l.createdAt).toLocaleDateString(),
      l.consent ? "Yes" : "No",
      l.quoteRequest ? `${l.quoteRequest.coverage_type}: ${l.quoteRequest.details}` : "",
    ]));
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads.csv"; a.click();
    setExported(true); setTimeout(() => setExported(false), 2000);
  };

  const interests = ["All", ...Array.from(new Set(leads.map((l) => l.interest).filter(Boolean) as string[]))];

  // Count unreviewed quote requests
  const urgentCount = leads.filter(
    (l) => l.quoteRequest &&
      l.status !== LeadStatus.QUOTED &&
      l.status !== LeadStatus.CLOSED &&
      !viewedQuotes.has(l.id)
  ).length;

  return (
    <div className={`transition-all ${selectedLead ? "mr-120" : ""}`}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Leads</h1>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {urgentCount} quote{urgentCount > 1 ? "s" : ""} pending
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage all incoming leads in one place</p>
        </div>
        <Button onClick={exportCsv} size="sm" className="gap-2">
          {exported ? <Check className="size-4" /> : <Download className="size-4" />}
          {exported ? "Exported!" : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card size="sm" className="mb-4">
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={filterStatus === s ? "default" : "outline"}
                  size="xs"
                  onClick={() => setFilterStatus(s)}
                >
                  {s === "All" ? "All" : STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <Select value={filterInterest} onValueChange={setFilterInterest}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interests.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{total} results</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card size="sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground italic">
              No leads match your filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, i) => {
                  const hasUrgentQuote =
                    !!lead.quoteRequest &&
                    lead.status !== LeadStatus.QUOTED &&
                    lead.status !== LeadStatus.CLOSED &&
                    !viewedQuotes.has(lead.id);

                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        setSelectedLead((s) => s?.id === lead.id ? null : lead);
                        if (lead.quoteRequest) markQuoteViewed(lead.id);
                      }}
                      className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${
                        selectedLead?.id === lead.id ? "bg-muted/60" : ""
                      } ${hasUrgentQuote ? "bg-destructive/5 hover:bg-destructive/10" : ""}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <LeadAvatar name={lead.name} interest={lead.interest} size="sm" />
                            {hasUrgentQuote && (
                              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                                <span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{lead.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-40">{lead.email}</TableCell>
                      <TableCell className="text-sm">{lead.interest ?? "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => updateStatus(lead.id, v as LeadStatus)}
                        >
                          <SelectTrigger className="h-auto w-auto cursor-pointer gap-1 rounded-lg border-0 bg-transparent px-1 py-0.5 shadow-none hover:bg-muted/60 focus:ring-0">
                            <StatusBadge status={lead.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(LeadStatus).map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {lead.source.toLowerCase().replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{timeAgo(lead.createdAt)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          {hasUrgentQuote && lead.quoteRequest && (
                            <Button
                              size="xs"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => {
                              markQuoteViewed(lead.id);
                              setQuoteModal({ lead, quote: lead.quoteRequest! });
                            }}
                            >
                              <FileText className="size-3" />
                              Quote
                            </Button>
                          )}
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {quoteModal && (
        <QuoteModal
          lead={quoteModal.lead}
          quote={quoteModal.quote}
          onClose={() => setQuoteModal(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
