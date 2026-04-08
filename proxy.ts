import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const SESSION_COOKIE = "majestic_session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isDashboard && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Basic token format check — full DB validation happens in route handlers
  if (!/^[a-f0-9]{64}$/.test(token)) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Attach hashed token to headers so route handlers can validate without
  // re-reading the cookie
  const response = NextResponse.next();
  response.headers.set("x-session-hash", hashToken(token));
  return response;
}

export const proxyConfig = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
