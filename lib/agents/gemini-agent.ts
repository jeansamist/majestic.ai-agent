import { GoogleGenAI, Type, ApiError, type FunctionDeclaration } from "@google/genai";
import { BaseAgent } from "./base-agent";
import type { AgentReplyResult, ChatMessage, ParsedAgentEvent } from "./types";
import type { AgentConfig } from "@prisma/client";
import { FUNCTION_CALLING_INSTRUCTIONS, mapFunctionCallToEvent } from "./tools";

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

    let text = response.text ?? "";
    const functionCalls = response.functionCalls ?? [];

    const events: ParsedAgentEvent[] = [];
    let showCalendly = false;

    for (const call of functionCalls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      const mapped = mapFunctionCallToEvent(call.name ?? "", args);
      if (mapped.event) events.push(mapped.event);
      if (mapped.showCalendly) showCalendly = true;
    }

    // If Gemini only returned function calls with no text, send back function
    // results so the model generates the user-visible conversational reply.
    if (!text && functionCalls.length > 0) {
      try {
        const functionResults = functionCalls.map((call) => ({
          role: "function" as const,
          parts: [
            {
              functionResponse: {
                name: call.name ?? "",
                response: { result: "success" },
              },
            },
          ],
        }));

        const continuation = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            ...contents,
            {
              role: "model",
              parts: functionCalls.map((call) => ({
                functionCall: { name: call.name ?? "", args: call.args ?? {} },
              })),
            },
            ...functionResults,
          ],
          config: { systemInstruction: systemPrompt },
        });

        text = continuation.text ?? "";
      } catch {
        // If continuation fails, fall through with empty text
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
