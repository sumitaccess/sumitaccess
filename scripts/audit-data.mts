// Seed-data helper for the audit script (reads the live SQLite database)
import { DatabaseSync } from "node:sqlite";

export function getAllSkills() {
  try {
    const db = new DatabaseSync("dev.db");
    const rows = db.prepare("SELECT slug FROM skills").all() as { slug: string }[];
    db.close();
    return rows;
  } catch {
    return [];
  }
}

export function getUsers() {
  try {
    const db = new DatabaseSync("dev.db");
    const rows = db.prepare("SELECT username FROM users WHERE status='ACTIVE' AND role != 'ADMIN'").all() as { username: string }[];
    db.close();
    return rows;
  } catch {
    return [];
  }
}
