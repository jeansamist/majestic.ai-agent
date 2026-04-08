import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LeadStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  interest: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        conversations: {
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            events: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(lead);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const lead = await db.lead.update({ where: { id }, data });
    return NextResponse.json(lead);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
