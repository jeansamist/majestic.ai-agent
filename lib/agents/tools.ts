import type { ParsedAgentEvent } from "./types";

// ── Shared system prompt supplement ────────────────────────────────────────────

export const FUNCTION_CALLING_INSTRUCTIONS = `

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

// ── Shared tool call → event mapping ──────────────────────────────────────────

export function mapFunctionCallToEvent(
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
