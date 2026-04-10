import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ProviderInfo {
  provider: string;
  label: string;
  available: boolean;
  models: { value: string; label: string }[];
  requiresKey: string | null;
}

const PROVIDERS: ProviderInfo[] = [
  {
    provider: "SIMULATED",
    label: "Simulated (No API key needed)",
    available: true,
    models: [],
    requiresKey: null,
  },
  {
    provider: "GEMINI",
    label: "Google Gemini",
    available: !!process.env.GEMINI_API_KEY,
    models: [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (Fastest)" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Most capable)" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    ],
    requiresKey: "GEMINI_API_KEY",
  },
  {
    provider: "OPENAI",
    label: "OpenAI",
    available: !!process.env.OPENAI_API_KEY,
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
    requiresKey: "OPENAI_API_KEY",
  },
  {
    provider: "CLAUDE",
    label: "Anthropic Claude",
    available: !!process.env.ANTHROPIC_API_KEY,
    models: [
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recommended)" },
      { value: "claude-opus-4-6", label: "Claude Opus 4.6 (Most capable)" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fastest)" },
    ],
    requiresKey: "ANTHROPIC_API_KEY",
  },
  {
    provider: "MISTRAL",
    label: "Mistral AI",
    available: !!process.env.MISTRAL_API_KEY,
    models: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "mistral-small-latest", label: "Mistral Small" },
    ],
    requiresKey: "MISTRAL_API_KEY",
  },
];

export async function GET() {
  try {
    await requireUser();
    const config = await db.agentConfig.findFirst({
      select: { provider: true, model: true },
    });
    return NextResponse.json({
      providers: PROVIDERS,
      current: config?.provider ?? "SIMULATED",
      currentModel: config?.model ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
