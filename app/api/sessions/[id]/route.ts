import { z } from "zod";
import { requireUser } from "@/lib/session";
import { updateSessionStatus } from "@/lib/sessions";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({ action: z.enum(["CONFIRM", "DECLINE", "CANCEL", "COMPLETE"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid action.", 400);

    const session = updateSessionStatus(params.id, user.id, parsed.data.action);
    return ok({ session });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("session action:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
