import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAgent } from "@/lib/agents/registry";
import { MessageRole, EventType, LeadStatus, Prisma } from "@prisma/client";
import type { ChatMessage } from "@/lib/agents/types";

const schema = z.object({
  conversationId: z.string(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message } = schema.parse(body);

    // Load conversation + config
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        agentConfig: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Build message history for agent
    const history: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role === MessageRole.ASSISTANT ? "assistant" : "user",
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // Save user message
    await db.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: message,
      },
    });

    // Generate reply
    const agent = getAgent(conversation.agentConfig);
    const result = await agent.generateReply(history);

    // Save assistant message
    await db.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: result.content,
        rawTaggedContent: result.rawContent,
      },
    });

    // Process structured events
    for (const event of result.events) {
      try {
        const dbType = event.type as EventType;

        await db.conversationEvent.create({
          data: {
            conversationId,
            type: dbType,
            payload: event.payload as Prisma.InputJsonValue,
          },
        });

        // Handle LEAD_CAPTURED
        if (event.type === "LEAD_CAPTURED") {
          const { name, email, intent } = event.payload as {
            name?: string;
            email?: string;
            intent?: string;
          };

          if (name || email) {
            let lead = email
              ? await db.lead.findFirst({ where: { email } })
              : null;

            if (!lead) {
              lead = await db.lead.create({
                data: {
                  name: name ?? null,
                  email: email ?? null,
                  interest: intent ?? null,
                  status: LeadStatus.NEW,
                  source: conversation.source,
                },
              });
            } else {
              lead = await db.lead.update({
                where: { id: lead.id },
                data: {
                  name: name ?? lead.name,
                  interest: intent ?? lead.interest,
                  lastConversationId: conversationId,
                },
              });
            }

            // Link lead to conversation
            await db.conversation.update({
              where: { id: conversationId },
              data: { leadId: lead.id },
            });
          }
        }

        // Handle CONSENT
        if (event.type === "CONSENT") {
          const { granted } = event.payload as { granted?: boolean };
          const conv = await db.conversation.findUnique({
            where: { id: conversationId },
            select: { leadId: true },
          });
          if (conv?.leadId && granted !== undefined) {
            await db.lead.update({
              where: { id: conv.leadId },
              data: { consent: granted },
            });
          }
        }

        // Handle CONVERSATION_SUMMARY
        if (event.type === "CONVERSATION_SUMMARY") {
          const { key_points, status: summaryStatus } = event.payload as {
            key_points?: string;
            status?: string;
          };
          await db.conversation.update({
            where: { id: conversationId },
            data: { summary: key_points ?? null, status: summaryStatus ?? "completed" },
          });

          const conv = await db.conversation.findUnique({
            where: { id: conversationId },
            select: { leadId: true },
          });
          if (conv?.leadId && key_points) {
            await db.lead.update({
              where: { id: conv.leadId },
              data: { summary: key_points },
            });
          }
        }

        // Update lead status based on event type
        const conv = await db.conversation.findUnique({
          where: { id: conversationId },
          select: { leadId: true },
        });
        if (conv?.leadId) {
          const statusMap: Partial<Record<string, LeadStatus>> = {
            QUOTE_REQUEST: LeadStatus.QUOTED,
            APPOINTMENT_REQUESTED: LeadStatus.CONTACTED,
            CLAIM_REQUEST: LeadStatus.FOLLOW_UP,
            POLICY_REQUEST: LeadStatus.CONTACTED,
          };
          const newStatus = statusMap[event.type];
          if (newStatus) {
            await db.lead.update({
              where: { id: conv.leadId },
              data: { status: newStatus },
            });
          }
        }
      } catch (eventErr) {
        console.error("[chat] event processing error:", eventErr);
      }
    }

    return NextResponse.json({
      conversationId,
      content: result.content,
      showCalendly: result.uiDirectives.showCalendly,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("[public/agent/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
