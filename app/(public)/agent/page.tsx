import { Suspense } from "react";
import { db } from "@/lib/db";
import { ChatShell } from "@/components/agent/chat-shell";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentPageProps {
  searchParams: Promise<{ embed?: string; key?: string }>;
}

async function AgentContent({ searchParams }: AgentPageProps) {
  const { embed, key: publicKey } = await searchParams;
  const isEmbed = embed === "1";

  // Load config — prefer publicKey from URL, else first config
  const config = publicKey
    ? await db.agentConfig.findUnique({ where: { publicKey } })
    : await db.agentConfig.findFirst();

  if (!config || !config.widgetEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/40 text-sm">Agent not available.</p>
      </div>
    );
  }

  return (
    <ChatShell
      config={{
        agentName: config.name,
        agentTitle: config.title,
        agentPhotoUrl: config.photoUrl,
        greeting: config.greeting,
        calendlyUrl: config.calendlyUrl,
        agentPublicKey: config.publicKey,
        isEmbed,
      }}
    />
  );
}

export default function AgentPage(props: AgentPageProps) {
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#06091a] via-[#0d1b3e] to-[#06091a] p-5">
      <Suspense
        fallback={
          <div className="w-full max-w-[840px] rounded-[28px] border border-gold/22 bg-white/3 p-6">
            <Skeleton className="mb-4 h-[70px] bg-white/4" />
            <Skeleton className="h-[500px] bg-white/4" />
          </div>
        }
      >
        <AgentContent {...props} />
      </Suspense>
      <p className="mt-5 text-[11px] uppercase tracking-[1.5px] text-white/18">
        Majestic Insurance Agency · Muskegon Lakeshore
      </p>
    </div>
  );
}
