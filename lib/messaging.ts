import { get, query, run, toCamel, toCamelAll, transaction } from "./db";
import { newId, nowIso } from "./ids";
import { ApiError } from "./api";
import { notify } from "./notifications";
import { getUserById, safeUser, safeUserPublic } from "./users";
import type { Conversation, ConversationWithUser, Message, SafeUser } from "@/types";

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function getOrCreateConversation(userA: string, userB: string): Conversation {
  if (userA === userB) throw new ApiError("VALIDATION_ERROR", "You can't message yourself.", 400);
  const [a, b] = pairKey(userA, userB);
  return transaction(() => {
    let conv = get<Record<string, unknown>>(
      "SELECT * FROM conversations WHERE user_a_id = ? AND user_b_id = ?",
      [a, b],
    );
    if (!conv) {
      const id = newId();
      run(
        `INSERT INTO conversations (id, user_a_id, user_b_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [id, a, b, nowIso(), nowIso()],
      );
      conv = get("SELECT * FROM conversations WHERE id = ?", [id]);
    }
    return toCamel<Conversation>(conv!);
  });
}

export function sendMessage(conversationId: string, senderId: string, content: string, attachment?: { url: string; type: string } | null): Message {
  return transaction(() => {
    const conv = get<{ userAId: string; userBId: string }>(
      "SELECT user_a_id AS userAId, user_b_id AS userBId FROM conversations WHERE id = ?",
      [conversationId],
    );
    if (!conv) throw new ApiError("NOT_FOUND", "Conversation not found.", 404);
    if (conv.userAId !== senderId && conv.userBId !== senderId) throw new ApiError("FORBIDDEN", "Not your conversation.", 403);

    const id = newId();
    const now = nowIso();
    run(
      `INSERT INTO messages (id, conversation_id, sender_id, content, attachment, attachment_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, conversationId, senderId, content.trim(), attachment?.url ?? null, attachment?.type ?? null, now],
    );
    run("UPDATE conversations SET last_message = ?, last_message_at = ?, updated_at = ? WHERE id = ?", [content.trim(), now, now, conversationId]);

    const otherId = conv.userAId === senderId ? conv.userBId : conv.userAId;
    const sender = getUserById(senderId);
    notify(otherId, "MESSAGE", `${sender?.name ?? "Someone"} sent you a message`, content.trim().slice(0, 90), `/messages/${conversationId}`);
    return toCamel<Message>(get("SELECT * FROM messages WHERE id = ?", [id])!);
  });
}

export function listMessages(conversationId: string, userId: string, limit = 100): Message[] {
  const conv = get<{ userAId: string; userBId: string }>(
    "SELECT user_a_id AS userAId, user_b_id AS userBId FROM conversations WHERE id = ?",
    [conversationId],
  );
  if (!conv) throw new ApiError("NOT_FOUND", "Conversation not found.", 404);
  if (conv.userAId !== userId && conv.userBId !== userId) throw new ApiError("FORBIDDEN", "Not your conversation.", 403);
  const rows = query("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?", [conversationId, limit]);
  return toCamelAll<Message>(rows);
}

export function markConversationRead(conversationId: string, userId: string): void {
  run(
    `UPDATE messages SET read_at = ?
     WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
    [nowIso(), conversationId, userId],
  );
}

export function unreadMessagesCount(userId: string): number {
  const row = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE (c.user_a_id = ? OR c.user_b_id = ?) AND m.sender_id != ? AND m.read_at IS NULL`,
    [userId, userId, userId],
  );
  return Number(row?.n ?? 0);
}

export function listConversations(userId: string): ConversationWithUser[] {
  const rows = query(
    `SELECT c.*,
       u.id AS u_id, u.name AS u_name, u.username AS u_username, u.image AS u_image, u.bio AS u_bio,
       u.headline AS u_headline, u.location AS u_location, u.timezone AS u_timezone, u.languages AS u_languages,
       u.availability AS u_availability, u.online_pref AS u_online_pref, u.rating AS u_rating,
       u.total_reviews AS u_total_reviews, u.completed_sessions AS u_completed_sessions,
       u.hours_taught AS u_hours_taught, u.role AS u_role, u.status AS u_status, u.verified AS u_verified,
       u.credits AS u_credits, u.created_at AS u_created_at, u.updated_at AS u_updated_at, u.last_active_at AS u_last_active_at,
       (SELECT COUNT(*) FROM messages m2 WHERE m2.conversation_id = c.id AND m2.sender_id != ? AND m2.read_at IS NULL) AS unread
     FROM conversations c
     JOIN users u ON u.id = CASE WHEN c.user_a_id = ? THEN c.user_b_id ELSE c.user_a_id END
     WHERE c.user_a_id = ? OR c.user_b_id = ?
     ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC`,
    [userId, userId, userId, userId],
  );
  return rows.map((r) => {
    const conv = toCamel<Conversation>(r);
    const other: SafeUser = {
      id: String(r.u_id),
      name: String(r.u_name),
      username: String(r.u_username),
      image: r.u_image as string | null,
      bio: r.u_bio as string | null,
      headline: r.u_headline as string | null,
      location: r.u_location as string | null,
      timezone: String(r.u_timezone ?? "UTC"),
      languages: String(r.u_languages ?? ""),
      availability: r.u_availability as string | null,
      onlinePref: String(r.u_online_pref ?? "ONLINE"),
      rating: Number(r.u_rating ?? 0),
      totalReviews: Number(r.u_total_reviews ?? 0),
      completedSessions: Number(r.u_completed_sessions ?? 0),
      hoursTaught: Number(r.u_hours_taught ?? 0),
      credits: Number(r.u_credits ?? 0),
      role: String(r.u_role ?? "USER"),
      status: String(r.u_status ?? "ACTIVE"),
      verified: Boolean(r.u_verified),
      createdAt: String(r.u_created_at ?? ""),
      updatedAt: String(r.u_updated_at ?? ""),
      lastActiveAt: r.u_last_active_at as string | null,
    };
    return { ...conv, otherUser: other, unreadCount: Number(r.unread ?? 0) };
  });
}

export { safeUser, safeUserPublic };
