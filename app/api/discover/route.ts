import { requireUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getUserById, getSkillsForUsers, safeUser, safeUserPublic } from "@/lib/users";
import { computeMatch } from "@/lib/matching";
import { getMatchBetween } from "@/lib/matches";
import { ApiError, ok } from "@/lib/api";
import type { PersonCard, SafeUser } from "@/types";

// ---------------------------------------------------------------------------
// Discover — paginated people feed scored by the matching engine.
// Filters are applied in SQL; scoring is computed per page. Production would
// push the heavy scoring into the database (e.g. PostgreSQL + pgvector), the
// service boundary is identical.
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const viewer = await requireUser();
    const url = new URL(req.url);

    const q = url.searchParams.get("q")?.trim() ?? "";
    const skill = url.searchParams.get("skill") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const level = url.searchParams.get("level") ?? "";
    const language = url.searchParams.get("language") ?? "";
    const location = url.searchParams.get("location") ?? "";
    const online = url.searchParams.get("online") ?? "";
    const minRating = Number(url.searchParams.get("minRating") ?? 0);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(12, Math.max(4, Number(url.searchParams.get("pageSize") ?? 8)));

    // NOTE: the OR branch must be parenthesised — without it, AND binds tighter
    // and the whole WHERE silently matches every active user.
    const where: string[] = ["u.id != ?", "u.status = 'ACTIVE'", "(u.role = 'USER' OR u.role = 'MODERATOR')"];
    const params: (string | number)[] = [viewer.id];

    if (q) {
      where.push("(LOWER(u.name) LIKE ? OR LOWER(u.headline) LIKE ? OR LOWER(u.location) LIKE ?)");
      const like = `%${q.toLowerCase()}%`;
      params.push(like, like, like);
    }
    if (language) {
      where.push("LOWER(u.languages) LIKE ?");
      params.push(`%${language.toLowerCase()}%`);
    }
    if (location) {
      where.push("LOWER(u.location) LIKE ?");
      params.push(`%${location.toLowerCase()}%`);
    }
    if (online && online !== "ANY") {
      where.push("(u.online_pref = ? OR u.online_pref = 'BOTH')");
      params.push(online);
    }
    if (minRating > 0) {
      where.push("u.rating >= ?");
      params.push(minRating);
    }
    if (skill || category || level) {
      where.push("EXISTS (SELECT 1 FROM user_skills us JOIN skills sk ON sk.id = us.skill_id WHERE us.user_id = u.id AND us.type = 'TEACH'" +
        (skill ? " AND sk.slug = ?" : "") +
        (category ? " AND sk.category = ?" : "") +
        (level ? " AND us.level = ?" : "") +
        ")");
      if (skill) params.push(skill);
      if (category) params.push(category);
      if (level) params.push(level);
    }

    const offset = (page - 1) * pageSize;
    const rows = query(
      `SELECT u.* FROM users u
       WHERE ${where.join(" AND ")}
       ORDER BY u.rating DESC, u.completed_sessions DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize + 1, offset],
    );

    const hasMore = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);

    const ids = pageRows.map((r) => String(r.id));
    const userMap = new Map(ids.map((id) => [id, getUserById(id)!]));
    const skillsMap = getSkillsForUsers(ids);
    const viewerSkills = {
      teach: getSkillsForUsers([viewer.id])[viewer.id]?.filter((s) => s.type === "TEACH") ?? [],
      learn: getSkillsForUsers([viewer.id])[viewer.id]?.filter((s) => s.type === "LEARN") ?? [],
    };

    const cards: PersonCard[] = pageRows.map((r) => {
      const candidate = userMap.get(String(r.id))!;
      const teach = skillsMap[String(r.id)]?.filter((s) => s.type === "TEACH") ?? [];
      const learn = skillsMap[String(r.id)]?.filter((s) => s.type === "LEARN") ?? [];
      const { score, reasons } = computeMatch(viewer, candidate, viewerSkills, { teach, learn });
      const existing = getMatchBetween(viewer.id, candidate.id);
      const safe = safeUserPublic(candidate) as SafeUser;
      return {
        user: safe,
        teach,
        learn,
        matchScore: score,
        matchReasons: reasons,
        matchStatus: existing?.status ?? undefined,
        existingMatchId: existing?.id ?? undefined,
        mutualCount: 0,
      };
    });

    return ok({ cards, page, pageSize, hasMore, total: pageRows.length });
  } catch (err) {
    if (err instanceof ApiError) return new Response(JSON.stringify({ success: false, error: { code: err.code, message: err.message } }), { status: err.status, headers: { "Content-Type": "application/json" } });
    console.error("discover:", err);
    return new Response(JSON.stringify({ success: false, error: { code: "INTERNAL", message: "Something went wrong." } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const dynamic = "force-dynamic";
