import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getUserByUsername } from "@/lib/users";
import { createReport } from "@/lib/reports";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/constants";

const schema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { username: string } }) {
  try {
    const reporter = await requireUser();
    const reported = getUserByUsername(params.username);
    if (!reported) return fail("NOT_FOUND", "User not found.", 404);
    if (reported.id === reporter.id) return fail("VALIDATION_ERROR", "You can't report yourself.", 400);

    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Please choose a reason.", 400);

    const report = createReport({
      reporterId: reporter.id,
      reportedUserId: reported.id,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    });
    return ok({ report, message: "Thanks for keeping SkillSwap safe. Our team will review this." }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("report user:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
