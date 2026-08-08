import { z } from "zod";
import { requireUser } from "@/lib/session";
import { setUserSkills } from "@/lib/users";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { SKILL_LEVELS } from "@/lib/constants";

const skillItem = z.object({
  skillId: z.string().min(1),
  level: z.enum(SKILL_LEVELS).default("INTERMEDIATE"),
  yearsExperience: z.number().int().min(0).max(50).default(0),
  description: z.string().max(300).optional().nullable(),
});

const schema = z.object({
  teach: z.array(skillItem).max(10),
  learn: z.array(skillItem).max(10),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid skills.", 400);

    setUserSkills(user.id, "TEACH", parsed.data.teach);
    setUserSkills(user.id, "LEARN", parsed.data.learn);
    return ok({ message: "Skills updated." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("me skills:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
