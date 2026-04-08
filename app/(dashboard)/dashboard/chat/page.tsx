"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge, SourceBadge } from "@/components/shared/status-badge";
import { LeadAvatar } from "@/components/shared/lead-avatar";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConversationRow } from "@/types";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ChatPage() {
  const [convos, setConvos] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string | null; email: string | null; status: string; source: string; createdAt: string } | null>(null);

  useEffect(() => {
    axios.get("/api/admin/conversations")
      .then((r) => setConvos((r.data as { conversations: ConversationRow[] }).conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = convos.filter((c) => {
    if (!search) return true;
    const name = c.lead?.name?.toLowerCase() ?? "";
    const email = c.lead?.email?.toLowerCase() ?? "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div className={selected ? "mr-[460px] transition-all" : "transition-all"}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Chat History</h1>
        <p className="mt-1 text-[13px] text-white/45">Every conversation your agent has had</p>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/18 bg-white/4 p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gold/18 bg-white/5 text-white placeholder-white/22"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[80px] rounded-2xl bg-white/4" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                if (c.lead) {
                  setSelected({
                    id: c.id,
                    name: c.lead.name,
                    email: c.lead.email,
                    status: c.status,
                    source: c.source,
                    createdAt: String(c.createdAt),
                  });
                }
              }}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                selected?.id === c.id
                  ? "border-gold/35 bg-gold/5"
                  : "border-gold/12 bg-white/4 hover:border-gold/22 hover:bg-white/6"
              }`}
            >
              <div className="flex items-start gap-3">
                <LeadAvatar name={c.lead?.name ?? null} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-[14px] font-semibold text-white/90">
                      {c.lead?.name ?? "Anonymous Visitor"}
                    </span>
                    <div className="flex gap-1.5">
                      <SourceBadge source={c.source} />
                    </div>
                  </div>
                  <div className="truncate text-[12px] text-white/45 mb-2">
                    {c.lead?.email ?? "No email captured"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-white/25">
                      {c._count.messages} messages · {fmtDate(String(c.createdAt))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (c.lead) setSelected({ id: c.id, name: c.lead.name, email: c.lead.email, status: c.status, source: c.source, createdAt: String(c.createdAt) });
                      }}
                      className="rounded-lg border border-gold/22 bg-gold/7 px-3 py-1 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/16 cursor-pointer"
                    >
                      View Thread
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <p className="py-16 text-center text-[13px] italic text-white/30">
              No conversations found
            </p>
          )}
        </div>
      )}

      {selected && (
        <LeadDetailPanel
          lead={{
            id: selected.id,
            name: selected.name,
            email: selected.email,
            phone: null,
            interest: null,
            status: "NEW" as const,
            consent: null,
            source: selected.source,
            summary: null,
            createdAt: selected.createdAt,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
