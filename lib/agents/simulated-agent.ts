import { BaseAgent } from "./base-agent";
import type { ChatMessage } from "./types";

/**
 * Simulated agent — works without any API keys.
 * Drives a conversation through the lead-capture flow,
 * emitting the same structured tags as a real LLM provider.
 */
export class SimulatedAgent extends BaseAgent {
  private userMessages(messages: ChatMessage[]): string[] {
    return messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
  }

  private getPhase(userMsgs: string[]): string {
    const joined = userMsgs.join(" ");
    if (userMsgs.length === 0) return "intro";
    if (joined.match(/claim|damage|accident|pipe|flood/)) return "claim";
    if (joined.match(/quote|price|cost|how much|coverage/)) return "quote";
    if (joined.match(/lisa|book|appointment|call|schedule/)) return "calendly";
    if (joined.match(/cancel|renew|update|policy|payment/)) return "policy";
    return "general";
  }

  private extractName(msgs: string[]): string | null {
    for (const msg of msgs) {
      const match = msg.match(/(?:i'?m|name is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (match) return match[1];
    }
    // Try to extract capitalised words as names
    for (const msg of msgs) {
      const words = msg.trim().split(/\s+/);
      if (words.length <= 3 && words.every((w) => /^[A-Z]/.test(w))) {
        return words.join(" ");
      }
    }
    return null;
  }

  private extractEmail(msgs: string[]): string | null {
    for (const msg of msgs) {
      const match = msg.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
      if (match) return match[0];
    }
    return null;
  }

  protected async generateRaw(messages: ChatMessage[]): Promise<string> {
    const userMsgs = this.userMessages(messages);
    const phase = this.getPhase(userMsgs);
    const msgCount = messages.filter((m) => m.role === "user").length;
    const lastUser = messages.at(-1)?.content ?? "";
    const lastLower = lastUser.toLowerCase();

    // ── Greeting (first user message) ──────────────────────────────────
    if (msgCount === 1) {
      if (phase === "quote") {
        return "Happy to help put something together for you — it'll only take a couple of minutes. Before we get into the details, could I ask your name?";
      }
      if (phase === "claim") {
        return "Of course — I'll help you get that started right away. Could I first ask your name?";
      }
      if (phase === "calendly") {
        return "Of course — Lisa would love to connect with you. Could I get your name first?";
      }
      return "I'd be happy to help! Before we go any further, could I ask your name? It helps me personalise things a little.";
    }

    const name = this.extractName(userMsgs);
    const email = this.extractEmail(userMsgs);

    // ── Need name ───────────────────────────────────────────────────────
    if (!name && !lastLower.includes("@")) {
      // Check if last message looks like a name
      const words = lastUser.trim().split(/\s+/);
      const looksLikeName = words.length <= 3 && /^[A-Za-z]/.test(lastUser.trim());
      if (!looksLikeName) {
        return "Before anything else, could I get your name? It just helps me tailor things for you.";
      }
    }

    // ── Have name, need email ───────────────────────────────────────────
    if (name && !email) {
      return `Great to meet you, ${name}! And what's a good email address for you? If our conversation gets interrupted for any reason, I can make sure any next steps reach you directly.`;
    }

    // ── Have both — emit LEAD_CAPTURED ─────────────────────────────────
    if (name && email && msgCount <= 4) {
      const intent =
        phase === "quote" ? "quote_request" :
        phase === "claim" ? "claim" :
        phase === "calendly" ? "appointment" :
        phase === "policy" ? "policy_management" :
        "general_inquiry";

      const leadTag = `[LEAD_CAPTURED:{"name":"${name}","email":"${email}","intent":"${intent}","timestamp":"${new Date().toISOString()}"}]`;
      const consentTag = `[CONSENT:{"granted":true}]`;

      return `Thank you! One quick question — would it be alright if we occasionally reached out with coverage tips or updates? We keep it light and only send things that genuinely matter.\n${leadTag}\n${consentTag}`;
    }

    // ── Phase-specific flows ────────────────────────────────────────────
    if (phase === "quote") {
      if (msgCount === 5) return "What type of coverage are you looking for — Auto, Home, Life, Boat, or Renters?";
      if (msgCount === 6) {
        const interest = lastLower.includes("auto") ? "Auto" :
          lastLower.includes("home") ? "Home" :
          lastLower.includes("life") ? "Life" :
          lastLower.includes("boat") ? "Boat" : "Renters";
        return `${interest} coverage — great choice. ${interest === "Auto" ? "What's the year, make, and model of the vehicle?" : interest === "Home" ? "What's the property type — house, condo, or rental?" : "Are you thinking term life or whole life coverage?"}`;
      }
      if (msgCount === 7) return "Any existing insurance you'd like to keep or switch from?";
      if (msgCount >= 8) {
        const quoteTag = `[QUOTE_REQUEST:{"type":"${lastLower.includes("auto") ? "Auto" : "General"}","details":"${name} requested a quote via chat."}]`;
        return `Thank you — I've noted all of that. A member of our team will be in touch with your options shortly. Would you also like to book a quick call with Lisa to go through things in more detail?\n${quoteTag}`;
      }
    }

    if (phase === "claim") {
      if (msgCount === 5) return "Could you give me a brief description of what happened?";
      if (msgCount === 6) return "And do you have your policy number handy? No worries if not — we can look it up.";
      if (msgCount >= 7) {
        const claimTag = `[CLAIM_REQUEST:{"name":"${name}","email":"${email}","policy":"N/A","description":"${lastUser.slice(0, 100)}","contact_pref":"email"}]`;
        const summaryTag = `[CONVERSATION_SUMMARY:{"intent":"claim","key_points":"${name} filed a claim via chat","status":"claim_filed","next_action":"Claims agent to follow up within 24 hours"}]`;
        return `Thank you — one of our claims agents will be in touch with you very shortly to walk you through the next steps. You can also view our full claims process at gomajesticinsurance.com/claim.\n${claimTag}\n${summaryTag}`;
      }
    }

    if (phase === "calendly" || lastLower.includes("book") || lastLower.includes("schedule") || lastLower.includes("yes")) {
      if (lastLower.match(/yes|sure|please|book|schedule|call/)) {
        return `Of course — Lisa would love to connect with you. Let me pull up her available times.\n[SHOW_CALENDLY]`;
      }
    }

    if (phase === "policy") {
      if (msgCount <= 6) return "Could you tell me a bit more about what you need — are you looking to cancel, renew, or update your policy?";
      const policyTag = `[POLICY_REQUEST:{"name":"${name}","email":"${email}","type":"General","request":"${lastUser.slice(0, 100)}"}]`;
      return `Understood — I'll pass that along to our team and someone will be in touch shortly.\n${policyTag}`;
    }

    // ── General fallback ────────────────────────────────────────────────
    const generalResponses = [
      "That's a great area to explore. We cover Home, Auto, Life, Boat, Renters, and Business insurance — would you like details on any of these?",
      "Happy to help with that. Would it be worth setting up a quick call with Lisa? She can walk you through everything in detail.",
      "We'd be happy to look into that for you. Is there a specific type of coverage you're most interested in?",
      "Good question — our team can give you a full picture on that. Would you like to book a quick call with Lisa?",
    ];

    return generalResponses[Math.min(msgCount - 5, generalResponses.length - 1)] ??
      "I'm here to help with all things Majestic Insurance. What can I assist you with today?";
  }
}
