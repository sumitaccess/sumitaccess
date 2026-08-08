import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getUserById, safeUserWithEmail, updateUser } from "@/lib/users";
import { awardCredits } from "@/lib/credits";
import { notify } from "@/lib/notifications";
import { ApiError, fail, ok, readBody } from "@/lib/api";

const schema = z.object({
  action: z.enum(["SUSPEND", "UNSUSPEND", "ADJUST_CREDITS", "SET_ROLE"]),
  amount: z.number().int().optional(),
  reason: z.string().max(300).optional().nullable(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireUser();
    if (admin.role !== "ADMIN") return fail("FORBIDDEN", "Admin access required.", 403);
    const target = getUserById(params.id);
    if (!target) return fail("NOT_FOUND", "User not found.", 404);

    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid input.", 400);

    switch (parsed.data.action) {
      case "SUSPEND":
        updateUser(target.id, { status: "SUSPENDED" });
        notify(target.id, "SYSTEM", "Account suspended", "Your account has been suspended. Contact support if you believe this is a mistake.", "/");
        return ok({ message: `${target.name} suspended.` });
      case "UNSUSPEND":
        updateUser(target.id, { status: "ACTIVE" });
        notify(target.id, "SYSTEM", "Account reactivated", "Your account has been reactivated. Welcome back!", "/");
        return ok({ message: `${target.name} reactivated.` });
      case "ADJUST_CREDITS": {
        const amount = Number(parsed.data.amount ?? 0);
        if (!Number.isFinite(amount) || amount === 0) return fail("VALIDATION_ERROR", "Enter a non-zero amount.", 400);
        const balance = awardCredits(target.id, amount, "ADMIN_ADJUSTMENT", parsed.data.reason ?? "Adjusted by SkillSwap team");
        notify(target.id, "CREDIT", `Credits adjusted`, `Your balance was adjusted by ${amount > 0 ? "+" : ""}${amount}. New balance: ${balance}.`, "/wallet");
        return ok({ message: `Balance adjusted. New balance: ${balance}.` });
      }
      case "SET_ROLE": {
        if (!parsed.data.role) return fail("VALIDATION_ERROR", "Choose a role.", 400);
        updateUser(target.id, { role: parsed.data.role });
        return ok({ message: `${target.name} is now ${parsed.data.role.toLowerCase()}.` });
      }
    }
    return fail("VALIDATION_ERROR", "Invalid action.", 400);
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("admin user action:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
