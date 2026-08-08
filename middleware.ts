// ============================================================================
// SkillSwap — edge middleware: security headers + lightweight rate limiting
// for authentication endpoints. Kept dependency-free so it runs on the edge
// runtime (no node: built-ins, no database imports).
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";

const RATE_LIMITED_PATHS = ["/api/auth/callback", "/api/register", "/api/forgot-password", "/api/reset-password", "/api/login"];
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;

// Simple in-memory sliding window (per worker instance — fine for protection
// against casual abuse; production should use Redis or similar).
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Rate limiting for auth endpoints ---
  if (req.method === "POST" && RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`${pathname}:${ip}`)) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait a minute and try again." } },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
