import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getUserById, touchUser } from "./users";
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
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return user;
}

export class ApiUnauthorizedError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "ApiUnauthorizedError";
  }
}
