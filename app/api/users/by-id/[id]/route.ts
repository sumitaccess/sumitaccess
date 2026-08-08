import { getUserById, safeUserPublic } from "@/lib/users";
import { ApiError, fail, ok } from "@/lib/api";
import type { SafeUser } from "@/types";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserById(params.id);
    if (!user || user.status !== "ACTIVE") return fail("NOT_FOUND", "User not found.", 404);
    return ok({ user: safeUserPublic(user) as SafeUser });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
