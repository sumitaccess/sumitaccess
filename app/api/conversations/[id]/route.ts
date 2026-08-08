import { requireUser } from "@/lib/session";
import { listMessages, markConversationRead } from "@/lib/messaging";
import { ApiError, fail, ok } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const messages = listMessages(params.id, user.id);
    markConversationRead(params.id, user.id);
    return ok({ messages });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("messages GET:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
