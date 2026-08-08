import { z } from "zod";
import { requireUser } from "@/lib/session";
import { createSessionRequest, listSessionsForUser } from "@/lib/sessions";
import { ApiError, fail, ok, readBody } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") ?? "upcoming";
    const sessions = listSessionsForUser(user.id, tab as "upcoming" | "completed" | "cancelled" | "pending");
    return ok({ sessions });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("sessions GET:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

const schema = z.object({
  teacherId: z.string().min(1),
  skillId: z.string().min(1),
  startTime: z.string().min(1),
  duration: z.number().int().min(15).max(240).default(60),
  sessionType: z.enum(["ONLINE", "IN_PERSON"]).default("ONLINE"),
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  credits: z.number().int().min(1).max(5).default(1),
});

export async function POST(req: Request) {
  try {
    const learner = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Please complete the booking.", 400);

    const session = createSessionRequest({ ...parsed.data, learnerId: learner.id }, learner.id);
    return ok({ session, message: "Session request sent! The teacher will confirm shortly." }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("session POST:", err);
    return fail("INTERNAL", "Something went wrong. Please try again.", 500);
  }
}

export const dynamic = "force-dynamic";
