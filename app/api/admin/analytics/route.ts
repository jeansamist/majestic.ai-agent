import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();

    const [
      totalLeads,
      totalConversations,
      byStatus,
      byInterest,
      bySource,
      consentCount,
      avgMessages,
    ] = await Promise.all([
      db.lead.count(),
      db.conversation.count(),
      db.lead.groupBy({ by: ["status"], _count: { status: true } }),
      db.lead.groupBy({
        by: ["interest"],
        _count: { interest: true },
        where: { interest: { not: null } },
      }),
      db.lead.groupBy({ by: ["source"], _count: { source: true } }),
      db.lead.count({ where: { consent: true } }),
      db.message.count().then(async (total) => {
        const convs = await db.conversation.count();
        return convs > 0 ? Math.round(total / convs) : 0;
      }),
    ]);

    const convRate =
      totalLeads > 0
        ? Math.round(
            ((await db.lead.count({ where: { status: { not: "NEW" } } })) /
              totalLeads) *
              100
          )
        : 0;

    return NextResponse.json({
      totalLeads,
      totalConversations,
      conversionRate: convRate,
      consentRate: totalLeads > 0 ? Math.round((consentCount / totalLeads) * 100) : 0,
      avgMessagesPerConversation: avgMessages,
      byStatus: Object.fromEntries(byStatus.map((b) => [b.status, b._count.status])),
      byInterest: Object.fromEntries(
        byInterest.map((b) => [b.interest ?? "Unknown", b._count.interest])
      ),
      bySource: Object.fromEntries(bySource.map((b) => [b.source, b._count.source])),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
