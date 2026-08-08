import { DatabaseSync, type StatementSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Database connection. Uses Node's built-in SQLite driver (node:sqlite) so
// the app runs with zero external services. The schema (db/schema.sql) is a
// 1:1 mirror of prisma/schema.prisma, which is the canonical PostgreSQL
// schema for production deployments.
// ---------------------------------------------------------------------------

// `process.cwd()` is the project root both when running scripts via tsx and
// inside the Next.js server runtime (compiled `__dirname` would point into
// .next/, so it can't be used here).
const projectRoot = process.cwd();

function resolveDbFile(url: string): string {
  // Accept "file:./dev.db" style URLs from DATABASE_URL
  const match = url.match(/^file:(.+)$/);
  const rel = match ? match[1] : url;
  const p = rel.startsWith("/") ? rel : path.join(projectRoot, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

const dbPath = resolveDbFile(process.env.DATABASE_URL || "file:./dev.db");

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

/** Apply the DDL schema file (idempotent). */
export function applySchema(): void {
  const sql = fs.readFileSync(path.join(projectRoot, "db", "schema.sql"), "utf8");
  db.exec(sql);
  migrate();
}

/**
 * Idempotent migrations for databases created before a column existed.
 * (SQLite has no ADD COLUMN IF NOT EXISTS, so we check PRAGMA table_info.)
 */
function migrate(): void {
  const columns = db.prepare("PRAGMA table_info(users)").all().map((r) => (r as { name: string }).name);
  const addCol = (name: string, ddl: string) => {
    if (!columns.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${ddl}`);
  };
  addCol("otp_hash", "otp_hash TEXT");
  addCol("otp_expiry", "otp_expiry TEXT");
  addCol("otp_attempts", "otp_attempts INTEGER NOT NULL DEFAULT 0");
}

// ---------------------------------------------------------------------------
// Typed query helpers
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

export type SqlValue = string | number | bigint | null | Uint8Array;

function normParams(params: SqlValue | SqlValue[] = []): SqlValue[] {
  return Array.isArray(params) ? params : [params];
}

export function query<T extends Row = Row>(sql: string, params: SqlValue | SqlValue[] = []): T[] {
  return db.prepare(sql).all(...normParams(params)) as T[];
}

export function get<T extends Row = Row>(sql: string, params: SqlValue | SqlValue[] = []): T | undefined {
  return db.prepare(sql).get(...normParams(params)) as T | undefined;
}

export interface RunResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export function run(sql: string, params: SqlValue | SqlValue[] = []): RunResult {
  return db.prepare(sql).run(...normParams(params));
}

export function prepare(sql: string): StatementSync {
  return db.prepare(sql);
}

let txDepth = 0;

/** Execute `fn` inside a transaction (nested calls use savepoints). Rolls back on error. */
export function transaction<T>(fn: () => T): T {
  const isRoot = txDepth === 0;
  if (isRoot) {
    db.exec("BEGIN IMMEDIATE");
  } else {
    db.exec("SAVEPOINT sp");
  }
  txDepth++;
  try {
    const result = fn();
    if (isRoot) db.exec("COMMIT");
    else db.exec("RELEASE sp");
    txDepth--;
    return result;
  } catch (err) {
    if (isRoot) db.exec("ROLLBACK");
    else db.exec("ROLLBACK TO sp; RELEASE sp");
    txDepth--;
    throw err;
  }
}

/** Convert snake_case DB rows to camelCase JS objects. */
export function toCamel<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    out[key] = v;
  }
  return out as T;
}

export function toCamelAll<T = Record<string, unknown>>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => toCamel<T>(r));
}
