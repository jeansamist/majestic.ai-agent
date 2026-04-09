"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import type { SessionUser } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [agentConfig, setAgentConfig] = useState<{
    name: string;
    photoUrl: string | null;
  } | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    axios.get("/api/auth/session").then((r) => {
      const { user: sessionUser } = r.data as { user: SessionUser | null };
      if (!sessionUser) { router.push("/auth/login"); return; }
      setUser(sessionUser);
    }).catch(() => router.push("/auth/login"));

    axios.get("/api/admin/agent-config")
      .then((r) => setAgentConfig(r.data as { name: string; photoUrl: string | null }))
      .catch(() => {});

    axios.get("/api/admin/leads?status=NEW&page=1")
      .then((r) => setNewLeadsCount((r.data as { total: number }).total))
      .catch(() => {});
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SidebarNav
        user={user}
        newLeadsCount={newLeadsCount}
        agentName={agentConfig?.name ?? "Emma"}
        agentPhotoUrl={agentConfig?.photoUrl ?? null}
      />
      <SidebarInset>
        <Topbar
          user={user}
          agentName={agentConfig?.name ?? "Emma"}
          agentPhotoUrl={agentConfig?.photoUrl ?? null}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
