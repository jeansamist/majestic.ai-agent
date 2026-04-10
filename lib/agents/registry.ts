import type { AgentConfig } from "@prisma/client";
import { AgentProvider } from "@prisma/client";
import { SimulatedAgent } from "./simulated-agent";
import { GeminiAgent } from "./gemini-agent";
import { ClaudeAgent } from "./claude-agent";
import { BaseAgent } from "./base-agent";

/**
 * Returns the appropriate agent provider based on AgentConfig.
 */
export function getAgent(config: AgentConfig): BaseAgent {
  switch (config.provider) {
    case AgentProvider.GEMINI:
      return new GeminiAgent(config);
    case AgentProvider.CLAUDE:
      return new ClaudeAgent(config);
    // case AgentProvider.OPENAI:
    //   return new OpenAIAgent(config);
    // case AgentProvider.MISTRAL:
    //   return new MistralAgent(config);
    case AgentProvider.SIMULATED:
    default:
      return new SimulatedAgent(config);
  }
}
