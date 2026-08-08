import { get, query, run, toCamel, toCamelAll } from "./db";
import { newId, nowIso } from "./ids";
import { ApiError } from "./api";
import type { Report } from "@/types";

export interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  sessionId?: string | null;
  reason: string;
  details?: string | null;
}

export function createReport(input: CreateReportInput): Report {
  if (input.reporterId === input.reportedUserId) throw new ApiError("VALIDATION_ERROR", "You can't report yourself.", 400);
  const id = newId();
  run(
    `INSERT INTO reports (id, reporter_id, reported_user_id, session_id, type, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`,
    [id, input.reporterId, input.reportedUserId, input.sessionId ?? null, input.sessionId ? "SESSION" : "USER", input.reason, input.details ?? null, nowIso()],
  );
  return toCamel<Report>(get("SELECT * FROM reports WHERE id = ?", [id])!);
}

export function listReports(status?: string): (Report & { reporterName: string; reportedName: string })[] {
  const rows = query(
    `SELECT r.*, ru.name AS reporter_name, rp.name AS reported_name
     FROM reports r
     JOIN users ru ON ru.id = r.reporter_id
     JOIN users rp ON rp.id = r.reported_user_id
     ${status ? "WHERE r.status = ?" : ""}
     ORDER BY r.created_at DESC LIMIT 200`,
    status ? [status] : [],
  );
  return rows.map((r) => ({ ...toCamel<Report>(r), reporterName: String(r.reporter_name), reportedName: String(r.reported_name) }));
}

export function updateReportStatus(id: string, status: "RESOLVED" | "DISMISSED", adminNote?: string | null): Report | undefined {
  const r = get("SELECT * FROM reports WHERE id = ?", [id]);
  if (!r) throw new ApiError("NOT_FOUND", "Report not found.", 404);
  run("UPDATE reports SET status = ?, admin_note = ? WHERE id = ?", [status, adminNote ?? null, id]);
  return toCamel<Report>(get("SELECT * FROM reports WHERE id = ?", [id])!);
}
