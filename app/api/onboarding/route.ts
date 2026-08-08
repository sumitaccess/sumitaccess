import { z } from "zod";
import { requireUser } from "@/lib/session";
import { setUserSkills, updateUser, safeUserWithEmail } from "@/lib/users";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { SKILL_LEVELS, USER_SKILL_TYPES, ONLINE_PREFS } from "@/lib/constants";

const skillItem = z.object({
  skillId: z.string().min(1),
  level: z.enum(SKILL_LEVELS).default("INTERMEDIATE"),
  yearsExperience: z.number().int().min(0).max(50).default(0),
  description: z.string().max(300).optional().nullable(),
});

const schema = z.object({
  teach: z.array(skillItem).max(10),
  learn: z.array(skillItem).max(10),
  availability: z.record(z.string(), z.array(z.string())).optional(),
  timezone: z.string().min(1).max(60),
  location: z.string().min(1, "Please enter your city.").max(80),
  onlinePref: z.enum(ONLINE_PREFS).default("ONLINE"),
  headline: z.string().max(80).optional().nullable(),
  bio: z.string().max(400).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  languages: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Please complete the form.", 400);
    }
    const { teach, learn, availability, timezone, location, onlinePref, headline, bio, image, languages } = parsed.data;

    setUserSkills(user.id, "TEACH", teach);
    setUserSkills(user.id, "LEARN", learn);

    const updated = updateUser(user.id, {
      availability: availability ? JSON.stringify(availability) : null,
      timezone,
      location,
      onlinePref,
      headline: headline ?? null,
      bio: bio ?? null,
      image: image ?? null,
      languages: languages ?? "English",
    });

    return ok({ user: safeUserWithEmail(updated), message: "Your profile is ready. Let's find your matches." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("onboarding:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
