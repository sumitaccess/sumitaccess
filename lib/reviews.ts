import { get, query, run, toCamel, toCamelAll, transaction } from "./db";
import { newId, nowIso } from "./ids";
import { ApiError } from "./api";
import { notify } from "./notifications";
import { getSessionById } from "./sessions";
import type { Review } from "@/types";

export interface ReviewInput {
  sessionId: string;
  reviewerId: string;
  rating: number;
  comment?: string | null;
  tags?: string[];
}

export function createReview(input: ReviewInput): Review {
  return transaction(() => {
    const session = getSessionById(input.sessionId);
    if (!session) throw new ApiError("NOT_FOUND", "Session not found.", 404);
    if (session.status !== "COMPLETED") throw new ApiError("INVALID_STATE", "You can review sessions after they're completed.", 409);
    if (session.teacherId !== input.reviewerId && session.learnerId !== input.reviewerId) {
      throw new ApiError("FORBIDDEN", "Only session participants can review.", 403);
    }
    const existing = get("SELECT * FROM reviews WHERE session_id = ? AND reviewer_id = ?", [input.sessionId, input.reviewerId]);
    if (existing) throw new ApiError("CONFLICT", "You've already reviewed this session.", 409);

    const reviewedId = session.teacherId === input.reviewerId ? session.learnerId : session.teacherId;
    const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

    run(
      `INSERT INTO reviews (id, session_id, reviewer_id, reviewed_id, rating, comment, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        input.sessionId,
        input.reviewerId,
        reviewedId,
        rating,
        input.comment?.trim() || null,
        input.tags?.length ? input.tags.join(",") : null,
        nowIso(),
      ],
    );

    // Recompute the reviewed user's aggregate rating
    const agg = get<{ avg: number; n: number }>(
      "SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE reviewed_id = ?",
      [reviewedId],
    );
    run("UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?", [Number(agg?.avg ?? 0), Number(agg?.n ?? 0), reviewedId]);

    const reviewer = input.reviewerId === session.teacherId ? session.teacher : session.learner;
    notify(reviewedId, "REVIEW", "You received a review ⭐", `${reviewer.name} rated your ${session.skill.name} session ${rating}/5.`, `/users/${session.teacherId === reviewedId ? session.learner.username : session.teacher.username}`);

    return toCamel<Review>(get("SELECT * FROM reviews WHERE session_id = ?", [input.sessionId])!);
  });
}

export function listReviewsForUser(userId: string, limit = 20): (Review & { reviewer: { id: string; name: string; username: string; image: string | null } })[] {
  const rows = query(
    `SELECT r.*, u.id AS u_id, u.name AS u_name, u.username AS u_username, u.image AS u_image
     FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.reviewed_id = ?
     ORDER BY r.created_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => ({
    ...toCamel<Review>(r),
    reviewer: {
      id: String(r.u_id),
      name: String(r.u_name),
      username: String(r.u_username),
      image: r.u_image as string | null,
    },
  }));
}

export function reviewsGivenByUser(userId: string): Review[] {
  return toCamelAll<Review>(query("SELECT * FROM reviews WHERE reviewer_id = ? ORDER BY created_at DESC", [userId]));
}
