import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getSessionById } from "@/lib/sessions";
import { createReport } from "@/lib/reports";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/constants";

const schema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const reporter = await requireUser();
    const session = getSessionById(params.id);
    if (!session) return fail("NOT_FOUND", "Session not found.", 404);

    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Please choose a reason.", 400);

    const otherId = session.teacherId === reporter.id ? session.learnerId : session.teacherId;
    const report = createReport({
      reporterId: reporter.id,
      reportedUserId: otherId,
      sessionId: session.id,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    });
    return ok({ report, message: "Report received. Our team will review it." }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("report session:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
