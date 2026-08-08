import { get, query, toCamel, toCamelAll } from "./db";
import type { SafeUser, Session, User } from "@/types";
import { safeUser } from "./users";

export interface AdminMetrics {
  users: number;
  activeUsers: number;
  newThisWeek: number;
  suspendedUsers: number;
  sessions: number;
  pendingSessions: number;
  completedSwaps: number;
  creditsExchanged: number;
  totalReviews: number;
  avgRating: number;
  openReports: number;
  revenue: number; // monetization-ready placeholder (paid expert sessions / credits packs)
  sessionsByDay: { date: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
  topSkills: { name: string; count: number }[];
}

export function getAdminMetrics(): AdminMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const totalUsers = get<{ n: number }>("SELECT COUNT(*) AS n FROM users");
  const activeUsers = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE last_active_at >= ?", [thirtyDaysAgo]);
  const newThisWeek = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", [sevenDaysAgo]);
  const suspended = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE status = 'SUSPENDED'");
  const sessions = get<{ n: number }>("SELECT COUNT(*) AS n FROM sessions");
  const pendingSessions = get<{ n: number }>("SELECT COUNT(*) AS n FROM sessions WHERE status = 'REQUESTED'");
  const completed = get<{ n: number }>("SELECT COUNT(*) AS n FROM sessions WHERE status = 'COMPLETED'");
  const credits = get<{ n: number }>("SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END),0) AS n FROM credit_transactions");
  const reviews = get<{ n: number }>("SELECT COUNT(*) AS n FROM reviews");
  const avgRating = get<{ avg: number }>("SELECT AVG(rating) AS avg FROM reviews");
  const openReports = get<{ n: number }>("SELECT COUNT(*) AS n FROM reports WHERE status = 'OPEN'");

  const sessionsByDay = query(
    `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM sessions WHERE created_at >= ? GROUP BY substr(created_at, 1, 10) ORDER BY date ASC`,
    [thirtyDaysAgo],
  ).map((r) => ({ date: String(r.date), count: Number(r.count) }));

  const signupsByDay = query(
    `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM users WHERE created_at >= ? GROUP BY substr(created_at, 1, 10) ORDER BY date ASC`,
    [thirtyDaysAgo],
  ).map((r) => ({ date: String(r.date), count: Number(r.count) }));

  const topSkills = query(
    `SELECT s.name AS name, COUNT(*) AS count FROM sessions s2 JOIN skills s ON s.id = s2.skill_id GROUP BY s.name ORDER BY count DESC LIMIT 8`,
  ).map((r) => ({ name: String(r.name), count: Number(r.count) }));

  return {
    users: Number(totalUsers?.n ?? 0),
    activeUsers: Number(activeUsers?.n ?? 0),
    newThisWeek: Number(newThisWeek?.n ?? 0),
    suspendedUsers: Number(suspended?.n ?? 0),
    sessions: Number(sessions?.n ?? 0),
    pendingSessions: Number(pendingSessions?.n ?? 0),
    completedSwaps: Number(completed?.n ?? 0),
    creditsExchanged: Number(credits?.n ?? 0),
    totalReviews: Number(reviews?.n ?? 0),
    avgRating: Number(avgRating?.avg ?? 0),
    openReports: Number(openReports?.n ?? 0),
    revenue: 0,
    sessionsByDay,
    signupsByDay,
    topSkills,
  };
}

export function listAllUsers(search?: string, limit = 100): SafeUser[] {
  const rows = query(
    `SELECT * FROM users
     ${search ? "WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(username) LIKE ?" : ""}
     ORDER BY created_at DESC LIMIT ?`,
    search ? [`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, limit] : [limit],
  );
  return rows.map((r) => safeUser(toCamel<User>(r))!).filter(Boolean);
}

export function listRecentSessions(limit = 30): (Session & { teacherName: string; learnerName: string; skillName: string })[] {
  const rows = query(
    `SELECT s.*, t.name AS teacher_name, l.name AS learner_name, sk.name AS skill_name
     FROM sessions s
     JOIN users t ON t.id = s.teacher_id
     JOIN users l ON l.id = s.learner_id
     JOIN skills sk ON sk.id = s.skill_id
     ORDER BY s.created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...toCamel<Session>(r), teacherName: String(r.teacher_name), learnerName: String(r.learner_name), skillName: String(r.skill_name) }));
}
