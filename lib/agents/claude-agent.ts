import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { BaseAgent } from "./base-agent";
import type { AgentReplyResult, ChatMessage, ParsedAgentEvent } from "./types";
import type { AgentConfig } from "@prisma/client";
import { FUNCTION_CALLING_INSTRUCTIONS, mapFunctionCallToEvent } from "./tools";

// ── Tool declarations (Claude / JSON Schema format) ───────────────────────────

const CLAUDE_TOOLS: Tool[] = [
  {
    name: "save_lead",
    description:
      "Call this immediately once you have collected BOTH the visitor's name AND email address. Saves their contact information so the Majestic team can follow up.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The visitor's full name" },
        email: { type: "string", description: "The visitor's email address" },
        intent: {
          type: "string",
          enum: [
            "quote_request",
            "claim",
            "policy_management",
            "general_inquiry",
            "appointment",
            "complaint",
          ],
          description: "The visitor's primary intent for this conversation",
        },
        phone: {
          type: "string",
          description: "Visitor's phone number if they provided it",
        },
      },
      required: ["name", "email", "intent"],
    },
  },
  {
    name: "set_consent",
    description:
      "Record whether the visitor has agreed to receive marketing communications from Majestic Insurance. Call this after asking the consent question.",
    input_schema: {
      type: "object",
      properties: {
        granted: {
          type: "boolean",
          description: "true if the visitor consented, false if they declined",
        },
      },
      required: ["granted"],
    },
  },
  {
    name: "show_calendly",
    description:
      "Show the Calendly booking widget so the visitor can schedule a call with Lisa Walker. Call this when the visitor wants to book an appointment.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "request_quote",
    description:
      "Submit a quote request after collecting coverage details from the visitor.",
    input_schema: {
      type: "object",
      properties: {
        coverage_type: {
          type: "string",
          description:
            "Type of coverage (e.g. Auto, Home, Life, Boat, Renters, Business)",
        },
        details: {
          type: "string",
          description: "Details the visitor provided about their quote request",
        },
      },
      required: ["coverage_type", "details"],
    },
  },
  {
    name: "file_claim",
    description:
      "File an insurance claim on behalf of the visitor. Call after collecting the incident description.",
    input_schema: {
      type: "object",
      properties: {
        policy: {
          type: "string",
          description: "Policy number if the visitor provided it",
        },
        description: {
          type: "string",
          description: "Description of the incident or claim",
        },
        contact_pref: {
          type: "string",
          description: "Visitor's preferred contact method (email, phone, etc.)",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "policy_request",
    description:
      "Submit a policy management request (cancel, renew, update, payment, etc.).",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description:
            "Type of policy request: cancel | renew | update | payment | other",
        },
        request: {
          type: "string",
          description: "Details of what the visitor needs",
        },
      },
      required: ["type", "request"],
    },
  },
  {
    name: "file_complaint",
    description:
      "Record a complaint or concern raised by the visitor. Call after empathizing and collecting complaint details.",
    input_schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Full description of the complaint",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "request_appointment",
    description:
      "Record that the visitor has requested an appointment with the team.",
    input_schema: {
      type: "object",
      properties: {
        preferred_time: {
          type: "string",
          description: "Visitor's preferred time/date if mentioned",
        },
        reason: {
          type: "string",
          description: "Reason for the appointment",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "summarize_conversation",
    description:
      "Summarize the conversation when it is naturally closing. Call once toward the end of a completed interaction.",
    input_schema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "The primary intent of the conversation",
        },
        key_points: {
          type: "string",
          description: "Key points and outcomes from the conversation",
        },
        status: {
          type: "string",
          enum: ["active", "completed", "follow_up", "claim_filed", "quoted"],
          description: "Final status of the conversation",
        },
        next_action: {
          type: "string",
          description: "What the Majestic team should do next",
        },
      },
      required: ["intent", "key_points", "status"],
    },
  },
];

// ── ClaudeAgent ───────────────────────────────────────────────────────────────

export class ClaudeAgent extends BaseAgent {
  private client: Anthropic;

  constructor(config: AgentConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }

  protected async generateRaw(): Promise<string> {
    throw new Error("ClaudeAgent.generateReply() is used directly");
  }

  override async generateReply(messages: ChatMessage[]): Promise<AgentReplyResult> {
    const modelName = this.config.model ?? "claude-sonnet-4-6";
    const systemPrompt = this.config.systemPrompt + FUNCTION_CALLING_INSTRUCTIONS;

    // Convert ChatMessage[] → Anthropic multi-turn format (drop system role)
    const claudeMessages: MessageParam[] = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: modelName,
        max_tokens: 2048,
        system: systemPrompt,
        messages: claudeMessages,
        tools: CLAUDE_TOOLS,
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        if (err.status === 429) {
          return {
            content:
              "I'm temporarily unavailable due to high demand on the AI service. Please try again in a moment.",
            rawContent: "",
            events: [],
            uiDirectives: { showCalendly: false },
          };
        }
        if (err.status === 401) {
          return {
            content:
              "The AI service is currently unavailable. Please ask your administrator to check the API key.",
            rawContent: "",
            events: [],
            uiDirectives: { showCalendly: false },
          };
        }
      }
      throw err;
    }

    // Extract text and tool_use blocks from the response content array
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const events: ParsedAgentEvent[] = [];
    let showCalendly = false;

    for (const block of response.content) {
      if (block.type === "tool_use") {
        const args = (block.input ?? {}) as Record<string, unknown>;
        const mapped = mapFunctionCallToEvent(block.name, args);
        if (mapped.event) events.push(mapped.event);
        if (mapped.showCalendly) showCalendly = true;
      }
    }

    return {
      content: text,
      rawContent: text,
      events,
      uiDirectives: { showCalendly },
    };
  }
}
