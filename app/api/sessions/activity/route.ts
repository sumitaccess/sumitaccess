import { requireUser } from "@/lib/session";
import { query } from "@/lib/db";
import { ApiError, fail, ok } from "@/lib/api";

// Weekly session activity for the dashboard chart (last 4 weeks)
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const targetId = url.searchParams.get("userId") ?? user.id;
    if (targetId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return fail("FORBIDDEN", "Not allowed.", 403);
    }

    const weeks: { day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - i * 7);
      const end = new Date(start.getTime() + 7 * 86400000);
      const count = query<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sessions
         WHERE (teacher_id = ? OR learner_id = ?) AND status = 'COMPLETED'
           AND created_at >= ? AND created_at < ?`,
        [targetId, targetId, start.toISOString(), end.toISOString()],
      );
      weeks.push({ day: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: Number(count[0]?.n ?? 0) });
    }
    return ok({ weeks });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("sessions activity:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
