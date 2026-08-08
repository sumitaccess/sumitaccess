import { z } from "zod";
import { verifyOtp } from "@/lib/otp";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Enter the 6-digit code.");

    const user = verifyOtp(parsed.data.email, parsed.data.code);
    return ok({ message: "Email verified. You can now sign in.", emailVerified: Boolean(user.emailVerified) });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("verify-otp:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
