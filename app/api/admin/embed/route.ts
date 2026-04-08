import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const config = await db.agentConfig.findFirst({
      select: {
        publicKey: true,
        name: true,
        widgetButtonLabel: true,
        widgetEnabled: true,
      },
    });

    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const scriptUrl = `${appUrl}/api/embed/script/${config.publicKey}`;
    const snippet = `<script src="${scriptUrl}" data-agent="${config.publicKey}" data-label="${config.widgetButtonLabel}" async></script>`;

    return NextResponse.json({ ...config, scriptUrl, snippet });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
