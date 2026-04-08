import { parseTags, cleanTags, hasCalendlyDirective } from "@/lib/tag-parser";
import type { AgentReplyResult, ChatMessage, ParsedAgentEvent } from "./types";
import type { AgentConfig } from "@prisma/client";

/**
 * Abstract contract for all agent providers.
 * Implement `generateRaw()` to plug in any LLM.
 */
export abstract class BaseAgent {
  constructor(protected config: AgentConfig) {}

  /**
   * Call the underlying LLM and return the raw response text (tags included).
   */
  protected abstract generateRaw(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string>;

  /**
   * Whether this provider supports streaming responses.
   */
  supportsStreaming(): boolean {
    return false;
  }

  /**
   * Generate a reply, parse tags, and return structured result.
   */
  async generateReply(messages: ChatMessage[]): Promise<AgentReplyResult> {
    const systemPrompt = this.config.systemPrompt;
    const raw = await this.generateRaw(messages, systemPrompt);

    const tagResults = parseTags(raw);
    const events: ParsedAgentEvent[] = tagResults
      .filter((t) => t.type !== "SHOW_CALENDLY")
      .map((t) => ({ type: t.type, payload: t.payload }));

    return {
      content: cleanTags(raw),
      rawContent: raw,
      events,
      uiDirectives: {
        showCalendly: hasCalendlyDirective(raw),
      },
    };
  }
}
