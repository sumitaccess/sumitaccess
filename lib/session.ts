import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getUserById, touchUser } from "./users";
import { ApiError } from "./api";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const user = getUserById(id);
  if (user) touchUser(user.id);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiUnauthorizedError();
  }
  if (user.status === "SUSPENDED") {
    throw new ApiError("ACCOUNT_SUSPENDED", "This account is suspended. Contact support if you believe this is a mistake.", 403);
  }
  return user;
}

export class ApiUnauthorizedError extends ApiError {
  constructor() {
    super("UNAUTHORIZED", "Authentication required.", 401);
  }
}
