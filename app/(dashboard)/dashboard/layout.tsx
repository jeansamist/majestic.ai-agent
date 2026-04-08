"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import type { SessionUser } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentConfig, setAgentConfig] = useState<{
    name: string;
    photoUrl: string | null;
    publicKey: string;
  } | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    // Validate session
    axios.get("/api/auth/session").then((r) => {
      const { user: sessionUser } = r.data as { user: SessionUser | null };
      if (!sessionUser) {
        router.push("/auth/login");
        return;
      }
      setUser(sessionUser);
    }).catch(() => router.push("/auth/login"));

    // Load agent config
    axios.get("/api/admin/agent-config")
      .then((r) => setAgentConfig(r.data as { name: string; photoUrl: string | null; publicKey: string }))
      .catch(() => {});

    // Load new leads count
    axios.get("/api/admin/leads?status=NEW&page=1")
      .then((r) => setNewLeadsCount((r.data as { total: number }).total))
      .catch(() => {});
  }, [router]);

  if (!user) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#06091a]">
        <div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen bg-[#06091a] text-white">
      <SidebarNav
        user={user}
        newLeadsCount={newLeadsCount}
        agentName={agentConfig?.name ?? "Emma"}
        agentPhotoUrl={agentConfig?.photoUrl ?? null}
        open={sidebarOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          agentName={agentConfig?.name ?? "Emma"}
          agentPhotoUrl={agentConfig?.photoUrl ?? null}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
