import { requireUser } from "@/lib/session";
import { listConversations, getOrCreateConversation } from "@/lib/messaging";
import { getUserById } from "@/lib/users";
import { z } from "zod";
import { ApiError, fail, ok, readBody } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = listConversations(user.id);
    return ok({ conversations });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("conversations GET:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Please choose a user.", 400);
    const other = getUserById(parsed.data.userId);
    if (!other) return fail("NOT_FOUND", "User not found.", 404);
    if (other.status === "SUSPENDED") return fail("FORBIDDEN", "This account is currently suspended.", 403);

    const conversation = getOrCreateConversation(user.id, other.id);
    return ok({ conversation }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("conversations POST:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
