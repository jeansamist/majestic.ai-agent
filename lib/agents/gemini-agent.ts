import { GoogleGenAI, Type, ApiError, type FunctionDeclaration } from "@google/genai";
import { BaseAgent } from "./base-agent";
import type { AgentReplyResult, ChatMessage, ParsedAgentEvent } from "./types";
import type { AgentConfig } from "@prisma/client";

// ── Function declarations (tools) ───────────────────────────────────────────

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "save_lead",
    description:
      "Call this immediately once you have collected BOTH the visitor's name AND email address. Saves their contact information so the Majestic team can follow up.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The visitor's full name" },
        email: { type: Type.STRING, description: "The visitor's email address" },
        intent: {
          type: Type.STRING,
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
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        granted: {
          type: Type.BOOLEAN,
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
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "request_quote",
    description:
      "Submit a quote request after collecting coverage details from the visitor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        coverage_type: {
          type: Type.STRING,
          description:
            "Type of coverage (e.g. Auto, Home, Life, Boat, Renters, Business)",
        },
        details: {
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        policy: {
          type: Type.STRING,
          description: "Policy number if the visitor provided it",
        },
        description: {
          type: Type.STRING,
          description: "Description of the incident or claim",
        },
        contact_pref: {
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: "Type of policy request: cancel | renew | update | payment | other",
        },
        request: {
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        preferred_time: {
          type: Type.STRING,
          description: "Visitor's preferred time/date if mentioned",
        },
        reason: {
          type: Type.STRING,
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
    parameters: {
      type: Type.OBJECT,
      properties: {
        intent: {
          type: Type.STRING,
          description: "The primary intent of the conversation",
        },
        key_points: {
          type: Type.STRING,
          description: "Key points and outcomes from the conversation",
        },
        status: {
          type: Type.STRING,
          enum: ["active", "completed", "follow_up", "claim_filed", "quoted"],
          description: "Final status of the conversation",
        },
        next_action: {
          type: Type.STRING,
          description: "What the Majestic team should do next",
        },
      },
      required: ["intent", "key_points", "status"],
    },
  },
];

// ── System prompt supplement for function calling ────────────────────────────

const FUNCTION_CALLING_INSTRUCTIONS = `

## TOOL USAGE (MANDATORY)
You have access to tools. Use them silently — NEVER mention tool calls in your text responses.

- save_lead → Call immediately once you have BOTH name AND email. Do NOT wait.
- set_consent → Call after the visitor responds to your consent question.
- show_calendly → Call when visitor wants to book a call with Lisa.
- request_quote → Call after collecting coverage type and details.
- file_claim → Call after collecting incident description.
- policy_request → Call after collecting policy change details.
- file_complaint → Call after empathizing and collecting complaint details.
- request_appointment → Call when visitor requests an appointment.
- summarize_conversation → Call when the conversation is naturally closing.

Do NOT output tags like [LEAD_CAPTURED:...] or [SHOW_CALENDLY]. Use the tool functions exclusively.`;

// ── Tool call → event mapping ────────────────────────────────────────────────

function mapFunctionCallToEvent(
  name: string,
  args: Record<string, unknown>
): { event: ParsedAgentEvent | null; showCalendly: boolean } {
  switch (name) {
    case "save_lead":
      return {
        event: {
          type: "LEAD_CAPTURED",
          payload: {
            name: args.name,
            email: args.email,
            intent: args.intent,
            phone: args.phone ?? null,
            timestamp: new Date().toISOString(),
          },
        },
        showCalendly: false,
      };

    case "set_consent":
      return {
        event: { type: "CONSENT", payload: { granted: args.granted } },
        showCalendly: false,
      };

    case "show_calendly":
      return { event: null, showCalendly: true };

    case "request_quote":
      return {
        event: {
          type: "QUOTE_REQUEST",
          payload: { type: args.coverage_type, details: args.details },
        },
        showCalendly: false,
      };

    case "file_claim":
      return {
        event: {
          type: "CLAIM_REQUEST",
          payload: {
            policy: args.policy ?? "N/A",
            description: args.description,
            contact_pref: args.contact_pref ?? "email",
          },
        },
        showCalendly: false,
      };

    case "policy_request":
      return {
        event: {
          type: "POLICY_REQUEST",
          payload: { type: args.type, request: args.request },
        },
        showCalendly: false,
      };

    case "file_complaint":
      return {
        event: { type: "COMPLAINT", payload: { description: args.description } },
        showCalendly: false,
      };

    case "request_appointment":
      return {
        event: {
          type: "APPOINTMENT_REQUESTED",
          payload: {
            preferred_time: args.preferred_time ?? null,
            reason: args.reason,
          },
        },
        showCalendly: false,
      };

    case "summarize_conversation":
      return {
        event: {
          type: "CONVERSATION_SUMMARY",
          payload: {
            intent: args.intent,
            key_points: args.key_points,
            status: args.status,
            next_action: args.next_action ?? null,
          },
        },
        showCalendly: false,
      };

    default:
      return { event: null, showCalendly: false };
  }
}

// ── GeminiAgent ──────────────────────────────────────────────────────────────

export class GeminiAgent extends BaseAgent {
  private ai: GoogleGenAI;

  constructor(config: AgentConfig) {
    super(config);
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  protected async generateRaw(): Promise<string> {
    throw new Error("GeminiAgent.generateReply() is used directly");
  }

  override async generateReply(messages: ChatMessage[]): Promise<AgentReplyResult> {
    const modelName = this.config.model ?? "gemini-2.5-flash";
    const systemPrompt = this.config.systemPrompt + FUNCTION_CALLING_INSTRUCTIONS;

    // Convert ChatMessage[] → Gemini multi-turn format
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    let response;
    try {
      response = await this.ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          return {
            content: "I'm temporarily unavailable due to high demand on the AI service. Please try again in a moment.",
            rawContent: "",
            events: [],
            uiDirectives: { showCalendly: false },
          };
        }
        if (err.status === 404) {
          return {
            content: "The selected AI model is currently unavailable. Please ask your administrator to check the provider settings.",
            rawContent: "",
            events: [],
            uiDirectives: { showCalendly: false },
          };
        }
      }
      throw err;
    }

    const text = response.text ?? "";
    const functionCalls = response.functionCalls ?? [];

    const events: ParsedAgentEvent[] = [];
    let showCalendly = false;

    for (const call of functionCalls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      const mapped = mapFunctionCallToEvent(call.name ?? "", args);
      if (mapped.event) events.push(mapped.event);
      if (mapped.showCalendly) showCalendly = true;
    }

    return {
      content: text,
      rawContent: text,
      events,
      uiDirectives: { showCalendly },
    };
  }
}
