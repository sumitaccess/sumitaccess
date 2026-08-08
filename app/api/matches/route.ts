import { z } from "zod";
import { requireUser } from "@/lib/session";
import { createSwapRequest } from "@/lib/matches";
import { getUserById } from "@/lib/users";
import { computeMatch } from "@/lib/matching";
import { getSkillsForUsers } from "@/lib/users";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  targetId: z.string().min(1),
  requestedSkillId: z.string().min(1, "Choose the skill you want to learn."),
  offeredSkillId: z.string().optional().nullable(),
  message: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const requester = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Please complete the request.", 400);

    const target = getUserById(parsed.data.targetId);
    if (!target || target.status !== "ACTIVE") return fail("NOT_FOUND", "User not found.", 404);

    // Compute the real compatibility score for the match record
    const requesterSkills = getSkillsForUsers([requester.id])[requester.id] ?? [];
    const targetSkills = getSkillsForUsers([target.id])[target.id] ?? [];
    const { score } = computeMatch(
      requester,
      target,
      {
        teach: requesterSkills.filter((s) => s.type === "TEACH"),
        learn: requesterSkills.filter((s) => s.type === "LEARN"),
      },
      {
        teach: targetSkills.filter((s) => s.type === "TEACH"),
        learn: targetSkills.filter((s) => s.type === "LEARN"),
      },
    );

    const match = createSwapRequest({
      requesterId: requester.id,
      targetId: target.id,
      requestedSkillId: parsed.data.requestedSkillId,
      offeredSkillId: parsed.data.offeredSkillId ?? null,
      message: parsed.data.message ?? null,
      score,
    });

    return ok({ match, message: "Swap request sent! 🎉" }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("swap request:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}
