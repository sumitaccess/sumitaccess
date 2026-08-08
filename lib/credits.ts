import { get, query, run, toCamelAll, transaction } from "./db";
import { newId, nowIso } from "./ids";
import type { CreditTransaction, WalletSummary } from "@/types";
import { ApiError } from "./api";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Not enough Skill Credits.");
    this.name = "InsufficientCreditsError";
  }
}

function insertTx(userId: string, amount: number, type: string, description: string, balanceAfter: number, sessionId?: string | null): void {
  run(
    `INSERT INTO credit_transactions (id, user_id, amount, type, description, balance_after, session_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), userId, amount, type, description, balanceAfter, sessionId ?? null, nowIso()],
  );
}

/** Add credits to a user's balance. Always records a transaction. */
export function awardCredits(userId: string, amount: number, type: string, description: string, sessionId?: string | null): number {
  return transaction(() => {
    const user = get<{ credits: number }>("SELECT credits FROM users WHERE id = ?", [userId]);
    if (!user) throw new ApiError("NOT_FOUND", "User not found.", 404);
    const balance = Number(user.credits) + amount;
    run("UPDATE users SET credits = ? WHERE id = ?", [balance, userId]);
    insertTx(userId, amount, type, description, balance, sessionId);
    return balance;
  });
}

/** Spend credits. Throws if the balance is insufficient. Always records a transaction. */
export function spendCredits(userId: string, amount: number, type: string, description: string, sessionId?: string | null): number {
  return transaction(() => {
    const user = get<{ credits: number }>("SELECT credits FROM users WHERE id = ?", [userId]);
    if (!user) throw new ApiError("NOT_FOUND", "User not found.", 404);
    const balance = Number(user.credits) - amount;
    if (balance < 0) throw new InsufficientCreditsError();
    run("UPDATE users SET credits = ? WHERE id = ?", [balance, userId]);
    insertTx(userId, -amount, type, description, balance, sessionId);
    return balance;
  });
}

export function listTransactions(userId: string, limit = 50): CreditTransaction[] {
  return toCamelAll<CreditTransaction>(
    query("SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]),
  );
}

export function getWallet(userId: string): WalletSummary {
  const balanceRow = get<{ credits: number }>("SELECT credits FROM users WHERE id = ?", [userId]);
  const balance = Number(balanceRow?.credits ?? 0);
  const totals = get<{ earned: number; spent: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS earned,
       COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS spent
     FROM credit_transactions WHERE user_id = ?`,
    [userId],
  );
  const transactions = listTransactions(userId, 100);

  // Daily balance history for the wallet chart (oldest → newest)
  const byDay = new Map<string, number>();
  for (const tx of [...transactions].reverse()) {
    byDay.set(tx.createdAt.slice(0, 10), tx.balanceAfter);
  }
  const history = [...byDay.entries()].map(([date, bal]) => ({ date, balance: bal }));

  return {
    balance,
    totalEarned: Number(totals?.earned ?? 0),
    totalSpent: Number(totals?.spent ?? 0),
    transactions,
    history,
  };
}
