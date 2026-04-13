import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = request.nextUrl;
    const leadId = searchParams.get("leadId") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = leadId ? { leadId } : {};

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      db.conversation.count({ where }),
    ]);

    return NextResponse.json({ conversations, total, page, limit });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
