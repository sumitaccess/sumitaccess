import { z } from "zod";
import { getUserByEmail, updateUser } from "@/lib/users";
import { newToken, toIso } from "@/lib/ids";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Please enter a valid email.");

    const user = getUserByEmail(parsed.data.email);
    if (user) {
      const token = newToken();
      updateUser(user.id, { resetToken: token, resetTokenExpiry: toIso(new Date(Date.now() + 60 * 60 * 1000)) });
      await sendPasswordResetEmail(user.email, user.name, token);
    }
    // Always respond the same way — don't reveal whether the account exists.
    return ok({ message: "If that account exists, a reset link is on its way." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("forgot-password:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
