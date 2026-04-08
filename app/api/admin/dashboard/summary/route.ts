import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LeadStatus } from "@prisma/client";

export async function GET() {
  try {
    await requireUser();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);

    const [
      totalLeads,
      leadsThisWeek,
      leadsLastWeek,
      totalConversations,
      byStatus,
      allLeads,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      db.lead.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      db.conversation.count(),
      db.lead.groupBy({ by: ["status"], _count: { status: true } }),
      db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 7,
        select: {
          id: true, name: true, email: true, phone: true, interest: true,
          status: true, consent: true, source: true, summary: true,
          createdAt: true, updatedAt: true,
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((b) => [b.status, b._count.status])
    );

    const appointmentsSet =
      (statusCounts[LeadStatus.QUOTED] ?? 0) +
      (statusCounts[LeadStatus.CONTACTED] ?? 0);
    const closedLeads = statusCounts[LeadStatus.CLOSED] ?? 0;

    // Interest and platform aggregations
    const interestRows = await db.lead.groupBy({
      by: ["interest"],
      _count: { interest: true },
      where: { interest: { not: null } },
    });
    const platformRows = await db.lead.groupBy({
      by: ["source"],
      _count: { source: true },
    });

    return NextResponse.json({
      totalLeads,
      leadsThisWeek,
      leadsLastWeek,
      totalConversations,
      appointmentsSet,
      closedLeads,
      byStatus: statusCounts,
      byInterest: Object.fromEntries(
        interestRows.map((r) => [r.interest ?? "Unknown", r._count.interest])
      ),
      byPlatform: Object.fromEntries(
        platformRows.map((r) => [r.source, r._count.source])
      ),
      recentLeads: allLeads,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[admin/dashboard/summary]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
