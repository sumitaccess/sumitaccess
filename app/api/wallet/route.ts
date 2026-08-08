import { requireUser } from "@/lib/session";
import { getWallet } from "@/lib/credits";
import { ApiError, fail, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(getWallet(user.id));
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("wallet:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
