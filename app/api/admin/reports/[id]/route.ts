import { z } from "zod";
import { requireUser } from "@/lib/session";
import { updateReportStatus } from "@/lib/reports";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  action: z.enum(["RESOLVE", "DISMISS"]),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireUser();
    if (admin.role !== "ADMIN" && admin.role !== "MODERATOR") return fail("FORBIDDEN", "Admin access required.", 403);
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid action.", 400);

    const report = updateReportStatus(params.id, parsed.data.action === "RESOLVE" ? "RESOLVED" : "DISMISSED", parsed.data.note ?? null);
    return ok({ report, message: parsed.data.action === "RESOLVE" ? "Report resolved." : "Report dismissed." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin report:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
