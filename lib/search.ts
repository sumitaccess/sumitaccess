import { query, toCamel, toCamelAll } from "./db";
import { safeUser, safeUserPublic } from "./users";
import type { SafeUser, Skill } from "@/types";

// ---------------------------------------------------------------------------
// Global search: users, skills, categories. Debouncing happens on the client.
// ---------------------------------------------------------------------------

export interface SearchResults {
  users: (SafeUser & { match: string })[];
  skills: Skill[];
  categories: { key: string; label: string; count: number }[];
}

export function globalSearch(term: string, limit = 5): SearchResults {
  const q = `%${term.trim().toLowerCase()}%`;

  const userRows = query(
    `SELECT * FROM users
     WHERE (LOWER(name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(headline) LIKE ? OR LOWER(location) LIKE ?)
       AND status = 'ACTIVE'
     ORDER BY rating DESC LIMIT ?`,
    [q, q, q, q, limit],
  );
  const users = userRows
    .map((r) => {
      const u = toCamel<import("@/types").User>(r);
      return safeUser(u);
    })
    .filter(Boolean)
    .map((u) => ({ ...(u as SafeUser), match: "user" }));

  const skillRows = query(
    `SELECT * FROM skills WHERE LOWER(name) LIKE ? OR LOWER(slug) LIKE ? ORDER BY popularity DESC LIMIT ?`,
    [q, q, limit],
  );
  const skills = toCamelAll<Skill>(skillRows);

  const catRows = query(
    `SELECT category, COUNT(*) AS n FROM skills WHERE LOWER(category) LIKE ? GROUP BY category ORDER BY n DESC LIMIT ?`,
    [q, limit],
  );

  return {
    users,
    skills,
    categories: catRows.map((r) => ({
      key: String(r.category),
      label: String(r.category).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      count: Number(r.n),
    })),
  };
}
