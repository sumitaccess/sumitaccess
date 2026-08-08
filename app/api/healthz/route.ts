import { ok } from "@/lib/api";

// Render (and other platforms) ping this for health checks.
export async function GET() {
  return ok({ status: "ok", service: "skillswap", time: new Date().toISOString() });
}

export const dynamic = "force-dynamic";
