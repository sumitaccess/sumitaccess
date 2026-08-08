import { requireUser } from "@/lib/session";
import { ApiError, fail, ok } from "@/lib/api";
import { getAdminMetrics, listAllUsers, listRecentSessions } from "@/lib/admin";
import { getAllSkills } from "@/lib/users";
import { listReports } from "@/lib/reports";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return fail("FORBIDDEN", "Admin access required.", 403);
    }
    return ok({
      metrics: getAdminMetrics(),
      users: listAllUsers(undefined, 50),
      sessions: listRecentSessions(30),
      skills: getAllSkills(),
      reports: listReports(),
    });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
