import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getUserByUsername, getUserSkills, safeUserWithEmail, updateUser } from "@/lib/users";
import { getWallet } from "@/lib/credits";
import { unreadCount } from "@/lib/notifications";
import { unreadMessagesCount } from "@/lib/messaging";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { ONLINE_PREFS } from "@/lib/constants";

export async function GET() {
  try {
    const user = await requireUser();
    const wallet = getWallet(user.id);
    return ok({
      user: safeUserWithEmail(user),
      skills: {
        teach: getUserSkills(user.id, "TEACH"),
        learn: getUserSkills(user.id, "LEARN"),
      },
      credits: wallet.balance,
      unreadNotifications: unreadCount(user.id),
      unreadMessages: unreadMessagesCount(user.id),
      onboardingComplete: Boolean(user.headline || user.location || user.availability),
    });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    return fail("UNAUTHORIZED", "Authentication required.", 401);
  }
}

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  bio: z.string().max(400).optional().nullable(),
  headline: z.string().max(80).optional().nullable(),
  location: z.string().max(80).optional().nullable(),
  timezone: z.string().max(60).optional(),
  languages: z.string().max(120).optional(),
  onlinePref: z.enum(ONLINE_PREFS).optional(),
  availability: z.record(z.string(), z.array(z.string())).optional(),
  image: z.string().max(500).optional().nullable(),
  username: z.string().regex(/^[a-z0-9-]{3,30}$/, "Username can only contain lowercase letters, numbers and dashes.").optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    const data = parsed.data;

    const fields: Record<string, string | number | null | undefined> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (k === "availability" && v) fields[k] = JSON.stringify(v);
      else fields[k] = v as string | null;
    }
    if (data.username && data.username !== user.username) {
      const existing = getUserByUsername(data.username);
      if (existing && existing.id !== user.id) {
        return fail("USERNAME_TAKEN", "That username is already taken.", 409);
      }
    }
    const updated = updateUser(user.id, fields);
    return ok({ user: safeUserWithEmail(updated) });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("me PATCH:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export const dynamic = "force-dynamic";
