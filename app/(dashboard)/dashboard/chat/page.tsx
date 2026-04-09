"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className={selected ? "mr-120 transition-all" : "transition-all"}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Chat History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every conversation your agent has had</p>
      </div>

      {/* Search bar */}
      <Card className="mb-4">
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
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
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                  selected?.id === c.id ? "border-primary/40 bg-muted/40" : ""
                }`}
              >
                <CardContent className="pt-0">
                  <div className="flex items-start gap-3">
                    <LeadAvatar name={c.lead?.name ?? null} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-semibold">
                          {c.lead?.name ?? "Anonymous Visitor"}
                        </span>
                        <SourceBadge source={c.source} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground mb-2">
                        {c.lead?.email ?? "No email captured"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="size-3" />
                          {c._count.messages} messages · {fmtDate(String(c.createdAt))}
                        </span>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.lead) setSelected({ id: c.id, name: c.lead.name, email: c.lead.email, status: c.status, source: c.source, createdAt: String(c.createdAt) });
                          }}
                        >
                          View Thread
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground italic">
              No conversations found
            </div>
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
