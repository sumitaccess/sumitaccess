import { globalSearch } from "@/lib/search";
import { ok } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return ok({ users: [], skills: [], categories: [] });
  return ok(globalSearch(q));
}

export const dynamic = "force-dynamic";
