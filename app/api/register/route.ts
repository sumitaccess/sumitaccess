import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail, safeUserWithEmail } from "@/lib/users";
import { STARTER_CREDITS } from "@/lib/constants";
import { awardCredits } from "@/lib/credits";
import { issueOtp } from "@/lib/otp";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(60),
  email: z.string().email("Please enter a valid email.").max(120),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please check your details.";
      return fail("VALIDATION_ERROR", message);
    }
    const { name, email, password } = parsed.data;

    if (getUserByEmail(email)) {
      return fail("EMAIL_TAKEN", "An account with this email already exists. Try logging in.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // New accounts start unverified — an OTP email activates them.
    const user = createUser({ name, email, passwordHash });
    awardCredits(user.id, STARTER_CREDITS, "BONUS", "Welcome to SkillSwap — 3 starter credits 🎉");
    issueOtp(email);

    return ok(
      {
        user: safeUserWithEmail(user),
        starterCredits: STARTER_CREDITS,
        verificationRequired: true,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("register:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
