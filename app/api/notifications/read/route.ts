import { requireUser } from "@/lib/session";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications";
import { z } from "zod";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  all: z.boolean().optional(),
  notificationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid input.", 400);

    if (parsed.data.all) {
      markAllNotificationsRead(user.id);
      return ok({ message: "All notifications marked as read." });
    }
    if (!parsed.data.notificationId) return fail("VALIDATION_ERROR", "Missing notification.", 400);
    markNotificationRead(user.id, parsed.data.notificationId);
    return ok({ message: "Marked as read." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("notifications POST:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
