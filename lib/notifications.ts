import { get, query, run, toCamelAll } from "./db";
import { newId, nowIso } from "./ids";
import type { Notification } from "@/types";

export function notify(userId: string, type: string, title: string, message: string, link?: string | null): void {
  run(
    `INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [newId(), userId, type, title, message, link ?? null, nowIso()],
  );
}

export function listNotifications(userId: string, limit = 30): Notification[] {
  const rows = query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]);
  return toCamelAll<Notification>(rows).map((n) => ({ ...n, read: Boolean(n.read) }));
}

export function unreadCount(userId: string): number {
  const row = get<{ n: number }>("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0", [userId]);
  return Number(row?.n ?? 0);
}

export function markNotificationRead(userId: string, notificationId: string): void {
  run("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?", [notificationId, userId]);
}

export function markAllNotificationsRead(userId: string): void {
  run("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0", [userId]);
}
