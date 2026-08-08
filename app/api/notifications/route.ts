import { requireUser } from "@/lib/session";
import { listNotifications, unreadCount } from "@/lib/notifications";
import { ApiError, fail, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(5, Number(url.searchParams.get("limit") ?? 30)));
    return ok({ notifications: listNotifications(user.id, limit), unread: unreadCount(user.id) });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("notifications:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
