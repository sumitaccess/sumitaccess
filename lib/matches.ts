import { get, query, run, toCamel, toCamelAll, transaction } from "./db";
import { newId, nowIso } from "./ids";
import { ApiError } from "./api";
import { notify } from "./notifications";
import { getOrCreateConversation } from "./messaging";
import { getUserById, getSkillById } from "./users";
import type { Match } from "@/types";

export interface CreateMatchInput {
  requesterId: string;
  targetId: string;
  requestedSkillId: string; // what requester wants to learn from target
  offeredSkillId?: string | null; // what requester offers in return
  message?: string | null;
  score: number;
}

export function createSwapRequest(input: CreateMatchInput): Match {
  if (input.requesterId === input.targetId) throw new ApiError("VALIDATION_ERROR", "You can't swap with yourself.", 400);
  const target = getUserById(input.targetId);
  if (!target) throw new ApiError("NOT_FOUND", "User not found.", 404);
  const skill = getSkillById(input.requestedSkillId);
  if (!skill) throw new ApiError("VALIDATION_ERROR", "Please choose the skill you want to learn.", 400);

  const [a, b] = input.requesterId < input.targetId ? [input.requesterId, input.targetId] : [input.targetId, input.requesterId];
  const requesterIsA = a === input.requesterId;

  return transaction(() => {
    const existing = get<Record<string, unknown>>("SELECT * FROM matches WHERE user_a_id = ? AND user_b_id = ?", [a, b]);
    if (existing) {
      const m = toCamel<Match>(existing);
      if (m.status === "BLOCKED") throw new ApiError("FORBIDDEN", "This match is not available.", 403);
      if (m.status === "PENDING" || m.status === "ACCEPTED") {
        throw new ApiError("CONFLICT", "A swap request already exists between you two.", 409);
      }
      // Re-open a previously rejected match
      const id = m.id;
      const now = nowIso();
      run(
        `UPDATE matches SET status = 'PENDING', compatibility_score = ?, requested_skill_id = ?, offered_skill_id = ?, request_message = ?, responded_at = NULL, created_at = ? WHERE id = ?`,
        [input.score, input.requestedSkillId, input.offeredSkillId ?? null, input.message?.trim() ?? null, now, id],
      );
      const requester = getUserById(input.requesterId);
      notify(input.targetId, "SWAP_REQUEST", "New swap request", `${requester?.name ?? "Someone"} wants to learn ${skill.name} with you.`, "/messages");
      return toCamel<Match>(get("SELECT * FROM matches WHERE id = ?", [id])!);
    }

    const id = newId();
    run(
      `INSERT INTO matches (id, user_a_id, user_b_id, compatibility_score, status, requested_skill_id, offered_skill_id, request_message, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
      [id, a, b, input.score, input.requestedSkillId, input.offeredSkillId ?? null, input.message?.trim() ?? null, nowIso()],
    );

    const requester = getUserById(input.requesterId);
    notify(input.targetId, "SWAP_REQUEST", "New swap request", `${requester?.name ?? "Someone"} wants to learn ${skill.name} with you.`, "/messages");
    return toCamel<Match>(get("SELECT * FROM matches WHERE id = ?", [id])!);
  });
}

/** Respond to a swap request: ACCEPT | REJECT | BLOCK */
export function respondToMatch(matchId: string, actorId: string, action: "ACCEPT" | "REJECT" | "BLOCK"): Match {
  return transaction(() => {
    const m = getMatchById(matchId);
    if (!m) throw new ApiError("NOT_FOUND", "Swap request not found.", 404);
    if (m.userBId !== actorId && m.userAId !== actorId) throw new ApiError("FORBIDDEN", "Not your swap request.", 403);
    if (m.status !== "PENDING") throw new ApiError("INVALID_STATE", "This request has already been handled.", 409);

    const now = nowIso();
    run("UPDATE matches SET status = ?, responded_at = ? WHERE id = ?", [action, now, matchId]);

    const requesterId = m.userAId;
    const responderId = m.userBId;
    const requester = getUserById(requesterId);
    const responder = getUserById(responderId);

    if (action === "ACCEPT") {
      // Opening a conversation makes it easy to plan the swap
      getOrCreateConversation(requesterId, responderId);
      const skillName = m.requestedSkillId ? getSkillById(m.requestedSkillId)?.name : "";
      notify(requesterId, "REQUEST_ACCEPTED", "Swap request accepted 🎉", `${responder?.name ?? "They"} accepted your request${skillName ? ` for ${skillName}` : ""}. Start planning your session!`, "/messages");
      notify(responderId, "MATCH", "You're matched!", `You're matched with ${requester?.name ?? "them"}. Message them to plan your first swap.`, "/messages");
    } else {
      notify(requesterId, "SYSTEM", action === "REJECT" ? "Swap request declined" : "Swap request blocked", `${responder?.name ?? "They"} ${action === "REJECT" ? "declined" : "blocked"} your swap request.`, "/discover");
    }
    return getMatchById(matchId)!;
  });
}

export function getMatchById(id: string): Match | undefined {
  const row = get("SELECT * FROM matches WHERE id = ?", [id]);
  return row ? toCamel<Match>(row) : undefined;
}

export function getMatchBetween(a: string, b: string): Match | undefined {
  const [x, y] = a < b ? [a, b] : [b, a];
  const row = get("SELECT * FROM matches WHERE user_a_id = ? AND user_b_id = ?", [x, y]);
  return row ? toCamel<Match>(row) : undefined;
}

export function listIncomingRequests(userId: string): Match[] {
  const rows = query(
    "SELECT * FROM matches WHERE user_b_id = ? AND status = 'PENDING' ORDER BY created_at DESC LIMIT 20",
    [userId],
  );
  return toCamelAll<Match>(rows);
}

export function listMatchesForUser(userId: string): Match[] {
  const rows = query(
    "SELECT * FROM matches WHERE (user_a_id = ? OR user_b_id = ?) AND status = 'ACCEPTED' ORDER BY created_at DESC LIMIT 50",
    [userId, userId],
  );
  return toCamelAll<Match>(rows);
}
