"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Download, Check, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
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
  NEW: "New", CONTACTED: "Contacted", QUOTED: "Quoted", FOLLOW_UP: "Follow-up", CLOSED: "Closed",
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
    const rows = [["Name", "Email", "Phone", "Interest", "Status", "Platform", "Date", "Consent"]];
    leads.forEach((l) => rows.push([
      l.name ?? "", l.email ?? "", l.phone ?? "", l.interest ?? "",
      l.status, l.source, new Date(l.createdAt).toLocaleDateString(),
      l.consent ? "Yes" : "No",
    ]));
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads.csv"; a.click();
    setExported(true); setTimeout(() => setExported(false), 2000);
  };

  const interests = ["All", ...Array.from(new Set(leads.map((l) => l.interest).filter(Boolean) as string[]))];

  return (
    <div className={`transition-all ${selectedLead ? "mr-120" : ""}`}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
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
                {leads.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedLead((s) => s?.id === lead.id ? null : lead)}
                    className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${
                      selectedLead?.id === lead.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <LeadAvatar name={lead.name} interest={lead.interest} size="sm" />
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
                        <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none">
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
                      {lead.source.toLowerCase().replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(lead.createdAt)}</TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </motion.tr>
                ))}
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
    </div>
  );
}
