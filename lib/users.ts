import { get, query, run, toCamel, toCamelAll, transaction, type SqlValue } from "./db";
import { newId, nowIso } from "./ids";
import { slugify } from "./utils";
import type { SafeUser, User, UserSkill, Skill } from "@/types";

// ---------------------------------------------------------------------------
// User repository
// ---------------------------------------------------------------------------

export function getUserById(id: string): User | undefined {
  const row = get("SELECT * FROM users WHERE id = ?", [id]);
  return row ? toCamel<User>(row) : undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const row = get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
  return row ? toCamel<User>(row) : undefined;
}

export function getUserByUsername(username: string): User | undefined {
  const row = get("SELECT * FROM users WHERE username = ?", [username]);
  return row ? toCamel<User>(row) : undefined;
}

export function getUserByResetToken(token: string): User | undefined {
  const row = get("SELECT * FROM users WHERE reset_token = ?", [token]);
  return row ? toCamel<User>(row) : undefined;
}

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash?: string | null;
  image?: string | null;
  timezone?: string;
  role?: string;
  verified?: boolean;
}

export function createUser(input: NewUserInput): User {
  const id = newId();
  const now = nowIso();
  const username = uniqueUsername(input.name);
  run(
    `INSERT INTO users (id, name, username, email, password_hash, image, timezone, role, verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      username,
      input.email.toLowerCase().trim(),
      input.passwordHash ?? null,
      input.image ?? null,
      input.timezone ?? "Asia/Kolkata",
      input.role ?? "USER",
      input.verified ? 1 : 0,
      now,
      now,
    ],
  );
  return getUserById(id)!;
}

export function updateUser(id: string, fields: Record<string, string | number | null | undefined>): User | undefined {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0) return getUserById(id);
  const setSql = keys.map((k) => `${snake(k)} = ?`).join(", ");
  const values: SqlValue[] = keys.map((k) => fields[k] as SqlValue);
  run(`UPDATE users SET ${setSql}, updated_at = ? WHERE id = ?`, [...values, nowIso(), id]);
  return getUserById(id);
}

function snake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function touchUser(id: string): void {
  // Throttle: only write if last activity is older than 10 minutes
  const last = get<{ lastActiveAt: string | null }>(
    "SELECT last_active_at AS lastActiveAt FROM users WHERE id = ?",
    [id],
  );
  const lastTime = last?.lastActiveAt ? new Date(last.lastActiveAt).getTime() : 0;
  if (Date.now() - lastTime > 10 * 60_000) {
    run("UPDATE users SET last_active_at = ? WHERE id = ?", [nowIso(), id]);
  }
}

function uniqueUsername(name: string): string {
  const base = slugify(name) || "user";
  const existing = get<{ username: string }>("SELECT username FROM users WHERE username = ?", [base]);
  if (!existing) return base;
  const existingCount = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE username LIKE ?", [`${base}-%`]);
  const n = Number(existingCount?.n ?? 0) + 1;
  return `${base}-${n}`;
}

// ---------------------------------------------------------------------------
// Public projections (never leak email / password hashes)
// ---------------------------------------------------------------------------

export function safeUser(u: User | undefined | null): SafeUser | null {
  if (!u) return null;
  const { id, name, username, image, bio, headline, location, timezone, languages, availability, onlinePref, credits, rating, totalReviews, completedSessions, hoursTaught, role, status, verified, createdAt, updatedAt, lastActiveAt } = u;
  return { id, name, username, image, bio, headline, location, timezone, languages, availability, onlinePref, credits, rating, totalReviews, completedSessions, hoursTaught, role, status, verified, createdAt, updatedAt, lastActiveAt };
}

export function safeUserPublic(u: User | undefined | null): Omit<SafeUser, "credits" | "email"> | null {
  const s = safeUser(u);
  if (!s) return null;
  const { credits: _c, ...rest } = s;
  return rest;
}

export function safeUserWithEmail(u: User | undefined | null): SafeUser | null {
  const s = safeUser(u);
  if (!s) return null;
  return { ...s, email: u!.email };
}

// ---------------------------------------------------------------------------
// User skills
// ---------------------------------------------------------------------------

export interface UserSkillRow extends UserSkill {}

export function getUserSkills(userId: string, type?: "TEACH" | "LEARN"): (UserSkill & { skill: Skill })[] {
  const rows = query(
    `SELECT us.*, s.id AS s_id, s.name AS s_name, s.slug AS s_slug, s.category AS s_category,
            s.description AS s_description, s.icon AS s_icon, s.color AS s_color, s.popularity AS s_popularity
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ? ${type ? "AND us.type = ?" : ""}
     ORDER BY s.popularity DESC`,
    type ? [userId, type] : [userId],
  );
  return rows.map((r) => {
    const base = toCamel<UserSkill>(r);
    const skill: Skill = {
      id: String(r.s_id),
      name: String(r.s_name),
      slug: String(r.s_slug),
      category: String(r.s_category),
      description: r.s_description as string | null,
      icon: r.s_icon as string | null,
      color: r.s_color as string | null,
      popularity: Number(r.s_popularity),
      createdAt: String(r.created_at),
    };
    return { ...base, skill };
  });
}

export function getSkillsForUsers(userIds: string[], type?: "TEACH" | "LEARN"): Record<string, (UserSkill & { skill: Skill })[]> {
  if (userIds.length === 0) return {};
  const placeholders = userIds.map(() => "?").join(",");
  const rows = query(
    `SELECT us.*, s.id AS s_id, s.name AS s_name, s.slug AS s_slug, s.category AS s_category,
            s.description AS s_description, s.icon AS s_icon, s.color AS s_color, s.popularity AS s_popularity
     FROM user_skills us JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id IN (${placeholders}) ${type ? "AND us.type = ?" : ""}`,
    type ? [...userIds, type] : userIds,
  );
  const out: Record<string, (UserSkill & { skill: Skill })[]> = {};
  for (const r of rows) {
    const uid = String(r.user_id);
    if (!out[uid]) out[uid] = [];
    const base = toCamel<UserSkill>(r);
    const skill: Skill = {
      id: String(r.s_id),
      name: String(r.s_name),
      slug: String(r.s_slug),
      category: String(r.s_category),
      description: r.s_description as string | null,
      icon: r.s_icon as string | null,
      color: r.s_color as string | null,
      popularity: Number(r.s_popularity),
      createdAt: String(r.created_at),
    };
    out[uid].push({ ...base, skill });
  }
  return out;
}

export function addUserSkill(
  userId: string,
  skillId: string,
  type: "TEACH" | "LEARN",
  level = "INTERMEDIATE",
  yearsExperience = 0,
  description?: string | null,
): void {
  run(
    `INSERT OR REPLACE INTO user_skills (id, user_id, skill_id, type, level, years_experience, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newId(), userId, skillId, type, level, yearsExperience, description ?? null],
  );
}

export function setUserSkills(
  userId: string,
  type: "TEACH" | "LEARN",
  items: { skillId: string; level?: string; yearsExperience?: number; description?: string | null }[],
): void {
  transaction(() => {
    run("DELETE FROM user_skills WHERE user_id = ? AND type = ?", [userId, type]);
    for (const item of items) {
      addUserSkill(userId, item.skillId, type, item.level, item.yearsExperience, item.description);
    }
  });
}

export function removeUserSkill(userSkillId: string): void {
  run("DELETE FROM user_skills WHERE id = ?", [userSkillId]);
}

// ---------------------------------------------------------------------------
// Skills repository
// ---------------------------------------------------------------------------

export function getAllSkills(): Skill[] {
  return toCamelAll<Skill>(query("SELECT * FROM skills ORDER BY popularity DESC"));
}

export function getSkillBySlug(slug: string): Skill | undefined {
  const row = get("SELECT * FROM skills WHERE slug = ?", [slug]);
  return row ? toCamel<Skill>(row) : undefined;
}

export function getSkillById(id: string): Skill | undefined {
  const row = get("SELECT * FROM skills WHERE id = ?", [id]);
  return row ? toCamel<Skill>(row) : undefined;
}

export function createSkill(input: { name: string; category: string; description?: string; icon?: string; color?: string; popularity?: number }): Skill {
  const id = newId();
  run(
    `INSERT INTO skills (id, name, slug, category, description, icon, color, popularity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name.trim(), slugify(input.name), input.category, input.description ?? null, input.icon ?? null, input.color ?? null, input.popularity ?? 0],
  );
  return getSkillById(id)!;
}

export function updateSkill(id: string, fields: Partial<Pick<Skill, "name" | "category" | "description" | "icon" | "color" | "popularity">>): Skill | undefined {
  const keys = Object.keys(fields).filter((k) => fields[k as keyof typeof fields] !== undefined);
  if (keys.length === 0) return getSkillById(id);
  const setSql = keys.map((k) => `${snake(k)} = ?`).join(", ");
  const values: SqlValue[] = keys.map((k) => fields[k as keyof typeof fields] as SqlValue);
  if (fields.name) values.push(slugify(fields.name));
  run(`UPDATE skills SET ${setSql}${fields.name ? ", slug = ?" : ""} WHERE id = ?`, [...values, id]);
  return getSkillById(id);
}

export function deleteSkill(id: string): void {
  run("DELETE FROM skills WHERE id = ?", [id]);
}
