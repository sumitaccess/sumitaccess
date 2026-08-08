import { randomUUID, randomBytes } from "node:crypto";

/** Generate a random, URL-safe identifier (UUID v4). */
export function newId(): string {
  return randomUUID();
}

/** Short random token for password reset links. */
export function newToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/** Current UTC time as a sortable ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO string (or null) for a Date. */
export function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

export function isoToDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
