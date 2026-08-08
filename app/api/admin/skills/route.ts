import { z } from "zod";
import { requireUser } from "@/lib/session";
import { createSkill, deleteSkill } from "@/lib/users";
import { CATEGORIES } from "@/lib/constants";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).max(60),
  category: z.enum(CATEGORIES.map((c) => c.key) as unknown as [string, ...string[]]),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireUser();
    if (admin.role !== "ADMIN") return fail("FORBIDDEN", "Admin access required.", 403);
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid skill.", 400);

    const skill = createSkill({
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description ?? undefined,
      icon: parsed.data.icon ?? undefined,
      color: parsed.data.color ?? undefined,
    });
    return ok({ skill }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin create skill:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireUser();
    if (admin.role !== "ADMIN") return fail("FORBIDDEN", "Admin access required.", 403);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return fail("VALIDATION_ERROR", "Missing skill id.", 400);
    deleteSkill(id);
    return ok({ message: "Skill removed." });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin delete skill:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
