import { z } from "zod";
import { requireUser } from "@/lib/session";
import { createReview } from "@/lib/reviews";
import { ApiError, fail, ok, readBody } from "@/lib/api";
import { REVIEW_TAGS } from "@/lib/constants";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(600).optional().nullable(),
  tags: z.array(z.enum(REVIEW_TAGS)).max(5).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Please select a star rating.", 400);

    const review = createReview({
      sessionId: params.id,
      reviewerId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      tags: parsed.data.tags ?? [],
    });
    return ok({ review, message: "Thanks for your review! ⭐" }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("review POST:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
