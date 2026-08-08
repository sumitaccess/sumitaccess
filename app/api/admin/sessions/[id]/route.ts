import { z } from "zod";
import { requireUser } from "@/lib/session";
import { updateSessionStatus } from "@/lib/sessions";
import { ApiError, fail, ok, readBody } from "@/lib/api";

// Admin dispute handling: resolve a DISPUTED session by completing or cancelling it.
const schema = z.object({ action: z.enum(["COMPLETE", "CANCEL"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireUser();
    if (admin.role !== "ADMIN" && admin.role !== "MODERATOR") return fail("FORBIDDEN", "Admin access required.", 403);
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid action.", 400);

    const session = updateSessionStatus(params.id, admin.id, parsed.data.action);
    return ok({ session, message: "Session updated." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin session:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
