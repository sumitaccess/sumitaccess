import { z } from "zod";
import { requireUser } from "@/lib/session";
import { sendMessage } from "@/lib/messaging";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  content: z.string().min(1, "Message can't be empty.").max(2000),
  attachment: z
    .object({ url: z.string().max(500), type: z.string().max(40) })
    .optional()
    .nullable(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Message can't be empty.", 400);

    const message = sendMessage(params.id, user.id, parsed.data.content, parsed.data.attachment ?? null);
    return ok({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("message POST:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
