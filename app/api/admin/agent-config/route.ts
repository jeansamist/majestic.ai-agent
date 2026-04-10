import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    await requireUser();
    const config = await db.agentConfig.findFirst({
      omit: { systemPrompt: false },
    });
    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  greeting: z.string().optional(),
  systemPrompt: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
  calendlyUrl: z.string().url().optional().nullable(),
  provider: z.enum(["SIMULATED", "OPENAI", "CLAUDE", "MISTRAL", "GEMINI"]).optional(),
  model: z.string().optional().nullable(),
  widgetButtonLabel: z.string().optional(),
  widgetEnabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    let config = await db.agentConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config = await db.agentConfig.update({ where: { id: config.id }, data: data as any });
    return NextResponse.json(config);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/admin/agent-config]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
