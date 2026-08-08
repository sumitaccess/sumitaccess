import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByResetToken, updateUser } from "@/lib/users";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");

    const target = getUserByResetToken(parsed.data.token);
    if (!target || !target.resetTokenExpiry || new Date(target.resetTokenExpiry).getTime() < Date.now()) {
      return fail("INVALID_TOKEN", "This reset link is invalid or has expired. Please request a new one.", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    updateUser(target.id, { passwordHash, resetToken: null, resetTokenExpiry: null });
    return ok({ message: "Password updated. You can now sign in." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("reset-password:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
