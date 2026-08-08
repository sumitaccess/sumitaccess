import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/session";
import { updateUser } from "@/lib/users";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Use at least 8 characters.").max(72),
  });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid password.", 400);

    if (!user.passwordHash) {
      return fail("NO_PASSWORD", "This account uses social login. Set a password by resetting it first.", 400);
    }
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return fail("WRONG_PASSWORD", "Your current password isn't correct.", 400);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    updateUser(user.id, { passwordHash });
    return ok({ message: "Password updated." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("me password:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
