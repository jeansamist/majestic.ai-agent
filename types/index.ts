import type { User, Lead, Conversation, AgentConfig, UserRole, LeadStatus, ConversationSource, AgentProvider } from "@prisma/client";

// Re-export prisma types for convenience
export type { User, Lead, Conversation, AgentConfig, UserRole, LeadStatus, ConversationSource, AgentProvider };

// ── API payload types ───────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChatPayload {
  conversationId?: string;
  message: string;
  agentPublicKey?: string;
}

export interface ChatResponse {
  conversationId: string;
  content: string;
  showCalendly: boolean;
}

export interface LeadStatusUpdate {
  status: LeadStatus;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AgentConfigUpdate {
  name?: string;
  title?: string;
  greeting?: string;
  systemPrompt?: string;
  calendlyUrl?: string;
  photoUrl?: string;
  provider?: AgentProvider;
  model?: string;
  widgetButtonLabel?: string;
  widgetEnabled?: boolean;
}

// ── Dashboard summary types ─────────────────────────────────────────────────

export interface DashboardSummary {
  totalLeads: number;
  leadsThisWeek: number;
  leadsLastWeek: number;
  totalConversations: number;
  appointmentsSet: number;
  closedLeads: number;
  byStatus: Record<string, number>;
  byInterest: Record<string, number>;
  byPlatform: Record<string, number>;
  recentLeads: LeadRow[];
}

export interface QuoteRequest {
  coverage_type: string;
  details: string;
}

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  interest: string | null;
  status: LeadStatus;
  consent: boolean | null;
  source: ConversationSource;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { conversations: number };
  /** Populated when a complete QUOTE_REQUEST event exists for this lead */
  quoteRequest: QuoteRequest | null;
}

export interface ConversationRow {
  id: string;
  leadId: string | null;
  source: ConversationSource;
  summary: string | null;
  status: string;
  createdAt: string;
  lead: { id: string; name: string | null; email: string | null } | null;
  _count: { messages: number };
}

// ── Shared UI types ─────────────────────────────────────────────────────────

export type NavPage =
  | "overview"
  | "leads"
  | "chat"
  | "analytics"
  | "team"
  | "settings";

export interface NavItem {
  key: NavPage;
  label: string;
  href: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
