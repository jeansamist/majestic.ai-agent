import type { AgentConfig } from "@prisma/client";
import { AgentProvider } from "@prisma/client";
import { SimulatedAgent } from "./simulated-agent";
import { BaseAgent } from "./base-agent";

/**
 * Returns the appropriate agent provider based on AgentConfig.
 * Add new provider classes here when implementing real LLMs.
 */
export function getAgent(config: AgentConfig): BaseAgent {
  switch (config.provider) {
    case AgentProvider.SIMULATED:
    default:
      return new SimulatedAgent(config);
    // case AgentProvider.CLAUDE:
    //   return new ClaudeAgent(config);
    // case AgentProvider.OPENAI:
    //   return new OpenAIAgent(config);
    // case AgentProvider.MISTRAL:
    //   return new MistralAgent(config);
  }
}
