import { z } from "zod";
import { issueOtp, OTP_RESEND_COOLDOWN_MS } from "@/lib/otp";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Enter a valid email.");

    const result = issueOtp(parsed.data.email);
    // Don't leak whether the account exists; an already-verified account gets
    // a neutral success too.
    return ok({
      message: result.alreadyVerified ? "This email is already verified — you can sign in." : "A new code is on its way.",
      resendAfterSec: result.alreadyVerified ? 0 : Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
    });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("resend-otp:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
