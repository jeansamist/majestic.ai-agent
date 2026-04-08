import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ConversationSource } from "@prisma/client";

const schema = z.object({
  agentPublicKey: z.string().optional(),
  source: z.nativeEnum(ConversationSource).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentPublicKey, source } = schema.parse(body);

    // Find agent config
    const config = agentPublicKey
      ? await db.agentConfig.findUnique({ where: { publicKey: agentPublicKey } })
      : await db.agentConfig.findFirst();

    if (!config) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const conversation = await db.conversation.create({
      data: {
        agentConfigId: config.id,
        source: source ?? ConversationSource.PUBLIC_PAGE,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      greeting: config.greeting,
      agentName: config.name,
      agentTitle: config.title,
      agentPhotoUrl: config.photoUrl,
      calendlyUrl: config.calendlyUrl,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("[public/agent/conversations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
