import { z } from "zod";
import { requireUser } from "@/lib/session";
import { respondToMatch } from "@/lib/matches";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({ action: z.enum(["ACCEPT", "REJECT", "BLOCK"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid action.", 400);

    const match = respondToMatch(params.id, user.id, parsed.data.action);
    const message =
      parsed.data.action === "ACCEPT"
        ? "You're matched! Start planning your swap. 🎉"
        : parsed.data.action === "BLOCK"
          ? "Blocked."
          : "Request declined.";
    return ok({ match, message });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("match respond:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
