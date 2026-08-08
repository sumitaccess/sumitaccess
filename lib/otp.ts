// ============================================================================
// SkillSwap — OTP email verification service.
// Codes are 6 digits, hashed (sha256 + timing-safe compare), expire after
// 10 minutes, and are limited to 5 attempts per code. Resends have a 60s
// cooldown. The same email channel (Resend-compatible) sends the code.
// ============================================================================

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { get, run } from "./db";
import { nowIso, toIso } from "./ids";
import { ApiError } from "./api";
import { getUserByEmail, updateUser } from "./users";
import { sendOtpEmail } from "./email";
import type { User } from "@/types";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60_000;

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Create (or replace) an OTP for a user and email it. Returns seconds until a resend is allowed. */
export function issueOtp(email: string): { resendAfterSec: number; alreadyVerified: boolean } {
  const user = getUserByEmail(email);
  if (!user) {
    // Don't reveal whether the account exists — pretend it worked.
    return { resendAfterSec: OTP_RESEND_COOLDOWN_MS / 1000, alreadyVerified: false };
  }
  if (user.emailVerified) return { resendAfterSec: 0, alreadyVerified: true };

  // Cooldown: refuse if a code was issued in the last 60s
  if (user.otpExpiry) {
    const issuedAt = new Date(user.otpExpiry).getTime() - OTP_TTL_MINUTES * 60_000;
    const remaining = OTP_RESEND_COOLDOWN_MS - (Date.now() - issuedAt);
    if (remaining > 0) {
      throw new ApiError("OTP_COOLDOWN", `Please wait ${Math.ceil(remaining / 1000)}s before requesting a new code.`, 429);
    }
  }

  const code = generateOtp();
  const expiry = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  updateUser(user.id, {
    otpHash: hashOtp(code),
    otpExpiry: toIso(expiry),
    otpAttempts: 0,
  });
  void sendOtpEmail(user.email, user.name, code);
  return { resendAfterSec: OTP_RESEND_COOLDOWN_MS / 1000, alreadyVerified: false };
}

/** Verify a submitted code. Throws a friendly ApiError on failure. */
export function verifyOtp(email: string, code: string): User {
  const user = getUserByEmail(email);
  if (!user || user.emailVerified) {
    throw new ApiError("INVALID_OTP", "That code isn't valid. Check it and try again.", 400);
  }
  if (!user.otpHash || !user.otpExpiry) {
    throw new ApiError("NO_OTP", "No code was requested for this account. Request a new one.", 400);
  }
  if (new Date(user.otpExpiry).getTime() < Date.now()) {
    throw new ApiError("OTP_EXPIRED", "This code has expired. Request a new one.", 400);
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError("OTP_LOCKED", "Too many attempts. Request a new code.", 429);
  }

  if (!safeEqual(user.otpHash, hashOtp(code.trim()))) {
    run("UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?", [user.id]);
    const remaining = OTP_MAX_ATTEMPTS - (user.otpAttempts + 1);
    throw new ApiError(
      "INVALID_OTP",
      remaining > 0 ? `That code isn't correct. ${remaining} attempt${remaining > 1 ? "s" : ""} left.` : "Too many attempts. Request a new code.",
      remaining > 0 ? 400 : 429,
    );
  }

  const verified = updateUser(user.id, {
    emailVerified: nowIso(),
    otpHash: null,
    otpExpiry: null,
    otpAttempts: 0,
  });
  return verified!;
}
