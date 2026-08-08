import { getUserByEmail } from "@/lib/users";
import { fail, ok } from "@/lib/api";

// Lightweight pre-login check so the login form can show a tailored message
// ("verify your email first") instead of a generic credentials error.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) return fail("VALIDATION_ERROR", "Missing email.");

  const user = getUserByEmail(email);
  if (!user) return ok({ userExists: false, emailVerified: false });
  return ok({ userExists: true, emailVerified: Boolean(user.emailVerified) });
}

export const dynamic = "force-dynamic";
