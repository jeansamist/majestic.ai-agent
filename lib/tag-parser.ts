export type AgentEventType =
  | "LEAD_CAPTURED"
  | "CONSENT"
  | "QUOTE_REQUEST"
  | "CLAIM_REQUEST"
  | "APPOINTMENT_REQUESTED"
  | "POLICY_REQUEST"
  | "COMPLAINT"
  | "CONVERSATION_SUMMARY"
  | "SHOW_CALENDLY";

export interface ParsedTag {
  type: AgentEventType;
  payload: Record<string, unknown>;
}

const ALL_TAGS: AgentEventType[] = [
  "LEAD_CAPTURED",
  "CONSENT",
  "QUOTE_REQUEST",
  "CLAIM_REQUEST",
  "APPOINTMENT_REQUESTED",
  "POLICY_REQUEST",
  "COMPLAINT",
  "CONVERSATION_SUMMARY",
  "SHOW_CALENDLY",
];

export function parseTag(
  text: string,
  tag: AgentEventType
): Record<string, unknown> | boolean | null {
  const re = new RegExp(`\\[${tag}:?(\\{[\\s\\S]*?\\})?\\]`);
  const m = text.match(re);
  if (!m) return null;
  if (!m[1]) return true; // tag with no payload e.g. [SHOW_CALENDLY]
  try {
    return JSON.parse(m[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseTags(text: string): ParsedTag[] {
  const results: ParsedTag[] = [];
  for (const tag of ALL_TAGS) {
    const result = parseTag(text, tag);
    if (result !== null) {
      results.push({
        type: tag,
        payload: result === true ? {} : (result as Record<string, unknown>),
      });
    }
  }
  return results;
}

export function cleanTags(text: string): string {
  let out = text;
  for (const tag of ALL_TAGS) {
    out = out.replace(new RegExp(`\\[${tag}(:\\{[\\s\\S]*?\\})?\\]\\n?`, "g"), "");
  }
  return out.trim();
}

export function hasCalendlyDirective(text: string): boolean {
  return text.includes("[SHOW_CALENDLY]");
}
