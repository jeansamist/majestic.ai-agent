import type { AgentConfig } from "@prisma/client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentReplyResult {
  /** Cleaned text (tags stripped) shown to user */
  content: string;
  /** Raw text including tags, stored in DB */
  rawContent: string;
  /** Structured events parsed from tags */
  events: ParsedAgentEvent[];
  /** UI directives derived from tags */
  uiDirectives: {
    showCalendly: boolean;
  };
}

export interface ParsedAgentEvent {
  type: string;
  payload: Record<string, unknown>;
}

export type { AgentConfig };
