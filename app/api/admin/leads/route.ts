import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EventType, LeadStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") as LeadStatus | null;
    const interest = searchParams.get("interest") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && Object.values(LeadStatus).includes(status) && { status }),
      ...(interest && { interest }),
    };

    const [raw, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { conversations: true } },
          conversations: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              events: {
                where: { type: EventType.QUOTE_REQUEST },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    const leads = raw.map(({ conversations, ...lead }) => {
      const payload = conversations[0]?.events[0]?.payload as {
        coverage_type?: string;
        details?: string;
      } | null | undefined;
      const quoteRequest =
        payload?.coverage_type && payload?.details
          ? { coverage_type: payload.coverage_type, details: payload.details }
          : null;
      return { ...lead, quoteRequest };
    });

    return NextResponse.json({ leads, total, page, limit });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  interest: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const body = await request.json();
    const data = createSchema.parse(body);
    const lead = await db.lead.create({ data });
    return NextResponse.json(lead, { status: 201 });
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
