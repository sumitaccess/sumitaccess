import { get, query, run, toCamel, toCamelAll, transaction } from "./db";
import { newId, nowIso, toIso } from "./ids";
import { ApiError } from "./api";
import { awardCredits, spendCredits, InsufficientCreditsError } from "./credits";
import { notify } from "./notifications";
import { safeUserPublic, getUserById, getSkillById } from "./users";
import type { Session, SessionWithDetails, Skill, SafeUser } from "@/types";
import { addMinutes } from "./utils";

// ---------------------------------------------------------------------------
// Sessions repository + business logic
// ---------------------------------------------------------------------------

export interface SessionDetail extends Session {
  teacher: SafeUser;
  learner: SafeUser;
  skill: Skill;
  review: { id: string; rating: number; comment: string | null } | null;
  requestMatchId: string | null;
}

const SESSION_SELECT = `
  SELECT s.*,
    t.id AS t_id, t.name AS t_name, t.username AS t_username, t.image AS t_image, t.bio AS t_bio,
    t.headline AS t_headline, t.location AS t_location, t.timezone AS t_timezone, t.languages AS t_languages,
    t.availability AS t_availability, t.online_pref AS t_online_pref, t.rating AS t_rating,
    t.total_reviews AS t_total_reviews, t.completed_sessions AS t_completed_sessions,
    t.hours_taught AS t_hours_taught, t.role AS t_role, t.status AS t_status, t.verified AS t_verified,
    t.credits AS t_credits, t.created_at AS t_created_at, t.updated_at AS t_updated_at, t.last_active_at AS t_last_active_at,
    l.id AS l_id, l.name AS l_name, l.username AS l_username, l.image AS l_image, l.bio AS l_bio,
    l.headline AS l_headline, l.location AS l_location, l.timezone AS l_timezone, l.languages AS l_languages,
    l.availability AS l_availability, l.online_pref AS l_online_pref, l.rating AS l_rating,
    l.total_reviews AS l_total_reviews, l.completed_sessions AS l_completed_sessions,
    l.hours_taught AS l_hours_taught, l.role AS l_role, l.status AS l_status, l.verified AS l_verified,
    l.credits AS l_credits, l.created_at AS l_created_at, l.updated_at AS l_updated_at, l.last_active_at AS l_last_active_at,
    sk.id AS sk_id, sk.name AS sk_name, sk.slug AS sk_slug, sk.category AS sk_category,
    sk.description AS sk_description, sk.icon AS sk_icon, sk.color AS sk_color, sk.popularity AS sk_popularity,
    sk.created_at AS sk_created_at,
    rv.id AS rv_id, rv.rating AS rv_rating, rv.comment AS rv_comment
  FROM sessions s
  JOIN users t ON t.id = s.teacher_id
  JOIN users l ON l.id = s.learner_id
  JOIN skills sk ON sk.id = s.skill_id
  LEFT JOIN reviews rv ON rv.session_id = s.id
`;

function rowToSessionDetail(r: Record<string, unknown>): SessionDetail {
  // Build the base Session explicitly so joined columns (t_id, sk_id, …)
  // never leak into the response.
  const base: Session = {
    id: String(r.id),
    teacherId: String(r.teacher_id),
    learnerId: String(r.learner_id),
    skillId: String(r.skill_id),
    title: r.title as string | null,
    description: r.description as string | null,
    startTime: String(r.start_time),
    endTime: String(r.end_time),
    duration: Number(r.duration),
    status: String(r.status),
    credits: Number(r.credits),
    sessionType: String(r.session_type),
    meetingUrl: r.meeting_url as string | null,
    location: r.location as string | null,
    cancelledBy: r.cancelled_by as string | null,
    cancelReason: r.cancel_reason as string | null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
  const userFrom = (prefix: string): SafeUser => ({
    id: String(r[`${prefix}_id`]),
    name: String(r[`${prefix}_name`]),
    username: String(r[`${prefix}_username`]),
    image: r[`${prefix}_image`] as string | null,
    bio: r[`${prefix}_bio`] as string | null,
    headline: r[`${prefix}_headline`] as string | null,
    location: r[`${prefix}_location`] as string | null,
    timezone: String(r[`${prefix}_timezone`] ?? "UTC"),
    languages: String(r[`${prefix}_languages`] ?? ""),
    availability: r[`${prefix}_availability`] as string | null,
    onlinePref: String(r[`${prefix}_online_pref`] ?? "ONLINE"),
    rating: Number(r[`${prefix}_rating`] ?? 0),
    totalReviews: Number(r[`${prefix}_total_reviews`] ?? 0),
    completedSessions: Number(r[`${prefix}_completed_sessions`] ?? 0),
    hoursTaught: Number(r[`${prefix}_hours_taught`] ?? 0),
    credits: Number(r[`${prefix}_credits`] ?? 0),
    role: String(r[`${prefix}_role`] ?? "USER"),
    status: String(r[`${prefix}_status`] ?? "ACTIVE"),
    verified: Boolean(r[`${prefix}_verified`]),
    createdAt: String(r[`${prefix}_created_at`] ?? ""),
    updatedAt: String(r[`${prefix}_updated_at`] ?? ""),
    lastActiveAt: r[`${prefix}_last_active_at`] as string | null,
  });
  const skill: Skill = {
    id: String(r.sk_id),
    name: String(r.sk_name),
    slug: String(r.sk_slug),
    category: String(r.sk_category),
    description: r.sk_description as string | null,
    icon: r.sk_icon as string | null,
    color: r.sk_color as string | null,
    popularity: Number(r.sk_popularity ?? 0),
    createdAt: String(r.sk_created_at ?? ""),
  };
  return {
    ...base,
    teacher: userFrom("t"),
    learner: userFrom("l"),
    skill,
    review: r.rv_id ? { id: String(r.rv_id), rating: Number(r.rv_rating), comment: r.rv_comment as string | null } : null,
    requestMatchId: null,
  };
}

export function getSessionById(id: string): SessionDetail | undefined {
  const row = get(`${SESSION_SELECT} WHERE s.id = ?`, [id]);
  return row ? rowToSessionDetail(row) : undefined;
}

export function listSessionsForUser(userId: string, filter: "upcoming" | "completed" | "cancelled" | "pending" = "upcoming"): SessionDetail[] {
  const now = nowIso();
  let where = "";
  switch (filter) {
    case "upcoming":
      where = `AND s.status IN ('REQUESTED','CONFIRMED') AND s.end_time >= '${now}'`;
      break;
    case "pending":
      where = `AND s.status = 'REQUESTED' AND s.end_time >= '${now}'`;
      break;
    case "completed":
      where = `AND s.status IN ('COMPLETED','DISPUTED')`;
      break;
    case "cancelled":
      where = `AND s.status = 'CANCELLED'`;
      break;
  }
  const rows = query(
    `${SESSION_SELECT} WHERE (s.teacher_id = ? OR s.learner_id = ?) ${where} ORDER BY s.start_time DESC LIMIT 50`,
    [userId, userId],
  );
  return rows.map(rowToSessionDetail);
}

export interface CreateSessionInput {
  teacherId: string;
  learnerId: string;
  skillId: string;
  startTime: string;
  duration: number;
  sessionType: "ONLINE" | "IN_PERSON";
  title?: string | null;
  description?: string | null;
  location?: string | null;
  credits?: number;
}

export function createSessionRequest(input: CreateSessionInput, actorId: string): SessionDetail {
  return transaction(() => {
    const skill = getSkillById(input.skillId);
    if (!skill) throw new ApiError("VALIDATION_ERROR", "Please select a skill.", 400);
    if (input.teacherId === input.learnerId) throw new ApiError("VALIDATION_ERROR", "You can't book a session with yourself.", 400);
    if (input.credits && input.credits < 1) throw new ApiError("VALIDATION_ERROR", "Credits must be at least 1.", 400);
    const start = new Date(input.startTime);
    if (Number.isNaN(start.getTime())) throw new ApiError("VALIDATION_ERROR", "Please choose a valid date and time.", 400);
    const duration = Math.min(Math.max(input.duration, 15), 240);
    const end = addMinutes(start.toISOString(), duration);
    if (start.getTime() < Date.now() - 60_000) throw new ApiError("VALIDATION_ERROR", "Please pick a time in the future.", 400);

    // The teacher must actually teach this skill
    const teaches = get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM user_skills WHERE user_id = ? AND skill_id = ? AND type = 'TEACH'",
      [input.teacherId, input.skillId],
    );
    if (Number(teaches?.n ?? 0) === 0) throw new ApiError("VALIDATION_ERROR", "This person doesn't teach that skill.", 400);

    // No overlapping confirmed sessions for either party
    for (const uid of [input.teacherId, input.learnerId]) {
      const clash = get<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sessions
         WHERE status IN ('REQUESTED','CONFIRMED') AND (teacher_id = ? OR learner_id = ?)
           AND end_time > ? AND start_time < ?`,
        [uid, uid, input.startTime, end],
      );
      if (Number(clash?.n ?? 0) > 0) {
        throw new ApiError("CONFLICT", "There's already a session overlapping that time.", 409);
      }
    }

    const id = newId();
    const now = nowIso();
    run(
      `INSERT INTO sessions (id, teacher_id, learner_id, skill_id, title, description, start_time, end_time, duration, status, credits, session_type, location, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?, ?)`,
      [id, input.teacherId, input.learnerId, input.skillId, input.title ?? null, input.description ?? null, input.startTime, end, duration, input.credits ?? 1, input.sessionType, input.location ?? null, now, now],
    );

    const teacher = getUserById(input.teacherId);
    const learner = getUserById(input.learnerId);
    if (teacher && learner) {
      notify(
        teacher.id,
        "SWAP_REQUEST",
        "New session request",
        `${learner.name} wants to learn ${skill.name} with you on ${new Date(input.startTime).toLocaleDateString()}.`,
        "/sessions",
      );
    }
    return getSessionById(id)!;
  });
}

/**
 * Respond to a session request or manage a confirmed session.
 * actor: CONFIRM (teacher) → charges learner credits
 *        DECLINE (teacher) → cancels the request
 *        CANCEL (either party, confirmed + future) → refunds learner
 *        COMPLETE (either party, confirmed) → pays teacher, updates stats
 */
export function updateSessionStatus(id: string, actorId: string, action: "CONFIRM" | "DECLINE" | "CANCEL" | "COMPLETE"): SessionDetail {
  return transaction(() => {
    const s = getSessionById(id);
    if (!s) throw new ApiError("NOT_FOUND", "Session not found.", 404);
    const isTeacher = s.teacherId === actorId;
    const isLearner = s.learnerId === actorId;
    if (!isTeacher && !isLearner && !isAdmin(actorId)) throw new ApiError("FORBIDDEN", "You don't have access to this session.", 403);
    const now = nowIso();

    switch (action) {
      case "CONFIRM": {
        if (!isTeacher && !isAdmin(actorId)) throw new ApiError("FORBIDDEN", "Only the teacher can confirm a session.", 403);
        if (s.status !== "REQUESTED") throw new ApiError("INVALID_STATE", "This request is no longer pending.", 409);
        const learner = getUserById(s.learnerId);
        if (!learner) throw new ApiError("NOT_FOUND", "Learner not found.", 404);
        try {
          spendCredits(s.learnerId, s.credits, "SPENT", `Session: ${s.skill.name} with ${s.teacher.name}`, s.id);
        } catch (err) {
          if (err instanceof InsufficientCreditsError) {
            throw new ApiError("INSUFFICIENT_CREDITS", `${learner.name} doesn't have enough Skill Credits for this session.`, 400);
          }
          throw err;
        }
        run("UPDATE sessions SET status = 'CONFIRMED', updated_at = ? WHERE id = ?", [now, s.id]);
        notify(s.learnerId, "SESSION_REMINDER", "Session confirmed 🎉", `${s.teacher.name} confirmed your ${s.skill.name} session. ${s.credits} credit${s.credits > 1 ? "s" : ""} held.`, "/sessions");
        break;
      }
      case "DECLINE": {
        if (!isTeacher && !isAdmin(actorId)) throw new ApiError("FORBIDDEN", "Only the teacher can decline a session.", 403);
        if (!["REQUESTED"].includes(s.status)) throw new ApiError("INVALID_STATE", "This request can no longer be declined.", 409);
        run("UPDATE sessions SET status = 'CANCELLED', cancelled_by = ?, updated_at = ? WHERE id = ?", [actorId, now, s.id]);
        notify(s.learnerId, "SYSTEM", "Session request declined", `${s.teacher.name} couldn't take your ${s.skill.name} session. Keep swapping — someone else will be a match.`, "/discover");
        break;
      }
      case "CANCEL": {
        if (!["REQUESTED", "CONFIRMED"].includes(s.status)) throw new ApiError("INVALID_STATE", "This session can't be cancelled.", 409);
        const future = new Date(s.startTime).getTime() > Date.now();
        if (s.status === "CONFIRMED" && future) {
          awardCredits(s.learnerId, s.credits, "REFUND", `Refund: cancelled ${s.skill.name} session with ${s.teacher.name}`, s.id);
        }
        run("UPDATE sessions SET status = 'CANCELLED', cancelled_by = ?, updated_at = ? WHERE id = ?", [actorId, now, s.id]);
        const otherId = isTeacher ? s.learnerId : s.teacherId;
        notify(otherId, "SYSTEM", "Session cancelled", `${s[isTeacher ? "learner" : "teacher"].name} cancelled the ${s.skill.name} session.`, "/sessions");
        break;
      }
      case "COMPLETE": {
        if (!["CONFIRMED", "REQUESTED"].includes(s.status)) throw new ApiError("INVALID_STATE", "Only active sessions can be completed.", 409);
        if (!isTeacher && !isLearner && !isAdmin(actorId)) throw new ApiError("FORBIDDEN", "Only participants can complete a session.", 403);
        // Pay the teacher if not already paid
        const paid = get<{ n: number }>(
          "SELECT COUNT(*) AS n FROM credit_transactions WHERE session_id = ? AND type = 'EARNED'",
          [s.id],
        );
        if (Number(paid?.n ?? 0) === 0) {
          awardCredits(s.teacherId, s.credits, "EARNED", `Taught ${s.skill.name} to ${s.learner.name}`, s.id);
          run("UPDATE users SET completed_sessions = completed_sessions + 1, hours_taught = hours_taught + ? WHERE id = ?", [s.duration, s.teacherId]);
          run("UPDATE users SET completed_sessions = completed_sessions + 1 WHERE id = ?", [s.learnerId]);
        }
        run("UPDATE sessions SET status = 'COMPLETED', updated_at = ? WHERE id = ?", [now, s.id]);
        notify(s.learnerId, "SESSION_COMPLETED", "Session completed ✨", `Nice work with ${s.teacher.name}. Rate your experience.`, `/sessions?tab=completed`);
        notify(s.teacherId, "CREDIT", `+${s.credits} Skill Credit${s.credits > 1 ? "s" : ""} earned`, `You taught ${s.skill.name} to ${s.learner.name}.`, "/wallet");
        break;
      }
    }
    return getSessionById(id)!;
  });
}

function isAdmin(userId: string): boolean {
  const u = getUserById(userId);
  return u?.role === "ADMIN" || u?.role === "MODERATOR";
}

export function getUpcomingSessionsForUser(userId: string, limit = 3): SessionDetail[] {
  const now = nowIso();
  const rows = query(
    `${SESSION_SELECT} WHERE (s.teacher_id = ? OR s.learner_id = ?) AND s.status IN ('CONFIRMED','REQUESTED') AND s.end_time >= ? ORDER BY s.start_time ASC LIMIT ?`,
    [userId, userId, now, limit],
  );
  return rows.map(rowToSessionDetail);
}

export function getRecentCompletedSessionsForUser(userId: string, limit = 5): SessionDetail[] {
  const rows = query(
    `${SESSION_SELECT} WHERE (s.teacher_id = ? OR s.learner_id = ?) AND s.status = 'COMPLETED' ORDER BY s.start_time DESC LIMIT ?`,
    [userId, userId, limit],
  );
  return rows.map(rowToSessionDetail);
}

export function countUserSessions(userId: string): { total: number; completed: number; upcoming: number } {
  const row = get<{ total: number; completed: number; upcoming: number }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status IN ('CONFIRMED','REQUESTED') AND end_time >= ? THEN 1 ELSE 0 END) AS upcoming
     FROM sessions WHERE teacher_id = ? OR learner_id = ?`,
    [nowIso(), userId, userId],
  );
  return {
    total: Number(row?.total ?? 0),
    completed: Number(row?.completed ?? 0),
    upcoming: Number(row?.upcoming ?? 0),
  };
}

export { toIso };
export type { SessionWithDetails };
export { safeUserPublic };
