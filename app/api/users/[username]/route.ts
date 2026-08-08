import { getUserByUsername, getUserSkills, safeUserPublic } from "@/lib/users";
import { listReviewsForUser } from "@/lib/reviews";
import { countUserSessions } from "@/lib/sessions";
import { getMatchBetween } from "@/lib/matches";
import { getCurrentUser } from "@/lib/session";
import { ApiError, fail, ok } from "@/lib/api";
import type { SafeUser } from "@/types";

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  try {
    const user = getUserByUsername(params.username);
    if (!user || user.status !== "ACTIVE") return fail("NOT_FOUND", "This profile doesn't exist.", 404);
    const viewer = await getCurrentUser();

    return ok({
      user: safeUserPublic(user) as SafeUser,
      teach: getUserSkills(user.id, "TEACH"),
      learn: getUserSkills(user.id, "LEARN"),
      reviews: listReviewsForUser(user.id),
      sessionStats: countUserSessions(user.id),
      isSelf: viewer?.id === user.id,
      relationship: viewer && viewer.id !== user.id ? (getMatchBetween(viewer.id, user.id) ?? null) : null,
    });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("user profile:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
